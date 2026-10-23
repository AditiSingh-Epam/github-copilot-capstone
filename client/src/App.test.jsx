// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

const pendingTask = {
  id: "task-pending",
  title: "Prepare a weekly plan",
  description: "Choose a few priorities",
  completed: false,
  priority: "High",
  dueDate: "2026-10-30",
  createdAt: "2026-10-22T12:34:56.789Z",
};

const completedTask = {
  ...pendingTask,
  id: "task-completed",
  title: "Already done",
  completed: true,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("task list and creation UI (P-US-01, P-US-02, P-US-05)", () => {
  it("shows the empty state and creates a task with defaults and success feedback", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: { ...pendingTask, title: "Call the dentist" } }, 201))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    expect(await screen.findByText("No tasks yet.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Title/), "Call the dentist");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Task created.")).toBeInTheDocument();
    const createRequest = fetchMock.mock.calls[1];
    expect(JSON.parse(createRequest[1].body)).toEqual({
      title: "Call the dentist",
      description: "",
      priority: "Medium",
    });
  });

  it("renders list fields and distinguishes completed tasks without exposing a state-write control", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse({ data: [completedTask, pendingTask] }),
    ));
    render(<App />);

    expect(await screen.findByText("Already done")).toBeInTheDocument();
    const completedCard = screen.getByText("Already done").closest(".task-card");
    expect(completedCard).toHaveClass("task-card--completed");
    expect(completedCard).toHaveTextContent("Completed");
    expect(completedCard).toHaveTextContent("High");
    expect(completedCard.querySelector("input[type=checkbox]")).toBeNull();
    expect(screen.getAllByText("Due 2026-10-30")).toHaveLength(2);
  });

  it("requests the selected status filter from the API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [pendingTask, completedTask] }))
      .mockResolvedValueOnce(jsonResponse({ data: [completedTask] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByText("Already done");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter tasks" }), "completed");
    await screen.findByText("Already done");

    expect(fetchMock.mock.calls[1][0]).toBe("/api/tasks?status=completed");
    await waitFor(() => expect(screen.queryByText("Prepare a weekly plan")).not.toBeInTheDocument());
  });

  it("ignores an older list response that arrives after the current filter response", async () => {
    const user = userEvent.setup();
    let resolveAllTasks;
    let resolveCompletedTasks;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveAllTasks = resolve;
      }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveCompletedTasks = resolve;
      }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter tasks" }), "completed");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    resolveCompletedTasks(jsonResponse({ data: [completedTask] }));
    expect(await screen.findByText("Already done")).toBeInTheDocument();
    resolveAllTasks(jsonResponse({ data: [pendingTask, completedTask] }));

    await waitFor(() => expect(screen.queryByText("Prepare a weekly plan")).not.toBeInTheDocument());
    expect(screen.getByText("Already done")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter tasks" })).toHaveValue("completed");
  });

  it("lets server-side Unicode validation handle descriptions beyond the code-point limit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({
        error: {
          message: "Validation failed",
          fields: { description: "Description must be 1,000 characters or fewer." },
        },
      }, 400));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const description = "😀".repeat(1001);
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: description } });
    await user.type(screen.getByLabelText(/Title/), "Unicode boundary");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Description must be 1,000 characters or fewer.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).description).toBe(description);
  });

  it("loads full details through the inspect route", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [pendingTask] }))
      .mockResolvedValueOnce(jsonResponse({ data: pendingTask })));
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "View details" }));
    await waitFor(() => {
      expect(document.getElementById("detail-heading")).toHaveTextContent("Prepare a weekly plan");
    });
    expect(screen.getByText("Choose a few priorities")).toBeInTheDocument();
    expect(screen.getByText("2026-10-22T12:34:56.789Z")).toBeInTheDocument();
  });

  it("shows server validation errors", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({
        error: {
          message: "Validation failed",
          fields: { title: "Title is required." },
        },
      }, 400)));
    render(<App />);

    await screen.findByText("No tasks yet.");
    await user.click(screen.getByRole("button", { name: "Create task" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Validation failed");
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
  });

  it("requires user confirmation before requesting permanent deletion", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn().mockReturnValue(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: [pendingTask] })));
    vi.stubGlobal("confirm", confirm);
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledWith('Permanently delete "Prepare a weekly plan"?');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("deletes only after confirmation and refreshes the list", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [pendingTask] }))
      .mockResolvedValueOnce(jsonResponse(null, 204))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Task deleted.")).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
    expect(await screen.findByText("No tasks yet.")).toBeInTheDocument();
  });

  it("shows a server not-found message when a task cannot be inspected", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [pendingTask] }))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Task not found" } }, 404)));
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "View details" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Task not found");
  });
});
