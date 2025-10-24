import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

// Helper to generate incremental incognito IDs
async function getNextIncognitoId() {
  const counterRef = db.collection("counters").doc("incognitoCounter");

  const newId = await db.runTransaction(async (t) => {
    const counterDoc = await t.get(counterRef);
    let current = 0;

    if (!counterDoc.exists) {
      t.set(counterRef, { current: 1 });
      current = 1;
    } else {
      current = counterDoc.data().current + 1;
      t.update(counterRef, { current });
    }

    return current;
  });

  return `Fire #${String(newId).padStart(4, "0")}`;
}

// ✅ Create new incognito post
export const createIncognitoPost = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const postId = await getNextIncognitoId();

    const newPost = {
      postId,
      message,
      createdAt: Timestamp.now(),
      likes: 0,
      commentsCount: 0,
      userId: req.user.uid,
      username: req.user.username, // 🔥 show username in frontend
    };

    const docRef = await db.collection("incognitoPosts").add(newPost);

    res.status(201).json({ success: true, id: docRef.id, post: newPost });
  } catch (error) {
    console.error("Error creating incognito post:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get all incognito posts
export const getIncognitoPosts = async (req, res) => {
  try {
    const snapshot = await db
      .collection("incognitoPosts")
      .orderBy("createdAt", "desc")
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching incognito posts:", error);
    res.status(500).json({ success: false, error: "Error fetching incognito posts" });
  }
};

// ✅ Delete incognito post (only owner)
export const deleteIncognitoPost = async (req, res) => {
  try {
    const { id } = req.params;
    const postRef = db.collection("incognitoPosts").doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const postData = postDoc.data();

    if (postData.userId !== req.user.uid) {
      return res.status(403).json({ success: false, error: "Not allowed to delete this post" });
    }

    await postRef.delete();

    res.json({ success: true, message: "Post deleted successfully!" });
  } catch (error) {
    console.error("Error deleting incognito post:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchIncognitoPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ success: false, error: "Search query is required" });
    }

    const snapshot = await db.collection("incognitoPosts").get();

    const posts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(post =>
        post.postId.toLowerCase().includes(q.toLowerCase()) ||
        post.username.toLowerCase().includes(q.toLowerCase()) ||
        post.message.toLowerCase().includes(q.toLowerCase())
      );

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error searching incognito posts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};