import { error } from "../utils/responseHelper.js";
import { ENV } from "../config/env.js";

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (ENV.NODE_ENV === "development") {
    console.error("[Error]", err);
  } else {
    console.error(`[Error] ${statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`);
  }

  if (ENV.NODE_ENV === "production" && statusCode === 500) {
    return error(res, "Internal server error", 500);
  }

  const message = err.message || "Internal server error";
  return error(res, message, statusCode);
}
