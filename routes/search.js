import express from "express";
import { searchPosts, searchUsers, searchIncognitoPosts } from "../controllers/searchController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Search posts
router.get("/posts", verifyToken, searchPosts);

// Search users
router.get("/users", verifyToken, searchUsers);

// Search incognito posts
router.get("/incognito", verifyToken, searchIncognitoPosts);

export default router;
