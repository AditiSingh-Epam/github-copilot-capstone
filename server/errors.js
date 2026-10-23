export class ValidationError extends Error {
  constructor(fields, message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Task not found");
    this.name = "NotFoundError";
  }
}
