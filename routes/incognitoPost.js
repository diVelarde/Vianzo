import express from "express";
import {
  createIncognitoPost,
  getIncognitoPosts,
  deleteIncognitoPost
} from "../controllers/incognitoPostController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create incognito post
router.post("/", verifyToken, createIncognitoPost);

// Get all incognito posts
router.get("/", verifyToken, getIncognitoPosts);

// Delete incognito post (only owner)
router.delete("/:id", verifyToken, deleteIncognitoPost);

export default router;
