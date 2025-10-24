import { db } from "../config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

// Create a new report (for user or post)
export const createReport = async (req, res) => {
  try {
    const { type, targetId, reportedBy, reason } = req.body;

    if (!["user", "post"].includes(type)) {
      return res.status(400).json({ success: false, error: "Invalid report type" });
    }

    if (!targetId || !reportedBy || !reason) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const report = {
      type,
      targetId,
      reportedBy,
      reason,
      createdAt: Timestamp.now(),
      status: "pending"
    };

    const docRef = await db.collection("reports").add(report);

    res.status(201).json({ success: true, id: docRef.id, report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all reports (for admin review)
export const getReports = async (req, res) => {
  try {
    const snapshot = await db
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get();

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update report status (admin action)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!["pending", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const reportRef = db.collection("reports").doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    await reportRef.update({ status });

    res.json({ success: true, message: "Report updated" });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
