import express from "express";
import { 
    getLeaderboard, 
    getUserRank 
} from "../controllers/leaderboardController.js";

const router = express.Router();

// Get overall leaderboard
router.get("/", getLeaderboard);

// Get specific user rank
router.get("/:userId", getUserRank);

export default router;
