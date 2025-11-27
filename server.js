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

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const API_PREFIX = process.env.API_PREFIX || "/api/v1";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || "https://vianzo-whispernet.onrender.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(path.join(__dirname, "dist")));

app.use(helmet());

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
  }));
}

app.use(express.json({ limit: process.env.JSON_LIMIT || "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(moderationLimiter);


console.log("DEBUG: Router imports:");
console.log(" postsRouter:", !!postsRouter, typeof postsRouter, Object.keys(postsRouter || {}));
console.log(" commentsRouter:", !!commentsRouter, typeof commentsRouter, Object.keys(commentsRouter || {}));
console.log(" usersRouter:", !!usersRouter, typeof usersRouter, Object.keys(usersRouter || {}));
console.log(" reactionRoutes:", !!reactionRoutes, typeof reactionRoutes, Object.keys(reactionRoutes || {}));
console.log(" leaderboardRoutes:", !!leaderboardRoutes, typeof leaderboardRoutes, Object.keys(leaderboardRoutes || {}));
console.log(" searchRoutes:", !!searchRoutes, typeof searchRoutes, Object.keys(searchRoutes || {}));
console.log(" incognitoRoutes:", !!incognitoRoutes, typeof incognitoRoutes, Object.keys(incognitoRoutes || {}));

try {
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
} catch (err) {
  console.error("ERROR mounting routers:", err && err.stack ? err.stack : err);
}

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get(`${API_PREFIX}/health`, (req, res) => res.status(200).json({ status: "ok", prefix: API_PREFIX }));

app.get("/__routes", (req, res) => {
  try {
    const routes = [];
    if (app._router && app._router.stack) {
      app._router.stack.forEach(mw => {
        if (mw.route && mw.route.path) {
          const methods = Object.keys(mw.route.methods).join(",").toUpperCase();
          routes.push({ path: mw.route.path, methods });
        } else if (mw.name === "router" && mw.regexp) {
          // router mount; stringify regexp for visibility
          routes.push({ mount: mw.regexp?.toString?.() || "<router>" });
        }
      });
    }
    // Also log to stdout to capture in container logs
    console.log("DEBUG: mounted routes snapshot:", JSON.stringify(routes, null, 2));
    return res.json({ ok: true, apiPrefix: API_PREFIX, FRONTEND_ORIGIN, routes });
  } catch (err) {
    console.error("ERROR building __routes:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Catch-all: return React index.html for any non-API route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
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