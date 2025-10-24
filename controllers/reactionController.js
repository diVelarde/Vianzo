import { db } from "../config/firebase.js";
import admin from "firebase-admin";
import { updatePopularity } from "../utils/updatePopularity.js";

const FieldValue = admin.firestore.FieldValue;

// --- Post Reactions ---
export const reactToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body;
    const userId = req.user.uid;

    if (!type) {
      return res.status(400).json({ success: false, error: "Reaction type required" });
    }

    const reactionRef = db.collection("posts").doc(postId).collection("reactions").doc(userId);
    await reactionRef.set({ type, userId, createdAt: new Date() });

    await db.collection("posts").doc(postId).update({
      likes: FieldValue.increment(1),
    });

    await updatePopularity(userId, 1);

    res.json({ success: true, message: "Reaction added to post!" });
  } catch (err) {
    console.error("Error reacting to post:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const removePostReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.uid;

    const reactionRef = db.collection("posts").doc(postId).collection("reactions").doc(userId);
    const reactionDoc = await reactionRef.get();

    if (!reactionDoc.exists) {
      return res.status(404).json({ success: false, error: "Reaction not found" });
    }

    await reactionRef.delete();
    await db.collection("posts").doc(postId).update({
      likes: FieldValue.increment(-1),
    });

    res.json({ success: true, message: "Reaction removed from post" });
  } catch (err) {
    console.error("Error removing reaction from post:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ NEW: Get all reactions for a post
export const getPostReactions = async (req, res) => {
  try {
    const { postId } = req.params;

    const snapshot = await db.collection("posts").doc(postId).collection("reactions").get();

    const grouped = {};
    const reactions = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      reactions.push({ id: doc.id, ...data });

      if (!grouped[data.type]) {
        grouped[data.type] = 0;
      }
      grouped[data.type]++;
    });

    res.json({ success: true, grouped, reactions });
  } catch (err) {
    console.error("Error fetching post reactions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Comment Reactions ---
export const reactToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { type } = req.body;
    const userId = req.user.uid;

    if (!type) {
      return res.status(400).json({ success: false, error: "Reaction type required" });
    }

    const reactionRef = db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("reactions")
      .doc(userId);

    await reactionRef.set({ type, userId, createdAt: new Date() });

    await db.collection("posts").doc(postId).collection("comments").doc(commentId).update({
      likes: FieldValue.increment(1),
    });

    await updatePopularity(userId, 1);

    res.json({ success: true, message: "Reaction added to comment!" });
  } catch (err) {
    console.error("Error reacting to comment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const removeCommentReaction = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.uid;

    const reactionRef = db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("reactions")
      .doc(userId);

    const reactionDoc = await reactionRef.get();
    if (!reactionDoc.exists) {
      return res.status(404).json({ success: false, error: "Reaction not found" });
    }

    await reactionRef.delete();
    await db.collection("posts").doc(postId).collection("comments").doc(commentId).update({
      likes: FieldValue.increment(-1),
    });

    res.json({ success: true, message: "Reaction removed from comment" });
  } catch (err) {
    console.error("Error removing reaction from comment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ NEW: Get all reactions for a comment
export const getCommentReactions = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const snapshot = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("reactions")
      .get();

    const grouped = {};
    const reactions = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      reactions.push({ id: doc.id, ...data });

      if (!grouped[data.type]) {
        grouped[data.type] = 0;
      }
      grouped[data.type]++;
    });

    res.json({ success: true, grouped, reactions });
  } catch (err) {
    console.error("Error fetching comment reactions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
