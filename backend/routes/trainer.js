import express from "express";
import Trainer from "../models/Trainer.js";

const router = express.Router();

// Get trainer by user_id
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const trainer = await Trainer.findByUserId(userId);
    
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }
    
    res.json({
      success: true,
      trainer
    });
  } catch (error) {
    console.error("Error fetching trainer:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get trainer by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = await Trainer.findById(id);
    
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }
    
    res.json({
      success: true,
      trainer
    });
  } catch (error) {
    console.error("Error fetching trainer:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all trainers by company
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const trainers = await Trainer.findByCompanyId(companyId);
    
    res.json({
      success: true,
      trainers
    });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all trainers
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filters = status ? { status } : {};
    const trainers = await Trainer.getAll(filters);
    
    res.json({
      success: true,
      trainers
    });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update trainer profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      specialization,
      experience_years,
      bio,
      linkedin_url,
      github_url,
      hourly_rate,
      max_trainees,
      status,
      profile_image
    } = req.body;
    
    // Check if trainer exists
    const existingTrainer = await Trainer.findById(id);
    if (!existingTrainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }
    
    // Update trainer with all fields (use existing values if not provided)
    await Trainer.update(id, {
      specialization: specialization !== undefined ? specialization : existingTrainer.specialization,
      experience_years: experience_years !== undefined ? experience_years : existingTrainer.experience_years,
      bio: bio !== undefined ? bio : existingTrainer.bio,
      linkedin_url: linkedin_url !== undefined ? linkedin_url : existingTrainer.linkedin_url,
      github_url: github_url !== undefined ? github_url : existingTrainer.github_url,
      hourly_rate: hourly_rate !== undefined ? hourly_rate : existingTrainer.hourly_rate,
      max_trainees: max_trainees !== undefined ? max_trainees : existingTrainer.max_trainees,
      status: status !== undefined ? status : existingTrainer.status,
      profile_image: profile_image !== undefined ? profile_image : existingTrainer.profile_image
    });
    
    res.json({
      success: true,
      message: "Trainer profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update trainer status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active', 'inactive', or 'pending'"
      });
    }
    
    await Trainer.updateStatus(id, status);
    
    res.json({
      success: true,
      message: "Trainer status updated successfully"
    });
  } catch (error) {
    console.error("Error updating trainer status:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete trainer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingTrainer = await Trainer.findById(id);
    if (!existingTrainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }
    
    await Trainer.delete(id);
    
    res.json({
      success: true,
      message: "Trainer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
