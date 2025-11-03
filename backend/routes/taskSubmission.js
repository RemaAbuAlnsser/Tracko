import express from "express";
import TaskSubmission from "../models/TaskSubmission.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Initialize table
TaskSubmission.createTable().catch(err => {
  console.error('Error initializing task submissions table:', err);
});

// Submit a task solution
router.post("/submit", async (req, res) => {
  try {
    const {
      student_id,
      trainer_id,
      week_id,
      plan_id,
      task_title,
      submission_file,
      submission_text,
      submission_link
    } = req.body;

    // Validate required fields
    if (!student_id || !trainer_id || !week_id || !plan_id || !task_title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check if at least one submission method is provided
    if (!submission_file && !submission_text && !submission_link) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one submission method (file, text, or link)"
      });
    }

    // Check if submission already exists for this student and week
    const existingSubmission = await TaskSubmission.findByStudentAndWeek(student_id, week_id);
    
    let submissionId;
    let isResubmission = false;

    if (existingSubmission) {
      // Update existing submission (resubmit)
      console.log(`🔄 Updating existing submission ID: ${existingSubmission.id}`);
      await TaskSubmission.resubmit(existingSubmission.id, {
        submission_file,
        submission_text,
        submission_link
      });
      submissionId = existingSubmission.id;
      isResubmission = true;
      console.log(`✅ Task submission updated (resubmitted) with ID: ${submissionId}`);
    } else {
      // Create new submission
      const result = await TaskSubmission.create({
        student_id,
        trainer_id,
        week_id,
        plan_id,
        task_title,
        submission_file,
        submission_text,
        submission_link
      });
      submissionId = result.insertId;
      console.log(`✅ Task submission created with ID: ${submissionId}`);
    }

    // Update completed hours if this is a new submission (not resubmission)
    if (!isResubmission) {
      try {
        // Get student's internship match with hours_per_week
        const matchQuery = `
          SELECT im.id, im.hours_per_week, im.completed_hours, im.internship_id,
                 s.university_id, i.company_id
          FROM Internship_Matches im
          JOIN Students s ON im.student_id = s.id
          JOIN Internships i ON im.internship_id = i.id
          WHERE im.student_id = ? AND im.status = 'accepted'
          LIMIT 1
        `;
        
        const matchResult = await new Promise((resolve, reject) => {
          db.query(matchQuery, [student_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (matchResult.length > 0 && matchResult[0].hours_per_week) {
          const match = matchResult[0];
          const newCompletedHours = (match.completed_hours || 0) + match.hours_per_week;
          
          // Update completed_hours
          const updateHoursQuery = `
            UPDATE Internship_Matches 
            SET completed_hours = ? 
            WHERE id = ?
          `;
          
          await new Promise((resolve, reject) => {
            db.query(updateHoursQuery, [newCompletedHours, match.id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          console.log(`⏰ Updated completed hours: ${match.completed_hours || 0} → ${newCompletedHours}`);
          
          // Check if student reached required training hours
          const partnershipQuery = `
            SELECT training_hours 
            FROM University_Company_Partnerships 
            WHERE university_id = ? AND company_id = ?
          `;
          
          const partnershipResult = await new Promise((resolve, reject) => {
            db.query(partnershipQuery, [match.university_id, match.company_id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (partnershipResult.length > 0 && partnershipResult[0].training_hours) {
            const requiredHours = partnershipResult[0].training_hours;
            
            if (newCompletedHours >= requiredHours) {
              console.log(`🎉 Student completed required training hours! (${newCompletedHours}/${requiredHours})`);
              
              // Get student and university info
              const studentInfoQuery = `
                SELECT s.id, u.full_name, s.user_id as student_user_id, 
                       s.university_id, uni.email as university_email
                FROM Students s
                JOIN Users u ON s.user_id = u.id
                LEFT JOIN Universities uni ON s.university_id = uni.id
                WHERE s.id = ?
              `;
              
              const studentInfoResult = await new Promise((resolve, reject) => {
                db.query(studentInfoQuery, [student_id], (err, results) => {
                  if (err) reject(err);
                  else resolve(results);
                });
              });
              
              if (studentInfoResult.length === 0) {
                console.log('⚠️  Student info not found');
                return;
              }
              
              const studentInfo = studentInfoResult[0];
              console.log(`📊 Student info:`, {
                name: studentInfo.full_name,
                university_id: studentInfo.university_id,
                university_email: studentInfo.university_email
              });
              
              // Get trainer user_id
              const trainerUserQuery = `SELECT user_id FROM Trainers WHERE id = ?`;
              const trainerUserResult = await new Promise((resolve, reject) => {
                db.query(trainerUserQuery, [trainer_id], (err, results) => {
                  if (err) reject(err);
                  else resolve(results);
                });
              });
              
              const completionMessage = `${studentInfo.full_name} has completed all required training hours (${newCompletedHours}/${requiredHours} hours)!`;
              
              // Send notification to trainer
              if (trainerUserResult.length > 0) {
                console.log(`📧 Sending notification to trainer (user_id: ${trainerUserResult[0].user_id})`);
                await Notification.create({
                  user_id: trainerUserResult[0].user_id,
                  title: 'Training Hours Completed',
                  message: completionMessage,
                  type: 'training_completion'
                });
                console.log(`✅ Completion notification sent to trainer`);
              } else {
                console.log('⚠️  Trainer user_id not found');
              }
              
              // Send notification to university
              if (studentInfo.university_email) {
                // Get university user_id from email
                const uniUserQuery = `SELECT id FROM Users WHERE email = ?`;
                const uniUserResult = await new Promise((resolve, reject) => {
                  db.query(uniUserQuery, [studentInfo.university_email], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                  });
                });
                
                if (uniUserResult.length > 0) {
                  const universityUserId = uniUserResult[0].id;
                  console.log(`📧 Sending notification to university (user_id: ${universityUserId})`);
                  await Notification.create({
                    user_id: universityUserId,
                    title: 'Student Completed Training Hours',
                    message: completionMessage,
                    type: 'training_completion'
                  });
                  console.log(`✅ Completion notification sent to university`);
                } else {
                  console.log(`⚠️  University user not found for email: ${studentInfo.university_email}`);
                }
              } else {
                console.log('⚠️  University email not found');
              }
            }
          }
        }
      } catch (hoursError) {
        console.error('Error updating completed hours:', hoursError);
        // Don't fail the request if hours update fails
      }
    }

    // Send notification to trainer
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
        const studentQuery = `
          SELECT u.full_name 
          FROM Students s 
          JOIN Users u ON s.user_id = u.id 
          WHERE s.id = ?
        `;
        const studentResult = await new Promise((resolve, reject) => {
          db.query(studentQuery, [student_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        const studentName = studentResult.length > 0 ? studentResult[0].full_name : 'A student';

        const notificationTitle = isResubmission ? 'Task Resubmitted' : 'New Task Submission';
        const notificationMessage = isResubmission 
          ? `${studentName} has resubmitted a solution for: ${task_title}`
          : `${studentName} has submitted a solution for: ${task_title}`;

        await Notification.create({
          user_id: trainerUserId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'task_submission'
        });

        console.log(`🔔 Notification sent to trainer (${isResubmission ? 'resubmission' : 'new submission'})`);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: isResubmission ? "Task resubmitted successfully" : "Task submitted successfully",
      submissionId: submissionId,
      isResubmission: isResubmission
    });
  } catch (error) {
    console.error("Error submitting task:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all submissions for a trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const submissions = await TaskSubmission.findByTrainerId(trainerId);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error("Error fetching trainer submissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get submissions for a specific student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const submissions = await TaskSubmission.findByStudentId(studentId);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error("Error fetching student submissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get submissions by student and trainer
router.get("/student/:studentId/trainer/:trainerId", async (req, res) => {
  try {
    const { studentId, trainerId } = req.params;
    const { planId } = req.query;

    let submissions;
    if (planId) {
      // Get submissions for specific plan only (current training)
      submissions = await TaskSubmission.findByStudentTrainerAndPlan(studentId, trainerId, planId);
    } else {
      // Get all submissions
      submissions = await TaskSubmission.findByStudentAndTrainer(studentId, trainerId);
    }

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get submission statuses for all weeks in a plan
router.get("/student/:studentId/plan/:planId/statuses", async (req, res) => {
  try {
    const { studentId, planId } = req.params;

    // Get all weeks for this plan
    const weeksQuery = `
      SELECT id, week_number, title, tasks
      FROM Plan_Weeks
      WHERE plan_id = ?
      ORDER BY week_number ASC
    `;

    const weeks = await new Promise((resolve, reject) => {
      db.query(weeksQuery, [planId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get submission status for each week
    const weekStatuses = await Promise.all(
      weeks.map(async (week) => {
        const status = await TaskSubmission.getStatusByWeek(studentId, week.id);
        return {
          week_id: week.id,
          week_number: week.week_number,
          title: week.title,
          tasks: week.tasks,
          status: status ? status.status : null,
          trainer_comment: status ? status.trainer_comment : null
        };
      })
    );

    res.json({
      success: true,
      weekStatuses
    });
  } catch (error) {
    console.error("Error fetching week statuses:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get submission by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await TaskSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Review a submission (approve/reject with comment)
router.put("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trainer_comment } = req.body;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'"
      });
    }

    // Get submission details before updating
    const submission = await TaskSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Update submission
    await TaskSubmission.review(id, { status, trainer_comment });

    console.log(`✅ Submission ${id} reviewed with status: ${status}`);

    // Send notification to student
    try {
      // Get student user_id
      const studentQuery = `SELECT user_id FROM Students WHERE id = ?`;
      const studentResult = await new Promise((resolve, reject) => {
        db.query(studentQuery, [submission.student_id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (studentResult.length > 0) {
        const studentUserId = studentResult[0].user_id;

        const notificationMessage = status === 'approved' 
          ? `Your submission for "${submission.task_title}" has been approved! ${trainer_comment ? 'Comment: ' + trainer_comment : ''}`
          : `Your submission for "${submission.task_title}" needs revision. ${trainer_comment ? 'Comment: ' + trainer_comment : ''}`;

        await Notification.create({
          user_id: studentUserId,
          title: status === 'approved' ? 'Task Approved ✅' : 'Task Needs Revision 📝',
          message: notificationMessage,
          type: 'task_review'
        });

        console.log(`🔔 Review notification sent to student`);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: "Submission reviewed successfully"
    });
  } catch (error) {
    console.error("Error reviewing submission:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update a submission (resubmit)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_file, submission_text, submission_link } = req.body;

    // Check if submission exists
    const submission = await TaskSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    await TaskSubmission.update(id, {
      submission_file,
      submission_text,
      submission_link
    });

    res.json({
      success: true,
      message: "Submission updated successfully"
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete a submission
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await TaskSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    await TaskSubmission.delete(id);

    res.json({
      success: true,
      message: "Submission deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get pending submissions count for trainer
router.get("/trainer/:trainerId/pending-count", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const count = await TaskSubmission.getPendingCount(trainerId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching pending count:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get pending submissions count for a specific student with a trainer
router.get("/student/:studentId/trainer/:trainerId/pending-count", async (req, res) => {
  try {
    const { studentId, trainerId } = req.params;
    const count = await TaskSubmission.getPendingCountByStudent(studentId, trainerId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching student pending count:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
