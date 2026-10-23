import { describe, expect, it } from "vitest";
import { createTaskRepository, openDatabase } from "./database.js";
import { ValidationError } from "./errors.js";
import { createTaskService } from "./task-service.js";

function setup() {
  const database = openDatabase(":memory:");
  const service = createTaskService(createTaskRepository(database), {
    clock: () => new Date("2026-10-22T12:34:56.789Z"),
    idFactory: (() => {
      let sequence = 0;
      return () => `8b348c53-5161-4d4f-8e9a-${String(++sequence).padStart(12, "0")}`;
    })(),
  });
  return { database, service };
}

describe("task creation validation (P-US-01, P-US-06, P-BR-01)", () => {
  it("trims fields and applies the approved incomplete and Medium defaults", () => {
    const { database, service } = setup();
    const task = service.create({
      title: "  Plan the week  ",
      description: "  Pick three priorities  ",
    });

    expect(task).toEqual({
      id: "8b348c53-5161-4d4f-8e9a-000000000001",
      title: "Plan the week",
      description: "Pick three priorities",
      completed: false,
      priority: "Medium",
      dueDate: null,
      createdAt: "2026-10-22T12:34:56.789Z",
    });
    database.close();
  });

  it("accepts the title boundaries after trimming", () => {
    const { database, service } = setup();
    expect(service.create({ title: " x " }).title).toBe("x");
    expect(service.create({ title: ` ${"a".repeat(100)} ` }).title).toHaveLength(100);
    database.close();
  });

  it.each([
    [undefined, "Title is required."],
    ["   ", "Title is required."],
    ["a".repeat(101), "Title must be 100 characters or fewer."],
    ["😀".repeat(101), "Title must be 100 characters or fewer."],
  ])("rejects invalid title %s", (title, expectedMessage) => {
    const { database, service } = setup();
    const input = title === undefined ? {} : { title };

    let error;
    try {
      service.create(input);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.fields.title).toBe(expectedMessage);
    database.close();
  });

  it("counts Unicode code points and accepts the description boundary", () => {
    const { database, service } = setup();
    const task = service.create({
      title: "Unicode",
      description: `${"😀".repeat(999)}x`,
    });
    expect([...task.description]).toHaveLength(1000);

    expect(() => service.create({
      title: "Boundary",
      description: "😀".repeat(1001),
    })).toThrow(ValidationError);
    expect(service.create({
      title: "Valid boundary",
      description: "😀".repeat(1000),
    }).description).toBe("😀".repeat(1000));
    database.close();
  });

  it("uses an empty description when it is absent or trims to empty", () => {
    const { database, service } = setup();
    expect(service.create({ title: "No description" }).description).toBe("");
    expect(service.create({ title: "Blank description", description: "   " }).description).toBe("");
    database.close();
  });

  it("rejects an explicitly null due date while allowing it to be omitted", () => {
    const { database, service } = setup();
    expect(service.create({ title: "Optional date" }).dueDate).toBeNull();

    let error;
    try {
      service.create({ title: "Null date", dueDate: null });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.fields.dueDate).toBe("Due date must be a valid calendar date in YYYY-MM-DD format.");
    database.close();
  });

  it("rejects a description that exceeds 1,000 code points", () => {
    const { database, service } = setup();
    expect(() => service.create({
      title: "Too long",
      description: `${"a".repeat(1000)} b`,
    })).toThrow(ValidationError);
    database.close();
  });

  it.each(["Urgent", "medium", "", null, 1])("rejects invalid priority %s", (priority) => {
    const { database, service } = setup();
    expect(() => service.create({ title: "Priority", priority })).toThrow(ValidationError);
    database.close();
  });

  it.each(["2024-02-29", "2025-02-28", "2000-01-01"])("accepts a valid date-only value %s", (dueDate) => {
    const { database, service } = setup();
    expect(service.create({ title: "Date", dueDate }).dueDate).toBe(dueDate);
    database.close();
  });

  it.each(["2025-02-29", "2026-13-01", "2026-04-31", "2026-1-01", "2026-10-22T00:00:00Z"])(
    "rejects invalid calendar date %s",
    (dueDate) => {
      const { database, service } = setup();
      expect(() => service.create({ title: "Bad date", dueDate })).toThrow(ValidationError);
      database.close();
    },
  );

  it("allows past dates without timezone conversion", () => {
    const { database, service } = setup();
    expect(service.create({ title: "Past date", dueDate: "2001-01-01" }).dueDate).toBe("2001-01-01");
    database.close();
  });

  it("rejects non-object and invalid field types", () => {
    const { database, service } = setup();
    expect(() => service.create(null)).toThrow(ValidationError);
    expect(() => service.create({ title: 3 })).toThrow(ValidationError);
    expect(() => service.create({ title: "Bad", description: 3 })).toThrow(ValidationError);
    database.close();
  });
});
