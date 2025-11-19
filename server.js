import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import usersRouter from "./routes/users.js";
import reactionRoutes from "./routes/reactions.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import searchRoutes from "./routes/search.js";
import incognitoRoutes from "./routes/incognitoPost.js";

import moderationLimiter from "./middlewares/rateLimiter.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js"; // create this file
import "./config/firebase.js"; // ensure firebase/init runs

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(moderationLimiter);

// API prefix and route mounts
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/posts`, postsRouter);
app.use(`${API_PREFIX}/posts/:postId/comments`, commentsRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/reactions`, reactionRoutes);
app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/incognito`, incognitoRoutes);

// Health
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 WhisperNet running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
