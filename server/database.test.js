import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTaskRepository, migrateDatabase, openDatabase } from "./database.js";
import { NotFoundError } from "./errors.js";

const task = (id, createdAt, title = id) => ({
  id,
  title,
  description: "",
  completed: false,
  priority: "Medium",
  dueDate: null,
  createdAt,
});

describe("SQLite persistence (P-US-01, P-US-02, P-US-04)", () => {
  it("creates, inspects, orders, and permanently deletes records using parameterized values", () => {
    const database = openDatabase(":memory:");
    const repository = createTaskRepository(database);
    const first = task("first", "2026-10-20T00:00:00.000Z", "A title'); DROP TABLE tasks;--");
    const second = task("second", "2026-10-22T00:00:00.000Z", "Newest");

    expect(repository.create(first)).toEqual(first);
    expect(repository.create(second)).toEqual(second);
    expect(repository.getById("first")).toEqual(first);
    expect(repository.list("all").map((item) => item.id)).toEqual(["second", "first"]);

    repository.delete("first");
    expect(repository.getById("first")).toBeNull();
    expect(repository.list("all").map((item) => item.id)).toEqual(["second"]);
    expect(() => repository.delete("first")).toThrow(NotFoundError);
    database.close();
  });

  it("filters pending and completed records without mutating their state", () => {
    const database = openDatabase(":memory:");
    const repository = createTaskRepository(database);
    repository.create(task("pending", "2026-10-20T00:00:00.000Z"));

    database.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run("pending");
    expect(repository.list("completed").map((item) => item.completed)).toEqual([true]);
    expect(repository.list("pending")).toEqual([]);
    database.close();
  });

  it("rolls back a failed create and never returns an uncommitted record", () => {
    const database = openDatabase(":memory:");
    const repository = createTaskRepository(database);
    database.exec(`
      CREATE TRIGGER prevent_test_insert
      BEFORE INSERT ON tasks
      BEGIN
        SELECT RAISE(ABORT, 'test write failure');
      END;
    `);

    expect(() => repository.create(task("blocked", "2026-10-22T00:00:00.000Z"))).toThrow();
    expect(repository.getById("blocked")).toBeNull();
    database.close();
  });

  it("preserves data across a normal database reopen", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "todo-database-"));
    const databasePath = path.join(directory, "data.sqlite");
    const firstDatabase = openDatabase(databasePath);
    createTaskRepository(firstDatabase).create(task("persisted", "2026-10-22T00:00:00.000Z"));
    firstDatabase.close();

    const reopened = openDatabase(databasePath);
    expect(createTaskRepository(reopened).getById("persisted")).toEqual(
      task("persisted", "2026-10-22T00:00:00.000Z"),
    );
    reopened.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("applies schema migrations once and refuses a newer schema version", () => {
    const database = openDatabase(":memory:");
    expect(database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count).toBe(1);
    migrateDatabase(database);
    expect(database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count).toBe(1);
    database.prepare("UPDATE schema_migrations SET version = 99").run();
    expect(() => migrateDatabase(database)).toThrow("Database schema is newer");
    database.close();
  });
});
