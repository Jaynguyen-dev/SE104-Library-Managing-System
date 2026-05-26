import app from "./app.js";
import { ENV } from "./config/env.js";
import { startScheduler } from "./services/schedulerService.js";

const server = app.listen(ENV.PORT, () => {
  console.log(`Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  startScheduler();
});

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
