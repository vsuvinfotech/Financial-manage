import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_URL || "http://localhost:3000", "http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1", apiRoutes);
app.use(errorMiddleware);
