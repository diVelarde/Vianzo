import admin from "firebase-admin";
import { createUser } from "./userController.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { users } from "../data.js";
import { db, auth, Timestamp } from "../config/firebase.js";

// Signup user (email/password)
export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user already exists in Firestore
    const existingUserQuery = await db.collection('users').where('email', '==', email).get();
    if (!existingUserQuery.empty) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username
    const { randomUsername } = await import("../utils/usernameGenerator.js");
    const username = randomUsername();

    // Create user document in Firestore
    const userDocRef = db.collection('users').doc();
    const userData = {
      authProvider: "email",
      createdAt: Timestamp.now(),
      email,
      password: hashedPassword,
      role: "user",
      username
    };
    await userDocRef.set(userData);

    // Generate JWT token
    const token = jwt.sign({ uid: userDocRef.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.json({ success: true, token, user: { id: userDocRef.id, email, username } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Login user (email/password)
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Get user document from Firestore
    const userQuery = await db.collection('users').where('email', '==', email).get();
    if (userQuery.empty) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check password
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ uid: userDoc.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: userDoc.id, email, username: userData.username } });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};

// Verify login token
export const verifyLogin = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    res.json({ success: true, uid: decoded.uid, email: decoded.email });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};

// Logout (client-side, just return success)
export const logout = async (req, res) => {
  res.json({ success: true, message: "Logged out" });
};

export default { login, verifyLogin, logout };
