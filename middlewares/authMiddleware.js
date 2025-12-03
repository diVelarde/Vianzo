import { users } from "../data.js";
import jwt from "jsonwebtoken";

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

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // base user from token
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role: decodedToken.role || null,
      admin: decodedToken.admin === true || false,
      username: decodedToken.username || null,
    };

    // if token has no role/admin, try to read users array for role
    if (!user.role && !user.admin) {
      try {
        const userData = users.find(u => u.id === user.uid);
        if (userData) {
          user.role = userData.role || user.role;
          user.admin = userData.admin || user.admin;
          user.username = userData.username || user.username;
        }
      } catch (e) {
        console.warn("verifyToken: failed to read user data for role fallback:", e?.message || e);
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
