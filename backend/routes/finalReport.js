import express from "express";
import FinalReport from "../models/FinalReport.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Create a new final report
router.post("/", async (req, res) => {
  try {
    console.log("📝 Creating final report:", req.body);

    const {
      trainer_id,
      student_id,
      overall_performance,
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating
    } = req.body;

    // Get the internship_id for this student and trainer
    const getInternshipQuery = `
      SELECT i.id as internship_id
      FROM Internship_Matches im
      JOIN Internships i ON im.internship_id = i.id
      JOIN Internship_Trainers it ON i.id = it.internship_id
      WHERE im.student_id = ? 
        AND it.trainer_id = ? 
        AND im.status = 'accepted'
      ORDER BY im.applied_at DESC
      LIMIT 1
    `;

    db.query(getInternshipQuery, [student_id, trainer_id], async (err, results) => {
      if (err) {
        console.error("❌ Error getting internship:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }

      const internship_id = results.length > 0 ? results[0].internship_id : null;

      // Calculate overall rating (average of all ratings)
      const ratings = [
        technical_skills_rating,
        communication_rating,
        teamwork_rating,
        problem_solving_rating,
        attendance_rating
      ].filter(r => r != null);

      const overall_rating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : null;

      try {
        const result = await FinalReport.create({
          trainer_id,
          student_id,
          internship_id,
          overall_performance,
          technical_skills_rating,
          communication_rating,
          teamwork_rating,
          problem_solving_rating,
          attendance_rating,
          overall_rating
        });

        console.log("✅ Final report created successfully");
        console.log("📧 Starting notification process...");
        console.log("📊 internship_id:", internship_id, "student_id:", student_id);

        // Get student, university, and company information for notifications
        const getDetailsQuery = `
          SELECT 
            s.id as student_id,
            s.user_id as student_user_id,
            s.university_id,
            u1.full_name as student_name,
            u2.id as university_user_id,
            i.company_id,
            u3.id as company_user_id,
            c.name as company_name
          FROM Students s
          JOIN Users u1 ON s.user_id = u1.id
          LEFT JOIN Universities univ ON s.university_id = univ.id
          LEFT JOIN Users u2 ON univ.user_id = u2.id
          LEFT JOIN Internships i ON i.id = ?
          LEFT JOIN Company c ON i.company_id = c.id
          LEFT JOIN Users u3 ON c.user_id = u3.id
          WHERE s.id = ?
        `;

        db.query(getDetailsQuery, [internship_id, student_id], async (detailsErr, detailsResults) => {
          if (detailsErr) {
            console.error("❌ Error getting details for notifications:", detailsErr);
          } else if (detailsResults.length > 0) {
            const details = detailsResults[0];
            console.log("📋 Details for notifications:", details);

            // Send notification to university
            if (details.university_user_id) {
              try {
                await Notification.create({
                  user_id: details.university_user_id,
                  title: 'New Final Report',
                  message: `A final report has been submitted for student ${details.student_name}`,
                  type: 'final_report'
                });
                console.log(`✅ Notification sent to university (user_id: ${details.university_user_id})`);
              } catch (notifErr) {
                console.error("❌ Error sending notification to university:", notifErr);
              }
            } else {
              console.log("⚠️ No university_user_id found");
            }

            // Send notification to company
            if (details.company_user_id) {
              try {
                await Notification.create({
                  user_id: details.company_user_id,
                  title: 'New Final Report',
                  message: `A final report has been submitted for student ${details.student_name} from ${details.company_name}`,
                  type: 'final_report'
                });
                console.log(`✅ Notification sent to company (user_id: ${details.company_user_id})`);
              } catch (notifErr) {
                console.error("❌ Error sending notification to company:", notifErr);
              }
            } else {
              console.log("⚠️ No company_user_id found");
            }
          } else {
            console.log("⚠️ No details found for notifications");
          }
        });

        res.status(201).json({
          success: true,
          message: "Final report created successfully",
          data: { id: result.insertId }
        });
      } catch (error) {
        console.error("❌ Error creating final report:", error);
        res.status(500).json({
          success: false,
          message: error.code === 'ER_DUP_ENTRY' 
            ? "A final report already exists for this student and internship"
            : "Server error"
        });
      }
    });
  } catch (error) {
    console.error("❌ Error creating final report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all reports by trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    console.log(`📚 Getting final reports for trainer ${trainerId}...`);

    const reports = await FinalReport.findByTrainer(trainerId);

    console.log(`✅ Found ${reports.length} final reports`);

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("❌ Error fetching final reports:", error);
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
    console.log(`📚 Getting final reports for student ${studentId}...`);

    const reports = await FinalReport.findByStudent(studentId);

    console.log(`✅ Found ${reports.length} final reports`);

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("❌ Error fetching final reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get specific report
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const report = await FinalReport.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update report
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating final report ${id}:`, req.body);

    const {
      overall_performance,
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating
    } = req.body;

    // Calculate overall rating
    const ratings = [
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating
    ].filter(r => r != null);

    const overall_rating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : null;

    await FinalReport.update(id, {
      overall_performance,
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating,
      overall_rating
    });

    console.log("✅ Final report updated successfully");

    res.json({
      success: true,
      message: "Final report updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating final report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete report
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await FinalReport.delete(id);

    res.json({
      success: true,
      message: "Final report deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting final report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Approve final report by university
router.patch("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { university_id } = req.body;

    console.log(`✅ Approving final report ${id} by university ${university_id}`);

    const query = `
      UPDATE Final_Reports 
      SET university_approved = TRUE,
          approved_at = NOW(),
          approved_by = ?
      WHERE id = ?
    `;

    db.query(query, [university_id, id], async (err, result) => {
      if (err) {
        console.error("❌ Error approving final report:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Final report not found"
        });
      }

      console.log("✅ Final report approved successfully");

      // Get student information to send notification
      const getStudentQuery = `
        SELECT 
          s.user_id,
          u.full_name as student_name
        FROM Final_Reports fr
        JOIN Students s ON fr.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        WHERE fr.id = ?
      `;

      db.query(getStudentQuery, [id], async (studentErr, studentResults) => {
        if (studentErr) {
          console.error("❌ Error getting student info:", studentErr);
        } else if (studentResults.length > 0) {
          const student = studentResults[0];

          // Send notification to student
          try {
            await Notification.create({
              user_id: student.user_id,
              title: 'Final Report Approved',
              message: `Your final report has been approved by the university`,
              type: 'final_report'
            });
            console.log(`✅ Approval notification sent to student ${student.student_name}`);
          } catch (notifErr) {
            console.error("❌ Error sending approval notification:", notifErr);
          }
        }
      });

      res.json({
        success: true,
        message: "Final report approved successfully"
      });
    });
  } catch (error) {
    console.error("❌ Error approving final report:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Upload certificate by company
router.patch("/:id/certificate", async (req, res) => {
  try {
    const { id } = req.params;
    const { certificate_file } = req.body;

    console.log(`📜 Uploading certificate for final report ${id}`);

    // Update certificate in final report
    const updateQuery = `
      UPDATE Final_Reports 
      SET certificate_file = ?,
          certificate_uploaded_at = NOW()
      WHERE id = ?
    `;

    db.query(updateQuery, [certificate_file, id], async (err, result) => {
      if (err) {
        console.error("❌ Error uploading certificate:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Final report not found"
        });
      }

      // Get student information to send notification and update status
      const getStudentQuery = `
        SELECT 
          s.id as student_id,
          s.user_id,
          u.full_name as student_name
        FROM Final_Reports fr
        JOIN Students s ON fr.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        WHERE fr.id = ?
      `;

      db.query(getStudentQuery, [id], async (studentErr, studentResults) => {
        if (studentErr) {
          console.error("❌ Error getting student info:", studentErr);
        } else if (studentResults.length > 0) {
          const student = studentResults[0];

          // Update student status to 'completed'
          const updateStatusQuery = `
            UPDATE Students 
            SET status = 'completed' 
            WHERE id = ?
          `;
          
          db.query(updateStatusQuery, [student.student_id], (statusErr) => {
            if (statusErr) {
              console.error("❌ Error updating student status:", statusErr);
            } else {
              console.log(`✅ Student status updated to 'completed' for student ${student.student_name}`);
            }
          });

          // Send notification to student
          try {
            await Notification.create({
              user_id: student.user_id,
              title: 'Certificate Received',
              message: `Congratulations! Your training completion certificate has been uploaded`,
              type: 'certificate'
            });
            console.log(`✅ Certificate notification sent to student ${student.student_name}`);
          } catch (notifErr) {
            console.error("❌ Error sending certificate notification:", notifErr);
          }
        }
      });

      console.log("✅ Certificate uploaded successfully");

      res.json({
        success: true,
        message: "Certificate uploaded successfully"
      });
    });
  } catch (error) {
    console.error("❌ Error uploading certificate:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
