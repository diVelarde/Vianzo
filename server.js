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

// use a configurable API prefix so frontend/clients can either use /api/v1 or root routes
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

// Allow the frontend origin to be configured via env (falls back to allowing same origin for dev)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || "https://vianzotech.onrender.com";

// Basic middleware
app.use(helmet());

// Configure CORS to accept the configured frontend origin (and allow preflight)
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    // allow configured frontend origin or if FRONTEND_ORIGIN is "*" allow everything
    if (FRONTEND_ORIGIN === "*" || origin === FRONTEND_ORIGIN) return callback(null, true);
    // otherwise reject
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept","X-Requested-With"]
}));

// parse JSON with a reasonably small limit
app.use(express.json({ limit: process.env.JSON_LIMIT || "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// rate limiter that protects moderation routes / global actions
app.use(moderationLimiter);

// Mount routes both under API_PREFIX and also at root equivalents for compatibility
// This makes it easier for frontends that expect /posts (no prefix) or /api/v1/posts.
//
// Examples:
//  - /api/v1/posts
//  - /posts
//  - /api/v1/posts/:postId/comments
//  - /posts/:postId/comments
app.use(`${API_PREFIX}/posts`, postsRouter);
app.use(`/posts`, postsRouter);

app.use(`${API_PREFIX}/posts/:postId/comments`, commentsRouter);
app.use(`/posts/:postId/comments`, commentsRouter);

app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`/users`, usersRouter);

app.use(`${API_PREFIX}/reactions`, reactionRoutes);
app.use(`/reactions`, reactionRoutes);

app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`/leaderboard`, leaderboardRoutes);

app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`/search`, searchRoutes);

app.use(`${API_PREFIX}/incognito`, incognitoRoutes);
app.use(`/incognito`, incognitoRoutes);

// Health endpoints (short and prefixed)
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get(`${API_PREFIX}/health`, (req, res) => res.status(200).json({ status: "ok", prefix: API_PREFIX }));

// expose a quick diagnostics endpoint to list mounted routes (useful for debugging)
app.get("/__routes", (req, res) => {
  try {
    const routes = [];
    if (app._router && app._router.stack) {
      app._router.stack.forEach(mw => {
        if (mw.route && mw.route.path) {
          const methods = Object.keys(mw.route.methods).join(",").toUpperCase();
          routes.push({ path: mw.route.path, methods });
        } else if (mw.name === "router" && mw.regexp) {
          // router mount; try to stringify, but it's ok if not perfect
          routes.push({ mount: String(mw.regexp) });
        }
      });
    }
    return res.json({ ok: true, apiPrefix: API_PREFIX, FRONTEND_ORIGIN, routes });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 WhisperNet running on http://localhost:${PORT} (API prefix: ${API_PREFIX})`);
  console.log(`FRONTEND_ORIGIN=${FRONTEND_ORIGIN}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});