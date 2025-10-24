import express from "express";
import {
  reactToPost,
  removePostReaction,
  getPostReactions,
  reactToComment,
  removeCommentReaction,
  getCommentReactions
} from "../controllers/reactionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Post reactions
router.post("/posts/:postId/react", verifyToken, reactToPost);
router.delete("/posts/:postId/react", verifyToken, removePostReaction);
router.get("/posts/:postId/reactions", getPostReactions);

// Comment reactions
router.post("/posts/:postId/comments/:commentId/react", verifyToken, reactToComment);
router.delete("/posts/:postId/comments/:commentId/react", verifyToken, removeCommentReaction);
router.get("/posts/:postId/comments/:commentId/reactions", getCommentReactions);

export default router;
