import { db } from "../config/firebase.js";
import admin from "firebase-admin";
const FieldValue = admin.firestore.FieldValue;

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, error: "Comment cannot be empty" });
    }

    const comment = {
      text,
      userId: req.user.uid,
      createdAt: new Date(),
    };

    const docRef = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .add(comment);

    await db.collection("posts").doc(postId).update({
      commentsCount: FieldValue.increment(1),
    });

    res.json({ success: true, id: docRef.id, ...comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 5, startAfter } = req.query;

    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    let commentsQuery = postRef
      .collection("comments")
      .orderBy("createdAt", "desc")
      .limit(Number(limit));

    if (startAfter) {
      const startDoc = await postRef.collection("comments").doc(startAfter).get();
      if (startDoc.exists) {
        commentsQuery = commentsQuery.startAfter(startDoc);
      }
    }

    const commentsSnap = await commentsQuery.get();
    const comments = commentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisible = commentsSnap.docs.length > 0
      ? commentsSnap.docs[commentsSnap.docs.length - 1].id
      : null;

    res.json({
      success: true,
      comments,
      nextPageToken: lastVisible,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const commentRef = db.collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    const commentData = commentSnap.data();
    const isAdmin = req.user.admin === true;
    if (!isAdmin && commentData.userId !== req.user.uid) {
      return res.status(403).json({ success: false, error: "Not allowed to delete this comment" });
    }

    await commentRef.delete();
    await db.collection("posts").doc(postId).update({
      commentsCount: FieldValue.increment(-1),
    });

    res.json({ success: true, message: "Comment deleted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
