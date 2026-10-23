import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "./errors.js";

const allowedPriorities = new Set(["Low", "Medium", "High"]);
const allowedStatuses = new Set(["all", "pending", "completed"]);
const allowedCreateFields = new Set(["title", "description", "priority", "dueDate"]);

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function codePointLength(value) {
  return [...value].length;
}

function validateCreateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError({ body: "Must be a JSON object." });
  }

  const fields = {};
  if (Object.keys(input).some((field) => !allowedCreateFields.has(field))) {
    fields.body = "Unknown fields are not allowed.";
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (typeof input.title !== "string" || codePointLength(title) < 1) {
    fields.title = "Title is required.";
  } else if (codePointLength(title) > 100) {
    fields.title = "Title must be 100 characters or fewer.";
  }

  let description = "";
  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      fields.description = "Description must be text.";
    } else {
      description = input.description.trim();
      if (codePointLength(description) > 1000) {
        fields.description = "Description must be 1,000 characters or fewer.";
      }
    }
  }

  const priority = input.priority === undefined ? "Medium" : input.priority;
  if (typeof priority !== "string" || !allowedPriorities.has(priority)) {
    fields.priority = "Priority must be Low, Medium, or High.";
  }

  const dueDate = input.dueDate;
  if (dueDate !== undefined && (typeof dueDate !== "string" || !isCalendarDate(dueDate))) {
    fields.dueDate = "Due date must be a valid calendar date in YYYY-MM-DD format.";
  }

  if (Object.keys(fields).length > 0) throw new ValidationError(fields);
  return { title, description, priority, dueDate: dueDate ?? null };
}

export function createTaskService(repository, { clock = () => new Date(), idFactory = randomUUID } = {}) {
  return {
    create(input) {
      const validated = validateCreateInput(input);
      return repository.create({
        id: idFactory(),
        ...validated,
        completed: false,
        createdAt: clock().toISOString(),
      });
    },

    list(status = "all") {
      if (!allowedStatuses.has(status)) {
        throw new ValidationError({ status: "Status must be all, pending, or completed." });
      }
      return repository.list(status);
    },

    getById(id) {
      const task = repository.getById(id);
      if (!task) throw new NotFoundError();
      return task;
    },

    delete(id) {
      return repository.delete(id);
    },
  };
}
