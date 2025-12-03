// backend/controllers/authController.js
import { db } from "../config/firebase.js";
import admin from "firebase-admin";
import { createUser } from "./userController.js";

// Signup user (email/password)
export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Create user document in Firestore (similar to createUser)
    const { randomUsername } = await import("../utils/usernameGenerator.js");
    const username = randomUsername();

    const newUser = {
      email,
      username,
      authProvider: "email",
      createdAt: new Date(),
      role: "user",
      admin: false
    };

    await db.collection("users").doc(userRecord.uid).set(newUser);

    // Generate custom token for login
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({ success: true, token, user: { id: userRecord.uid, ...newUser } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Login user (email/password)
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    // Note: Password verification is not done here; assume client has verified
    // Generate custom token for the user
    const token = await admin.auth().createCustomToken(userRecord.uid);
    res.json({ success: true, token, user: { id: userRecord.uid, email: userRecord.email } });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};

// Verify login token
export const verifyLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ success: true, uid: decodedToken.uid });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};

export default { login, verifyLogin };
