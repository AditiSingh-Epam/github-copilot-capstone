import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { createTaskRepository, openDatabase } from "./database.js";
import { createTaskService } from "./task-service.js";

const allowedOrigin = "http://127.0.0.1:3000";
const host = "127.0.0.1:3000";

function setup() {
  const database = openDatabase(":memory:");
  const logger = { error: vi.fn() };
  let clockTick = 0;
  const service = createTaskService(createTaskRepository(database), {
    clock: () => new Date(Date.parse("2026-10-22T12:34:56.789Z") + clockTick++),
    idFactory: () => crypto.randomUUID(),
  });
  const app = createApp({ service, allowedOrigin, logger, serveClient: false });
  return { app, database, logger };
}

function localApi(client, method, url) {
  return client[method](url).set("Host", host);
}

describe("task HTTP API (P-US-01, P-US-02, P-US-04, P-ERR-01)", () => {
  it("creates with approved defaults and returns the approved envelope and Location", async () => {
    const { app, database } = setup();
    const response = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .set("Content-Type", "application/json")
      .send({ title: "  Buy tea  " });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/tasks/${response.body.data.id}`);
    expect(response.body.data).toMatchObject({
      title: "Buy tea",
      description: "",
      completed: false,
      priority: "Medium",
      dueDate: null,
      createdAt: "2026-10-22T12:34:56.789Z",
    });
    expect(response.body.data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    database.close();
  });

  it("returns clear 400 validation errors for invalid creates", async () => {
    const { app, database } = setup();
    const response = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: " ", priority: "urgent", dueDate: "2026-02-30" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Validation failed");
    expect(response.body.error.fields).toMatchObject({
      title: expect.any(String),
      priority: expect.any(String),
      dueDate: expect.any(String),
    });
    expect(response.text).not.toContain("stack");
    database.close();
  });

  it("rejects explicitly null dueDate with a field validation error", async () => {
    const { app, database } = setup();
    const response = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Null date", dueDate: null });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fields: {
          dueDate: "Due date must be a valid calendar date in YYYY-MM-DD format.",
        },
      },
    });
    expect((await localApi(request(app), "get", "/api/tasks")).body.data).toEqual([]);
    database.close();
  });

  it("rejects unknown create fields with a clear validation envelope", async () => {
    const { app, database } = setup();
    const response = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Unknown property", isAdmin: true });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        message: "Validation failed",
        fields: { body: "Unknown fields are not allowed." },
      },
    });
    expect((await localApi(request(app), "get", "/api/tasks")).body.data).toEqual([]);
    database.close();
  });

  it("allows duplicate titles as separate persisted tasks", async () => {
    const { app, database } = setup();
    const first = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Duplicate allowed" });
    const second = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Duplicate allowed" });
    const listed = await localApi(request(app), "get", "/api/tasks");

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.id).not.toBe(second.body.data.id);
    expect(listed.body.data.filter((task) => task.title === "Duplicate allowed")).toHaveLength(2);
    database.close();
  });

  it("persists concurrent independent create requests without imposing same-task conflict semantics", async () => {
    const { app, database } = setup();
    const responses = await Promise.all([
      localApi(request(app), "post", "/api/tasks")
        .set("Origin", allowedOrigin)
        .send({ title: "Concurrent one" }),
      localApi(request(app), "post", "/api/tasks")
        .set("Origin", allowedOrigin)
        .send({ title: "Concurrent two" }),
    ]);
    const listed = await localApi(request(app), "get", "/api/tasks");

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(new Set(responses.map((response) => response.body.data.id)).size).toBe(2);
    expect(listed.body.data.map((task) => task.title)).toEqual(
      expect.arrayContaining(["Concurrent one", "Concurrent two"]),
    );
    database.close();
  });

  it("lists all tasks newest-first and applies approved status filters", async () => {
    const { app, database } = setup();
    const first = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin).send({ title: "Earlier" });
    const second = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin).send({ title: "Later" });

    const all = await localApi(request(app), "get", "/api/tasks");
    const pending = await localApi(request(app), "get", "/api/tasks?status=pending");
    const completed = await localApi(request(app), "get", "/api/tasks?status=completed");
    expect(all.status).toBe(200);
    expect(all.body.data.map((task) => task.id)).toEqual([
      second.body.data.id,
      first.body.data.id,
    ]);
    expect(pending.body.data).toHaveLength(2);
    expect(completed.body.data).toEqual([]);
    expect((await localApi(request(app), "get", "/api/tasks?status=unexpected")).status).toBe(400);
    database.close();
  });

  it("inspects a task and returns exact not-found responses for malformed or missing IDs", async () => {
    const { app, database } = setup();
    const created = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Inspect me", description: "Details" });

    const inspected = await localApi(request(app), "get", `/api/tasks/${created.body.data.id}`);
    expect(inspected.body.data).toEqual(created.body.data);

    for (const id of ["missing", "00000000-0000-4000-8000-000000000000"]) {
      const response = await localApi(request(app), "get", `/api/tasks/${id}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: { message: "Task not found" } });
    }
    database.close();
  });

  it("permanently deletes tasks and returns 404 for a repeated delete", async () => {
    const { app, database } = setup();
    const created = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin).send({ title: "Remove me" });
    const id = created.body.data.id;
    const deleted = await localApi(request(app), "delete", `/api/tasks/${id}`)
      .set("Origin", allowedOrigin)
      .set("Content-Type", "application/json")
      .send({});

    expect(deleted.status).toBe(204);
    expect((await localApi(request(app), "get", "/api/tasks")).body.data).toEqual([]);
    const repeated = await localApi(request(app), "delete", `/api/tasks/${id}`)
      .set("Origin", allowedOrigin)
      .set("Content-Type", "application/json")
      .send({});
    expect(repeated.status).toBe(404);
    expect(repeated.body.error.message).toBe("Task not found");
    database.close();
  });

  it("blocks unexpected Host and Origin headers and requires origin on mutations", async () => {
    const { app, database } = setup();
    const wrongHost = await request(app).post("/api/tasks")
      .set("Host", "evil.example")
      .set("Origin", allowedOrigin)
      .send({ title: "Blocked" });
    const wrongOrigin = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", "http://evil.example")
      .send({ title: "Blocked" });
    const missingOrigin = await localApi(request(app), "post", "/api/tasks")
      .send({ title: "Blocked" });

    expect(wrongHost.status).toBe(403);
    expect(wrongOrigin.status).toBe(403);
    expect(missingOrigin.status).toBe(403);
    expect((await localApi(request(app), "get", "/api/tasks")).body.data).toEqual([]);
    database.close();
  });

  it("requires JSON mutations, emits no permissive CORS header, and rejects malformed JSON safely", async () => {
    const { app, database } = setup();
    const nonJson = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .set("Content-Type", "text/plain")
      .send("title=Nope");
    const malformed = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .set("Content-Type", "application/json")
      .send("{");

    expect(nonJson.status).toBe(415);
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.message).toBe("Invalid JSON request body.");
    expect(malformed.headers["access-control-allow-origin"]).toBeUndefined();
    database.close();
  });

  it("keeps internal persistence failure details and task content out of errors and logs", async () => {
    const { app, database, logger } = setup();
    database.exec(`
      CREATE TRIGGER prevent_api_insert
      BEFORE INSERT ON tasks
      BEGIN
        SELECT RAISE(ABORT, 'private database detail');
      END;
    `);
    const response = await localApi(request(app), "post", "/api/tasks")
      .set("Origin", allowedOrigin)
      .send({ title: "Private task title" });

    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe("An unexpected error occurred.");
    expect(response.text).not.toContain("private database detail");
    expect(response.text).not.toContain("Private task title");
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("Private task title");
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("private database detail");
    database.close();
  });
});
