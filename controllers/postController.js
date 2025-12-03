import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";
import { updatePopularity } from "../utils/updatePopularity.js";

// Create a new post with auto-increment ID
export const createPost = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const counterRef = db.collection("counters").doc("postCounter");

    const newPostId = await db.runTransaction(async (t) => {
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

    // Format postId like "Whispering #0001"
    const formattedPostId = `Whispering #${String(newPostId).padStart(4, "0")}`;

    const userId = req.user?.uid || null;

    const newPost = {
      postId: formattedPostId,
      message,
      createdAt: Timestamp.now(),
      likes: 0,
      commentsCount: 0,
      status: "pending",
      userId,
    };

    const docRef = await db.collection("posts").add(newPost);

    if (userId) {
      await updatePopularity(userId, 5);
    }

    res.status(201).json({ success: true, id: docRef.id, post: newPost });
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
    const postRef = db.collection("posts");

    // Fetch only approved posts
    const snapshot = await postRef
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .get();

    let posts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const postData = doc.data();

        // Count comments if collection exists
        let commentsCount = 0;
        try {
          const commentsSnapshot = await postRef.doc(doc.id).collection("comments").get();
          commentsCount = commentsSnapshot.size;
        } catch {
          commentsCount = 0;
        }

        return {
          id: doc.id,
          postId: postData.postId,
          message: postData.message,
          createdAt: postData.createdAt,
          likes: postData.likes,
          commentsCount,
          status: postData.status,
          userId: postData.userId,
        };
      })
    );

    // Optional search/filter from query
    const { q, sort } = req.query;
    if (q) posts = posts.filter((p) => (p.message || "").toLowerCase().includes(q.toLowerCase()));
    if (sort === "new")
      posts = posts.sort((a, b) => {
        const aTs = a.createdAt?.toMillis?.() || 0;
        const bTs = b.createdAt?.toMillis?.() || 0;
        return bTs - aTs;
      });
    else if (sort === "popular")
      posts = posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    return res.json({ success: true, posts });
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

    res.json({ success: true, post: { id: postDoc.id, ...postData } });
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

