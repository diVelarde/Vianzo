import express from "express";
import { 
    createUser, 
    getUsers, 
    getUserById, 
    getUserRankings 
} from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);

router.get("/rankings/all", getUserRankings);
router.get("/:id", getUserById);

export default router;
