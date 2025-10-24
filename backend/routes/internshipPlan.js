import express from "express";
import InternshipPlan from "../models/InternshipPlan.js";

const router = express.Router();

// Initialize tables
InternshipPlan.createTables().catch(err => {
  console.error('Error initializing plan tables:', err);
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
    if (weeks && Array.isArray(weeks) && weeks.length > 0) {
      for (const week of weeks) {
        await InternshipPlan.addWeek({
          plan_id: planId,
          week_number: week.week_number,
          title: week.title,
          description: week.description,
          objectives: week.objectives,
          tasks: week.tasks,
          resources: week.resources,
          deliverables: week.deliverables
        });
      }
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
      resources,
      deliverables
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
      resources,
      deliverables
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
      resources,
      deliverables
    } = req.body;

    await InternshipPlan.updateWeek(weekId, {
      title,
      description,
      objectives,
      tasks,
      resources,
      deliverables
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

export default router;
