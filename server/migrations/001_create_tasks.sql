CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  -- Character-count limits are enforced in the service using Unicode code points.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date TEXT,
  created_at TEXT NOT NULL
);
