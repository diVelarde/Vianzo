import { db } from "../config/firebase.js";

export const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const snapshot = await db.collection("posts").get();

    const posts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (post) =>
          (post.postId || "").toLowerCase().includes(q.toLowerCase()) ||
          (post.message || "").toLowerCase().includes(q.toLowerCase())
      );

    res.json({ success: true, posts });
  } catch (err) {
    console.error("Error searching posts:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const snapshot = await db.collection("users").get();

    const users = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user) => (user.username || "").toLowerCase().includes(q.toLowerCase()));

    res.json({ success: true, users });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Search incognito posts
export const searchIncognitoPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const snapshot = await db.collection("incognitoPosts").get();

    const posts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (post) =>
          (post.postId || "").toLowerCase().includes(q.toLowerCase()) ||
          (post.username || "").toLowerCase().includes(q.toLowerCase()) ||
          (post.message || "").toLowerCase().includes(q.toLowerCase())
      );

    res.json({ success: true, posts });
  } catch (err) {
    console.error("Error searching incognito posts:", err);
    res.status(500).json({ message: err.message });
  }
};
