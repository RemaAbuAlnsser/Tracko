import express from "express";
import db from "../config/database.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Create a new report
router.post("/", async (req, res) => {
  try {
    const {
      trainer_id,
      student_id,
      report_type,
      performance_rating,
      attendance,
      technical_skills,
      communication_skills,
      problem_solving,
      teamwork,
      comments
    } = req.body;

    // Validate required fields
    if (!trainer_id || !student_id) {
      return res.status(400).json({
        success: false,
        message: "Trainer ID and Student ID are required"
      });
    }

    // Insert report
    const insertQuery = `
      INSERT INTO Trainer_Reports (
        trainer_id, student_id, report_type, performance_rating,
        attendance, technical_skills, communication_skills,
        problem_solving, teamwork, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(
        insertQuery,
        [
          trainer_id,
          student_id,
          report_type || 'weekly',
          performance_rating || 5,
          attendance !== undefined ? attendance : true,
          technical_skills || 5,
          communication_skills || 5,
          problem_solving || 5,
          teamwork || 5,
          comments || ''
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    // Get student's user_id for notification
    const studentQuery = `
      SELECT s.id, s.user_id, u.full_name, u.email
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.id = ?
    `;

    const students = await new Promise((resolve, reject) => {
      db.query(studentQuery, [student_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (students.length > 0) {
      const student = students[0];
      
      // Send notification to student
      await Notification.create({
        user_id: student.user_id,
        title: 'تقرير تدريب جديد',
        message: `تم نشر تقرير ${report_type === 'weekly' ? 'أسبوعي' : report_type === 'monthly' ? 'شهري' : 'نهائي'} جديد من المدرب`,
        type: 'training_report'
      });

      console.log(`✅ Sent report notification to student ${student.full_name}`);
    }

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      reportId: result.insertId
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get reports by trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;

    const query = `
      SELECT 
        tr.*,
        u.full_name as student_name,
        s.major,
        s.academic_year
      FROM Trainer_Reports tr
      JOIN Students s ON tr.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      WHERE tr.trainer_id = ?
      ORDER BY tr.created_at DESC
    `;

    const reports = await new Promise((resolve, reject) => {
      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get reports by student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const query = `
      SELECT 
        tr.*,
        t.specialization as trainer_specialization,
        u.full_name as trainer_name
      FROM Trainer_Reports tr
      JOIN Trainers t ON tr.trainer_id = t.id
      JOIN Users u ON t.user_id = u.id
      WHERE tr.student_id = ?
      ORDER BY tr.created_at DESC
    `;

    const reports = await new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching student reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get report by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        tr.*,
        u1.full_name as student_name,
        s.major,
        s.academic_year,
        u2.full_name as trainer_name,
        t.specialization as trainer_specialization
      FROM Trainer_Reports tr
      JOIN Students s ON tr.student_id = s.id
      JOIN Users u1 ON s.user_id = u1.id
      JOIN Trainers t ON tr.trainer_id = t.id
      JOIN Users u2 ON t.user_id = u2.id
      WHERE tr.id = ?
    `;

    const reports = await new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    res.json({
      success: true,
      report: reports[0]
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
