import express from "express";
import InternshipPlan from "../models/InternshipPlan.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Initialize tables
InternshipPlan.createTables().catch(err => {
  console.error('Error initializing plan tables:', err);
});

// Get all plans for a specific trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    const query = `
      SELECT ip.*, i.title as internship_title, i.description as internship_description
      FROM Internship_Plans ip
      LEFT JOIN Internships i ON ip.internship_id = i.id
      WHERE ip.trainer_id = ?
      ORDER BY ip.created_at DESC
    `;
    
    const plans = await new Promise((resolve, reject) => {
      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    res.json({
      success: true,
      plans: plans || []
    });
  } catch (error) {
    console.error('Error fetching trainer plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainer plans',
      error: error.message
    });
  }
});

// Create a new plan
router.post("/", async (req, res) => {
  try {
    const { 
      internship_id, 
      trainer_id, 
      title, 
      description, 
      duration_weeks,
      start_date,
      end_date,
      status,
      weeks 
    } = req.body;

    // Validate required fields
    if (!internship_id || !trainer_id || !title || !duration_weeks) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: internship_id, trainer_id, title, duration_weeks"
      });
    }

    // Create the plan
    const result = await InternshipPlan.create({
      internship_id,
      trainer_id,
      title,
      description,
      duration_weeks,
      start_date,
      end_date,
      status
    });

    const planId = result.insertId;

    // Add weeks if provided
    console.log(`🔍 Received weeks data:`, weeks);
    console.log(`🔍 Is array?`, Array.isArray(weeks));
    console.log(`🔍 Length:`, weeks?.length);
    
    if (weeks && Array.isArray(weeks) && weeks.length > 0) {
      console.log(`📅 Adding ${weeks.length} weeks to plan...`);
      for (const week of weeks) {
        console.log(`  Week ${week.week_number}: due_date = ${week.due_date || 'null'}`);
        await InternshipPlan.addWeek({
          plan_id: planId,
          week_number: week.week_number,
          title: week.title,
          description: week.description,
          objectives: week.objectives,
          tasks: week.tasks,
          task_description: week.task_description,
          resources: week.resources,
          deliverables: week.deliverables,
          due_date: week.due_date || null
        });
      }
    }

    // Send notifications to students who applied to this internship
    try {
      console.log(`🔔 Sending training plan notifications for internship ${internship_id}...`);
      
      // Get all students who applied to this internship
      const studentsQuery = `
        SELECT DISTINCT u.id as user_id, u.full_name, u.email
        FROM internship_matches im
        JOIN Students s ON im.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        WHERE im.internship_id = ? AND im.applied = TRUE
      `;
      
      const students = await new Promise((resolve, reject) => {
        db.query(studentsQuery, [internship_id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      console.log(`📊 Found ${students.length} students to notify`);

      if (students.length > 0) {
        // Create notifications for all students
        const notifications = students.map(student => ({
          user_id: student.user_id,
          title: 'New Training Plan Published',
          message: `A new training plan has been published: ${title}`,
          type: 'training_plan'
        }));

        await Notification.createBulk(notifications);
        console.log(`✅ Sent ${notifications.length} training plan notifications`);
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      planId
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get plan by ID with weeks
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await InternshipPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all plans by trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const plans = await InternshipPlan.findByTrainerId(trainerId);

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("Error fetching trainer plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get plans by internship
router.get("/internship/:internshipId", async (req, res) => {
  try {
    const { internshipId } = req.params;
    const plans = await InternshipPlan.findByInternshipId(internshipId);

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("Error fetching internship plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update plan
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      duration_weeks,
      start_date,
      end_date,
      status
    } = req.body;

    // Check if plan exists
    const existingPlan = await InternshipPlan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    await InternshipPlan.update(id, {
      title,
      description,
      duration_weeks,
      start_date,
      end_date,
      status
    });

    res.json({
      success: true,
      message: "Plan updated successfully"
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete plan
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingPlan = await InternshipPlan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    await InternshipPlan.delete(id);

    res.json({
      success: true,
      message: "Plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Add week to plan
router.post("/:planId/weeks", async (req, res) => {
  try {
    const { planId } = req.params;
    const { 
      week_number, 
      title, 
      description, 
      objectives,
      tasks,
      task_description,
      resources,
      deliverables,
      due_date
    } = req.body;

    // Validate required fields
    if (!week_number || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: week_number, title"
      });
    }

    // Check if plan exists
    const existingPlan = await InternshipPlan.findById(planId);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const result = await InternshipPlan.addWeek({
      plan_id: planId,
      week_number,
      title,
      description,
      objectives,
      tasks,
      task_description,
      resources,
      deliverables,
      due_date
    });

    res.status(201).json({
      success: true,
      message: "Week added successfully",
      weekId: result.insertId
    });
  } catch (error) {
    console.error("Error adding week:", error);
    
    // Check for duplicate week number
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "Week number already exists for this plan"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update week
router.put("/weeks/:weekId", async (req, res) => {
  try {
    const { weekId } = req.params;
    const { 
      title, 
      description, 
      objectives,
      tasks,
      task_description,
      resources,
      deliverables,
      due_date
    } = req.body;

    console.log(`📝 Updating week ${weekId} with due_date: ${due_date}`);

    await InternshipPlan.updateWeek(weekId, {
      title,
      description,
      objectives,
      tasks,
      task_description,
      resources,
      deliverables,
      due_date
    });

    res.json({
      success: true,
      message: "Week updated successfully"
    });
  } catch (error) {
    console.error("Error updating week:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete week
router.delete("/weeks/:weekId", async (req, res) => {
  try {
    const { weekId } = req.params;

    await InternshipPlan.deleteWeek(weekId);

    res.json({
      success: true,
      message: "Week deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting week:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get weeks for a plan
router.get("/:planId/weeks", async (req, res) => {
  try {
    const { planId } = req.params;
    const weeks = await InternshipPlan.getWeeks(planId);

    res.json({
      success: true,
      weeks
    });
  } catch (error) {
    console.error("Error fetching weeks:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get plans for a student based on their internship applications
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`📋 Getting training plans for student ${studentId}...`);
    
    // Get all plans for internships the student has been accepted to
    const query = `
      SELECT DISTINCT
        ip.*,
        i.title as internship_title,
        c.name as company_name,
        c.logo as company_logo,
        t.specialization as trainer_specialization,
        u.full_name as trainer_name
      FROM Internship_Plans ip
      JOIN Internships i ON ip.internship_id = i.id
      JOIN Company c ON i.company_id = c.id
      JOIN Trainers t ON ip.trainer_id = t.id
      JOIN Users u ON t.user_id = u.id
      JOIN Internship_Matches im ON i.id = im.internship_id
      WHERE im.student_id = ? AND im.status = 'accepted'
      ORDER BY ip.created_at DESC
    `;
    
    db.query(query, [studentId], async (err, results) => {
      if (err) {
        console.error("❌ Error fetching student plans:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      // Get weeks for each plan
      const plansWithWeeks = await Promise.all(
        results.map(async (plan) => {
          const weeks = await InternshipPlan.getWeeks(plan.id);
          return {
            ...plan,
            weeks
          };
        })
      );
      
      console.log(`✅ Found ${plansWithWeeks.length} training plans for student ${studentId}`);
      
      res.json({
        success: true,
        plans: plansWithWeeks
      });
    });
    
  } catch (error) {
    console.error("❌ Get student plans error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
