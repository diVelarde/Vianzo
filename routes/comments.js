import express from "express";
import {
  addComment,
  getComments,
  deleteComment
} from "../controllers/commentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:postId/comments", verifyToken, addComment);
router.get("/:postId/comments", getComments);
router.delete("/:postId/comments/:commentId", verifyToken, deleteComment);

export default router;
