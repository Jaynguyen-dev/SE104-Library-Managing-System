import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import userRoutes from "./routes/user.routes.js";
import borrowRoutes from "./routes/borrow.routes.js";
import fineRoutes from "./routes/fine.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import crawlRoutes from "./routes/crawl.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = ENV.NODE_ENV === "production";

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.googleapis.com", "https://*.openlibrary.org"],
      connectSrc: ["'self'"],
    },
  } : false,
}));
app.use(compression());

const allowedOrigins = [
  ENV.CLIENT_URL,
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || !isProduction) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

if (!isProduction) {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/crawl", crawlRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reservations", reservationRoutes);

app.use(errorHandler);

const clientDist = path.resolve(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    maxAge: isProduction ? "1y" : 0,
    immutable: isProduction,
  }));
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
