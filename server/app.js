import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalOriginGuard } from "./security.js";
import { NotFoundError, ValidationError } from "./errors.js";

const builtClientDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

function sendError(error, request, response, logger) {
  if (error instanceof ValidationError) {
    return response.status(400).json({
      error: { message: error.message, fields: error.fields },
    });
  }

  if (error instanceof NotFoundError) {
    return response.status(404).json({ error: { message: "Task not found" } });
  }

  if (error?.type === "entity.parse.failed") {
    return response.status(400).json({
      error: { message: "Invalid JSON request body." },
    });
  }

  if (error?.type === "entity.too.large") {
    return response.status(400).json({
      error: { message: "Request body is too large." },
    });
  }

  logger.error("API request failed", {
    method: request.method,
    category: "internal",
    errorType: error?.name ?? "Error",
  });
  return response.status(500).json({
    error: { message: "An unexpected error occurred." },
  });
}

export function createApp({ service, allowedOrigin, logger = console, serveClient = true }) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", createLocalOriginGuard(allowedOrigin));
  app.use("/api", express.json({ limit: "16kb", strict: true }));

  app.get("/api/tasks", (request, response, next) => {
    try {
      const tasks = service.list(request.query.status ?? "all");
      response.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", (request, response, next) => {
    try {
      const task = service.create(request.body);
      response
        .status(201)
        .location(`/api/tasks/${task.id}`)
        .json({ data: task });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id", (request, response, next) => {
    try {
      response.json({ data: service.getById(request.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", (request, response, next) => {
    try {
      service.delete(request.params.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", (request, response) => {
    response.status(404).json({ error: { message: "Not found" } });
  });

  if (serveClient) {
    app.use(express.static(builtClientDirectory));
    app.use((request, response, next) => {
      if (request.method === "GET" && !request.path.startsWith("/api")) {
        return response.sendFile(path.join(builtClientDirectory, "index.html"), (error) => {
          if (error) next();
        });
      }
      return next();
    });
  }

  app.use((error, request, response, _next) => {
    if (response.headersSent) return;
    return sendError(error, request, response, logger);
  });

  return app;
}
