import express from "express";
import WeeklyReport from "../models/WeeklyReport.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Submit a new weekly report
router.post("/", async (req, res) => {
  try {
    console.log("📝 Creating/Updating weekly report:", req.body);

    const { 
      student_id, 
      trainer_id, 
      plan_id, 
      week_number, 
      report_text, 
      report_file 
    } = req.body;

    if (!student_id || !week_number) {
      return res.status(400).json({
        success: false,
        message: "Student ID and week number are required"
      });
    }

    if (!report_text && !report_file) {
      return res.status(400).json({
        success: false,
        message: "Please provide report text or upload a file"
      });
    }

    // Check if report already exists for this student and week
    const checkQuery = `
      SELECT id FROM Weekly_Reports 
      WHERE student_id = ? AND week_number = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `;
    
    const existingReport = await new Promise((resolve, reject) => {
      db.query(checkQuery, [student_id, week_number], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });

    let reportId;
    
    if (existingReport) {
      // Update existing report
      console.log(`📝 Updating existing report ID: ${existingReport.id}`);
      
      const updateQuery = `
        UPDATE Weekly_Reports 
        SET report_text = ?, 
            report_file = ?, 
            trainer_id = ?,
            plan_id = ?,
            status = 'pending',
            trainer_comment = NULL,
            reviewed_at = NULL,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await new Promise((resolve, reject) => {
        db.query(
          updateQuery, 
          [report_text, report_file, trainer_id || null, plan_id || null, existingReport.id],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
      
      reportId = existingReport.id;
      console.log("✅ Weekly report updated successfully");
    } else {
      // Create new report
      const result = await WeeklyReport.create({
        student_id,
        trainer_id: trainer_id || null,
        plan_id: plan_id || null,
        week_number,
        report_text,
        report_file
      });

      reportId = result.insertId;
      console.log("✅ Weekly report created successfully with ID:", reportId);
    }

    // Send notification to trainer if trainer_id exists
    if (trainer_id) {
      try {
        // Get trainer user_id
        const trainerQuery = `SELECT user_id FROM Trainers WHERE id = ?`;
        const trainerResult = await new Promise((resolve, reject) => {
          db.query(trainerQuery, [trainer_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (trainerResult.length > 0) {
          const trainerUserId = trainerResult[0].user_id;

          // Get student name
          const studentQuery = `SELECT u.full_name FROM Students s JOIN Users u ON s.user_id = u.id WHERE s.id = ?`;
          const studentResult = await new Promise((resolve, reject) => {
            db.query(studentQuery, [student_id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          const studentName = studentResult.length > 0 ? studentResult[0].full_name : 'Student';

          // Create notification
          await Notification.create({
            user_id: trainerUserId,
            title: 'New Weekly Report',
            message: `${studentName} submitted Week ${week_number} report`,
            type: 'weekly_report',
            related_id: reportId
          });

          console.log("🔔 Notification sent to trainer");
        }
      } catch (notifError) {
        console.error("❌ Error sending notification:", notifError);
        // Continue even if notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Weekly report submitted successfully",
      data: { id: reportId }
    });
  } catch (error) {
    console.error("❌ Error creating weekly report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all reports for a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`📚 Getting weekly reports for student ${studentId}...`);

    const reports = await WeeklyReport.findByStudentId(studentId);

    console.log(`✅ Found ${reports.length} weekly reports`);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("❌ Error fetching weekly reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all reports for a trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    console.log(`📚 Getting weekly reports for trainer ${trainerId}...`);

    const reports = await WeeklyReport.findByTrainerId(trainerId);

    console.log(`✅ Found ${reports.length} weekly reports`);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("❌ Error fetching weekly reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get a specific report by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Getting weekly report ${id}...`);

    const report = await WeeklyReport.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    console.log(`✅ Found weekly report`);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Review a weekly report
router.put("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trainer_comment } = req.body;

    console.log(`🔍 Reviewing weekly report ${id} with status: ${status}`);

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    await WeeklyReport.review(id, status, trainer_comment);

    // Send notification to student
    try {
      const report = await WeeklyReport.findById(id);
      
      if (report) {
        const studentQuery = `SELECT user_id FROM Students WHERE id = ?`;
        const studentResult = await new Promise((resolve, reject) => {
          db.query(studentQuery, [report.student_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (studentResult.length > 0) {
          const studentUserId = studentResult[0].user_id;
          
          await Notification.create({
            user_id: studentUserId,
            title: status === 'approved' ? 'Weekly Report Approved' : 'Weekly Report Needs Revision',
            message: `Your Week ${report.week_number} report has been ${status}${trainer_comment ? ': ' + trainer_comment : ''}`,
            type: 'weekly_report_review',
            related_id: parseInt(id)
          });

          console.log("🔔 Review notification sent to student");
        }
      }
    } catch (notifError) {
      console.error("❌ Error sending notification:", notifError);
    }

    console.log(`✅ Weekly report ${id} reviewed with status: ${status}`);

    res.json({
      success: true,
      message: "Weekly report reviewed successfully"
    });
  } catch (error) {
    console.error("❌ Error reviewing weekly report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get pending reports count for trainer
router.get("/trainer/:trainerId/pending-count", async (req, res) => {
  try {
    const { trainerId } = req.params;

    const count = await WeeklyReport.getPendingCount(trainerId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching pending weekly reports count:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get pending reports count for a specific student with trainer
router.get("/student/:studentId/trainer/:trainerId/pending-count", async (req, res) => {
  try {
    const { studentId, trainerId } = req.params;

    const count = await WeeklyReport.getPendingCountByStudent(studentId, trainerId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching student pending weekly reports count:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update a weekly report
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating weekly report ${id}:`, req.body);

    const { report_text, report_file } = req.body;

    await WeeklyReport.update(id, {
      report_text,
      report_file
    });

    console.log("✅ Weekly report updated successfully");

    res.json({
      success: true,
      message: "Weekly report updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating weekly report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete a weekly report
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await WeeklyReport.delete(id);

    res.json({
      success: true,
      message: "Weekly report deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting weekly report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
