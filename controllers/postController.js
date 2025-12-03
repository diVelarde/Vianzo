import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";
import { updatePopularity } from "../utils/updatePopularity.js";
import { posts } from "../data.js";

// Create a new post with auto-increment ID
export const createPost = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Get the current count of posts for ID generation
    const snapshot = await db.collection("posts").get();
    const count = snapshot.size + 1;

    // Format postId like "Whispering #0001"
    const formattedPostId = `Whispering #${String(count).padStart(4, "0")}`;

    const userId = req.user?.uid || null;

    const newPost = {
      postId: formattedPostId,
      message,
      createdAt: Timestamp.now(),
      likes: 0,
      commentsCount: 0,
      status: "approved", // Auto-approve for simplicity
      userId,
    };

    const newPostRef = await db.collection("posts").add(newPost);

    res.status(201).json({ success: true, id: newPostRef.id, post: { id: newPostRef.id, ...newPost } });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve a post (Admin only)
export const approvePost = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Only admins can approve posts" });
    }

    const { id } = req.params; // Firestore doc ID
    const postRef = db.collection("posts").doc(id);

    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    await postRef.update({ status: "approved" });

    res.json({ success: true, message: "Post approved successfully" });
  } catch (err) {
    console.error("Error approving post:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reject a post (Admin only)
export const rejectPost = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Only admins can reject posts" });
    }

    const { id } = req.params; // Firestore doc ID
    const postRef = db.collection("posts").doc(id);

    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    await postRef.update({ status: "rejected" });

    res.json({ success: true, message: "Post rejected successfully" });
  } catch (err) {
    console.error("Error rejecting post:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPendingPosts = async (req, res) => {
  try {
    const snapshot = await db
      .collection("posts")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, posts });
  } catch (err) {
    console.error("Error fetching pending posts:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const postRef = db.collection("posts").doc(id);

    // Check if post exists
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const postData = postDoc.data();

    // Check if user owns the post or is admin
    if (postData.userId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "You don't have permission to update this post" 
      });
    }

    // Update the post
    await postRef.update({
      message,
      updatedAt: Timestamp.now()
    });

    res.json({ 
      success: true, 
      message: "Post updated successfully",
      post: {
        id,
        message,
        updatedAt: Timestamp.now()
      }
    });

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all posts (only approved ones for normal users)
export const getPosts = async (req, res) => {
  try {
    let filteredPosts = posts.filter(p => p.status === "approved");

    // Optional search/filter from query
    const { q, sort } = req.query;
    if (q) filteredPosts = filteredPosts.filter((p) => (p.message || "").toLowerCase().includes(q.toLowerCase()));
    if (sort === "new")
      filteredPosts = filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === "popular")
      filteredPosts = filteredPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    return res.json({ success: true, posts: filteredPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      success: false,
      error: "Error fetching posts",
      message: error?.message,
    });
  }
};


export const getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = posts.find(p => p.id === postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // 🔒 Only admins can view non-approved posts
    if (post.status !== "approved" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "This post is not available" });
    }

    res.json({ success: true, post });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a post + all its comments
export const getPostWithComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const postData = postDoc.data();

    // 🔒 Only admins can view non-approved posts
    if (postData.status !== "approved" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "This post is not available" });
    }

    const commentsSnapshot = await postRef.collection("comments").orderBy("createdAt", "desc").get();
    const comments = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, post: { id: postDoc.id, ...postData }, comments });
  } catch (err) {
    console.error("Error fetching post with comments:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

