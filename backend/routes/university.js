import express from "express";
import University from "../models/University.js";

const router = express.Router();

// Get all universities
router.get("/", async (req, res) => {
  try {
    const universities = await University.getAll();
    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch universities"
    });
  }
});

// Get university by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const university = await University.findById(id);
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error("Error fetching university:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university"
    });
  }
});

// Update university
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const universityData = req.body;
    
    // Check if university exists
    const existingUniversity = await University.findById(id);
    if (!existingUniversity) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    // Update university
    await University.update(id, universityData);
    
    // Get updated university
    const updatedUniversity = await University.findById(id);
    
    res.json({
      success: true,
      message: "University updated successfully",
      data: updatedUniversity
    });
  } catch (error) {
    console.error("Error updating university:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update university"
    });
  }
});

// Delete university
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if university exists
    const existingUniversity = await University.findById(id);
    if (!existingUniversity) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    await University.delete(id);
    
    res.json({
      success: true,
      message: "University deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting university:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete university"
    });
  }
});

// Search universities
router.get("/search/:term", async (req, res) => {
  try {
    const { term } = req.params;
    const universities = await University.search(term);
    
    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error("Error searching universities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search universities"
    });
  }
});

export default router;
