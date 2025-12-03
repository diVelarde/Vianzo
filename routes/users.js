import express from "express";
import {
    createUser,
    getUsers,
    getUserById,
    getUserRankings,
    calculateUserStats
} from "../controllers/userController.js";
import { db } from "../config/firebase.js";
import admin from "firebase-admin";

const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);

router.get("/rankings/all", getUserRankings);
router.get("/:id", getUserById);

// Get current user from token
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user profile with stats
router.get("/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection("users").doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const { messages_posted, total_likes_received, popularity_score } = await calculateUserStats(id);

    res.json({
      id: userDoc.id,
      user_id: userDoc.id,
      display_name: userData.username,
      messages_posted,
      total_likes_received,
      popularity_score
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
