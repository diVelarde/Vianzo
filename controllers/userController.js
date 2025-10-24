import { db } from "../config/firebase.js";
import { randomUsername } from "../utils/usernameGenerator.js";

export const createUser = async (req, res) => {
  try {
    const { uid, email, authProvider } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    // generate random username
    const username = randomUsername();

    const newUser = {
      email,
      username,
      authProvider: authProvider || "email",
      createdAt: new Date(),
      // default role/admin fields for the auth fallback
      role: "user",
      admin: false
    };

    let docRef;
    if (uid) {
      // create/overwrite doc using auth UID so authMiddleware can find it
      await db.collection("users").doc(uid).set(newUser);
      docRef = { id: uid };
    } else {
      // legacy behavior: create a document with auto id
      const r = await db.collection("users").add(newUser);
      docRef = r;
    }

    res.status(201).json({
      success: true,
      id: docRef.id,
      user: newUser
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const docRef = db.collection("users").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserRankings = async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    const rankings = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      let score = 0;

      // posts authored by user
      const postsSnap = await db.collection("posts").where("userId", "==", userId).get();
      score += postsSnap.size * 5;

      // Try collectionGroup for comments; if unsupported, fallback to scanning post subcollections
      let commentsSnap;
      try {
        commentsSnap = await db.collectionGroup("comments").where("userId", "==", userId).get();
      } catch (e) {
        if (e?.code === 9 || String(e).includes("FAILED_PRECONDITION")) {
          // Fallback: scan comments subcollections under posts and incognitoPosts
          const commentDocs = [];
          const postsAll = await db.collection("posts").get();
          for (const p of postsAll.docs) {
            const cs = await p.ref.collection("comments").where("userId", "==", userId).get();
            commentDocs.push(...cs.docs);
          }
          try {
            const incAll = await db.collection("incognitoPosts").get();
            for (const p of incAll.docs) {
              const cs = await p.ref.collection("comments").where("userId", "==", userId).get();
              commentDocs.push(...cs.docs);
            }
          } catch (_) {
            // ignore if incognitoPosts missing or inaccessible
          }
          commentsSnap = { size: commentDocs.length, docs: commentDocs };
        } else {
          throw e;
        }
      }

      score += (commentsSnap?.size || 0) * 2;

      // reactions on posts authored by this user
      for (const postDoc of postsSnap.docs) {
        const reactionsSnap = await postDoc.ref.collection("reactions").get();
        score += reactionsSnap.size;
      }

      // reactions on comments authored by this user
      for (const commentDoc of (commentsSnap?.docs || [])) {
        const reactionsSnap = await commentDoc.ref.collection("reactions").get();
        score += reactionsSnap.size;
      }

      rankings.push({
        userId,
        username: userDoc.data().username || "Anonymous",
        score,
      });
    }

    rankings.sort((a, b) => b.score - a.score);

    res.json({ success: true, rankings });
  } catch (err) {
    console.error("getUserRankings ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      code: err?.code || null,
      stack: err?.stack ? err.stack.split("\n").slice(0,5) : undefined
    });
  }
};