import express from "express";
import { login, verifyLogin, signup } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify", verifyLogin);

export default router;
