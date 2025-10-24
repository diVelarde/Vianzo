import express from "express";
import dotenv from "dotenv";
import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import usersRouter from "./routes/users.js";
import reactionRoutes from "./routes/reactions.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import searchRoutes from "./routes/search.js";
import incognitoRoutes from "./routes/incognitoPost.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
app.use("/posts", postsRouter);
app.use("/posts", commentsRouter);
app.use("/users", usersRouter);
app.use("/", reactionRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/search", searchRoutes);
app.use("/incognito", incognitoRoutes);

app.get("/", (req, res) => {
  res.send("🚀 WhisperNet API is running...");
});

app.listen(PORT, () => {
  console.log(`🚀 WhisperNet running on http://localhost:${PORT}`);
});
