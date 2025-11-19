import express from "express";
import {
  addComment,
  getComments,
  deleteComment
} from "../controllers/commentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); ;

router.post("/", verifyToken, addComment);
router.get("/", getComments);
router.delete("/:commentId", verifyToken, deleteComment);

export default router;
