import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NotFoundError } from "./errors.js";

const migrationDirectory = fileURLToPath(new URL("./migrations/", import.meta.url));
const taskColumns = `
  id,
  title,
  description,
  completed,
  priority,
  due_date,
  created_at
`;

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

export function withTransaction(database, action) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = action();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function migrateDatabase(database) {
  const migrations = readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      version: Number(file.slice(0, 3)),
      sql: readFileSync(path.join(migrationDirectory, file), "utf8"),
    }));

  withTransaction(database, () => {
    database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);
    const current = database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get().version;

    if (current !== null && current > migrations.length) {
      throw new Error("Database schema is newer than this application");
    }

    for (const migration of migrations) {
      if (!Number.isInteger(migration.version)) {
        throw new Error("Invalid migration filename");
      }
      if (migration.version > (current ?? 0)) {
        database.exec(migration.sql);
        database
          .prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
          .run(migration.version, new Date().toISOString());
      }
    }
  });
}

export function openDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA busy_timeout = 5000");
    migrateDatabase(database);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

export function createTaskRepository(database) {
  const insert = database.prepare(`
    INSERT INTO tasks (id, title, description, completed, priority, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const selectById = database.prepare(`SELECT ${taskColumns} FROM tasks WHERE id = ?`);

  return {
    create(task) {
      return withTransaction(database, () => {
        insert.run(
          task.id,
          task.title,
          task.description,
          task.completed ? 1 : 0,
          task.priority,
          task.dueDate,
          task.createdAt,
        );
        return mapTask(selectById.get(task.id));
      });
    },

    list(status = "all") {
      const query = status === "all"
        ? `SELECT ${taskColumns} FROM tasks ORDER BY created_at DESC`
        : `SELECT ${taskColumns} FROM tasks WHERE completed = ? ORDER BY created_at DESC`;
      const rows = status === "all"
        ? database.prepare(query).all()
        : database.prepare(query).all(status === "completed" ? 1 : 0);
      return rows.map(mapTask);
    },

    getById(id) {
      return mapTask(selectById.get(id));
    },

    delete(id) {
      return withTransaction(database, () => {
        const result = database.prepare("DELETE FROM tasks WHERE id = ?").run(id);
        if (result.changes === 0) throw new NotFoundError();
      });
    },
  };
}
