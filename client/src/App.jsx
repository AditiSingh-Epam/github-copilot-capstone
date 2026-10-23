import { useCallback, useEffect, useRef, useState } from "react";

async function readResponse(response) {
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message ?? "The request could not be completed.");
    error.fields = body.error?.fields ?? {};
    throw error;
  }
  return body.data;
}

function TaskCard({ task, onInspect, onDelete }) {
  return (
    <article className={`task-card${task.completed ? " task-card--completed" : ""}`}>
      <div className="task-card__content">
        <h3>{task.title}</h3>
        <div className="task-meta">
          <span className="status-badge" aria-label={task.completed ? "Completed" : "Pending"}>
            {task.completed ? "Completed" : "Pending"}
          </span>
          <span className="priority-badge">{task.priority}</span>
          {task.dueDate && <span className="due-date">Due {task.dueDate}</span>}
        </div>
      </div>
      <div className="task-card__actions">
        <button className="button button--quiet" onClick={() => onInspect(task.id)}>
          View details
        </button>
        <button className="button button--danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const latestListRequest = useRef(0);

  const loadTasks = useCallback(async (filter = status) => {
    const requestId = ++latestListRequest.current;
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(
        await fetch(`/api/tasks?status=${encodeURIComponent(filter)}`),
      );
      if (requestId === latestListRequest.current) setTasks(data);
    } catch (requestError) {
      if (requestId === latestListRequest.current) setError(requestError.message);
    } finally {
      if (requestId === latestListRequest.current) setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadTasks(status);
  }, [loadTasks, status]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: undefined }));
    setMessage("");
  }

  async function createTask(event) {
    event.preventDefault();
    setFieldErrors({});
    setMessage("");
    setError("");
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
    };
    if (form.dueDate) payload.dueDate = form.dueDate;

    try {
      await readResponse(await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      setForm({ title: "", description: "", priority: "Medium", dueDate: "" });
      setMessage("Task created.");
      await loadTasks(status);
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(requestError.fields ?? {});
    }
  }

  async function inspectTask(id) {
    setError("");
    try {
      const task = await readResponse(await fetch(`/api/tasks/${encodeURIComponent(id)}`));
      setSelectedTask(task);
    } catch (requestError) {
      setSelectedTask(null);
      setError(requestError.message);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Permanently delete "${task.title}"?`)) return;
    setError("");
    setMessage("");
    try {
      await readResponse(await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }));
      setSelectedTask(null);
      setMessage("Task deleted.");
      await loadTasks(status);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function changeStatus(event) {
    setStatus(event.target.value);
    setSelectedTask(null);
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">PERSONAL TASKS</p>
          <h1>To-Do List</h1>
          <p className="page-intro">Keep your next steps clear and close at hand.</p>
        </div>
        <span className="local-pill">Stored on this device</span>
      </header>

      <div className="workspace">
        <section className="panel create-panel" aria-labelledby="create-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MAKE A PLAN</p>
              <h2 id="create-heading">Add a task</h2>
            </div>
          </div>
          <form onSubmit={createTask} noValidate>
            <label htmlFor="title">Title <span aria-hidden="true">*</span></label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={updateField}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
              required
            />
            {fieldErrors.title && <p className="field-error" id="title-error">{fieldErrors.title}</p>}

            <label htmlFor="description">Description <span className="optional-label">Optional</span></label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={form.description}
              onChange={updateField}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "description-error" : undefined}
            />
            {fieldErrors.description && (
              <p className="field-error" id="description-error">{fieldErrors.description}</p>
            )}

            <div className="form-row">
              <div>
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" value={form.priority} onChange={updateField}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label htmlFor="dueDate">Due date <span className="optional-label">Optional</span></label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.dueDate)}
                  aria-describedby={fieldErrors.dueDate ? "dueDate-error" : undefined}
                />
              </div>
            </div>
            {fieldErrors.priority && <p className="field-error">{fieldErrors.priority}</p>}
            {fieldErrors.dueDate && (
              <p className="field-error" id="dueDate-error">{fieldErrors.dueDate}</p>
            )}

            <button className="button button--primary create-button" type="submit">
              Create task
            </button>
          </form>
        </section>

        <section className="panel list-panel" aria-labelledby="tasks-heading">
          <div className="list-heading">
            <div>
              <p className="eyebrow">YOUR TASKS</p>
              <h2 id="tasks-heading">Task list</h2>
            </div>
            <label className="filter-control">
              <span className="visually-hidden">Filter tasks</span>
              <select aria-label="Filter tasks" value={status} onChange={changeStatus}>
                <option value="all">All tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          {message && <p className="notice notice--success" role="status">{message}</p>}
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          {loading ? (
            <p className="empty-state" role="status">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon" aria-hidden="true">✓</span>
              <p>No tasks yet.</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onInspect={inspectTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}

          {selectedTask && (
            <section className="detail-panel" aria-labelledby="detail-heading">
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">TASK DETAILS</p>
                  <h3 id="detail-heading">{selectedTask.title}</h3>
                </div>
                <button
                  className="button button--quiet"
                  onClick={() => setSelectedTask(null)}
                  aria-label="Close task details"
                >
                  Close
                </button>
              </div>
              <dl className="detail-list">
                <div><dt>Description</dt><dd>{selectedTask.description || "—"}</dd></div>
                <div><dt>Status</dt><dd>{selectedTask.completed ? "Completed" : "Pending"}</dd></div>
                <div><dt>Priority</dt><dd>{selectedTask.priority}</dd></div>
                <div><dt>Due date</dt><dd>{selectedTask.dueDate || "—"}</dd></div>
                <div><dt>Created</dt><dd>{selectedTask.createdAt}</dd></div>
              </dl>
            </section>
          )}
        </section>
      </div>
      <footer className="page-footer">Your tasks stay on this device.</footer>
    </main>
  );
}
