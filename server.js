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
import authRoutes from "./routes/auth.js";


import moderationLimiter from "./middlewares/rateLimiter.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

import "./config/firebase.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  process.env.FRONTEND_URL ||
  "https://vianzo-whispernet.onrender.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React build folder
app.use(express.static(path.join(__dirname, "dist")));

app.use(helmet());

// CORS
if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(
    cors({
      origin: FRONTEND_ORIGIN,
      credentials: true,
    })
  );
}

app.use(express.json({ limit: process.env.JSON_LIMIT || "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(moderationLimiter);

/* ------------------ ROUTES ------------------ */
app.use("/auth", authRoutes);
app.use("/posts", postsRouter);
app.use("/posts/:postId/comments", commentsRouter);
app.use("/users", usersRouter);
app.use("/reactions", reactionRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/search", searchRoutes);
app.use("/incognito", incognitoRoutes);

/* ------------------ HEALTH CHECK ------------------ */
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok" })
);

/* ------------------ DEBUG ROUTE ------------------ */
app.get("/__routes", (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((mw) => {
      if (mw.route) {
        routes.push({
          path: mw.route.path,
          methods: Object.keys(mw.route.methods)
            .join(",")
            .toUpperCase(),
        });
      }
    });

    return res.json({
      ok: true,
      FRONTEND_ORIGIN,
      routes,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/* ------------------ SPA FALLBACK ------------------ */
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

/* ------------------ ERROR HANDLING ------------------ */
app.use(notFound);
app.use(errorHandler);

/* ------------------ START SERVER ------------------ */
const server = app.listen(PORT, () => {
  console.log(`🚀 WhisperNet running on http://localhost:${PORT}`);
  console.log(`FRONTEND_ORIGIN=${FRONTEND_ORIGIN}`);
});

/* ------------------ GRACEFUL SHUTDOWN ------------------ */
process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
