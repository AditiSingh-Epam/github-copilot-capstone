import { createServer } from "node:http";
import { createApp } from "./app.js";
import { getAllowedOrigin, getDatabasePath, getPort, LOOPBACK_HOST } from "./config.js";
import { createTaskRepository, openDatabase } from "./database.js";
import { createTaskService } from "./task-service.js";

const port = getPort();
const allowedOrigin = getAllowedOrigin(process.env.TODO_ALLOWED_ORIGIN, port);
const databasePath = getDatabasePath();
const database = openDatabase(databasePath);
const service = createTaskService(createTaskRepository(database));
const server = createServer(createApp({ service, allowedOrigin }));

server.listen(port, LOOPBACK_HOST, () => {
  console.info("To-Do Application listening locally", {
    host: LOOPBACK_HOST,
    port,
    database: "configured",
  });
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
