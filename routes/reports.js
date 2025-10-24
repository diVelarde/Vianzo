import express from "express";
import { 
    createReport, 
    getReports, 
    updateReportStatus 
} from "../controllers/reportController.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// User submits a report
router.post("/", createReport);

// Admin fetches all reports
router.get("/", isAdmin , getReports);

// Admin updates a report’s status
router.patch("/:reportId", isAdmin , updateReportStatus);

export default router;
