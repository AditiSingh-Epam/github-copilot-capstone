import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllowedOrigin, getDatabasePath, getPort } from "./config.js";

describe("local runtime configuration", () => {
  it("uses an absolute per-user Windows data location by default", () => {
    expect(getDatabasePath({
      localAppData: "C:\\Users\\sample\\AppData\\Local",
    })).toBe("C:\\Users\\sample\\AppData\\Local\\ToDoApplication\\data.sqlite");
  });

  it("uses the AppData Local fallback and validates the optional override", () => {
    expect(getDatabasePath({
      localAppData: "",
      homeDirectory: "C:\\Users\\sample",
    })).toBe(path.join("C:\\Users\\sample", "AppData", "Local", "ToDoApplication", "data.sqlite"));
    expect(getDatabasePath({ override: path.join(os.tmpdir(), "todo.sqlite") }))
      .toBe(path.join(os.tmpdir(), "todo.sqlite"));
    expect(() => getDatabasePath({ override: "relative.sqlite" })).toThrow("absolute path");
  });

  it("restricts the allowed browser origin to local HTTP", () => {
    expect(getAllowedOrigin("http://localhost:5173", 3000)).toBe("http://localhost:5173");
    expect(() => getAllowedOrigin("https://example.com", 3000)).toThrow("loopback HTTP");
    expect(() => getAllowedOrigin("http://localhost:5173/path", 3000)).toThrow("loopback HTTP");
  });

  it("accepts only an available TCP port", () => {
    expect(getPort("5173")).toBe(5173);
    expect(() => getPort("0")).toThrow("PORT must be");
    expect(() => getPort("abc")).toThrow("PORT must be");
  });
});
