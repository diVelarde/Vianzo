import { db } from "../config/firebase.js";
import { Timestamp } from "../config/firebase.js";

/**
 * Middleware to verify Firebase ID token and attach decoded user info to req.user
 */
export const verifyToken = async (req, res, next) => {
  try {
    if (process.env.LOCAL_TEST === "true") {
      req.user = { uid: "local-test-uid", email: "test@example.com", role: "admin", admin: true, username: "dwindlingofficer289" };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // base user from token
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role: decodedToken.role || null,
      admin: decodedToken.admin === true || false,
      username: decodedToken.username || null,
    };

    // if token has no role/admin, try to read Firestore users collection for role
    if (!user.role && !user.admin) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          user.role = data?.role || user.role;
          if (data?.admin === true) user.admin = true;
        }
      } catch (e) {
        console.warn("verifyToken: failed to read user doc for role fallback:", e?.message || e);
        // continue without failing auth
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};