import os from "node:os";
import path from "node:path";

export const LOOPBACK_HOST = "127.0.0.1";
export const DEFAULT_PORT = 3000;

export function getPort(value = process.env.PORT) {
  const port = value === undefined ? DEFAULT_PORT : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

export function getAllowedOrigin(value = process.env.TODO_ALLOWED_ORIGIN, port = getPort()) {
  const candidate = value ?? `http://${LOOPBACK_HOST}:${port}`;
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("TODO_ALLOWED_ORIGIN must be a valid local HTTP origin");
  }

  if (
    parsed.protocol !== "http:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
  ) {
    throw new Error("TODO_ALLOWED_ORIGIN must be a loopback HTTP origin");
  }

  return parsed.origin;
}

export function getDatabasePath({
  override = process.env.TODO_DB_PATH,
  localAppData = process.env.LOCALAPPDATA,
  homeDirectory = os.homedir(),
} = {}) {
  if (override !== undefined && override !== "") {
    if (!path.isAbsolute(override)) {
      throw new Error("TODO_DB_PATH must be an absolute path");
    }
    return override;
  }

  const localDataRoot =
    localAppData || path.join(homeDirectory, "AppData", "Local");
  return path.join(localDataRoot, "ToDoApplication", "data.sqlite");
}
