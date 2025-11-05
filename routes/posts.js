import express from "express";
import { moderationLimiter } from '../middlewares/rateLimiter.js';
import  contentFilter  from '../middlewares/contentFilter.js';
import { verifyToken } from "../middlewares/authMiddleware.js";

import {
  createPost,
  getPosts,
  getSinglePost,
  getPostWithComments,
  approvePost,
  rejectPost,
  getPendingPosts,
  updatePost,
} from "../controllers/postController.js";


const router = express.Router();

// Create a post (user submits, goes to pending)
router.post('/create', verifyToken, moderationLimiter, contentFilter, createPost);
router.put('/update/:id', verifyToken, moderationLimiter, contentFilter, updatePost);

// Get all approved posts
router.get("/", getPosts);

// Get a single post
router.get("/:postId", getSinglePost);

// Get post details with comments
router.get("/:postId/details", getPostWithComments);

// Admin routes
router.get("/admin/pending", verifyToken, getPendingPosts);
router.patch("/:id/approve", verifyToken, approvePost);
router.patch("/:id/reject", verifyToken, rejectPost);

export default router;
