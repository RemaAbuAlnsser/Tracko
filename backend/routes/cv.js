import express from "express";
import CV from "../models/CV.js";
import Student from "../models/Student.js";

const router = express.Router();

// Get CV by student user ID
router.get("/student/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find student by user_id
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    // Get latest CV
    const cv = await CV.findByStudentId(student.id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "No CV found for this student"
      });
    }
    
    res.json({
      success: true,
      cv: cv
    });
  } catch (error) {
    console.error("Error fetching CV:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get CV by student ID directly
router.get("/student-id/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get latest CV
    const cv = await CV.findByStudentId(studentId);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: "No CV found for this student"
      });
    }
    
    res.json({
      success: true,
      cv: cv
    });
  } catch (error) {
    console.error("Error fetching CV:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all CVs for a student
router.get("/student/:userId/all", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    const cvs = await CV.getAllByStudentId(student.id);
    
    res.json({
      success: true,
      cvs: cvs
    });
  } catch (error) {
    console.error("Error fetching CVs:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Create new CV record
router.post("/", async (req, res) => {
  try {
    const { user_id, cv_file, analysis_data } = req.body;
    
    if (!user_id || !cv_file) {
      return res.status(400).json({
        success: false,
        message: "user_id and cv_file are required"
      });
    }
    
    // Find student by user_id
    const student = await Student.findByUserId(user_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    // Check if CV already exists for this student with the same file
    const existingCV = await CV.findByStudentIdAndFile(student.id, cv_file);
    if (existingCV) {
      return res.status(200).json({
        success: true,
        message: "CV already exists in database",
        cv_id: existingCV.id,
        isDuplicate: true
      });
    }
    
    // Create CV record
    const result = await CV.create({
      student_id: student.id,
      cv_file: cv_file,
      analysis_data: analysis_data
    });
    
    res.json({
      success: true,
      message: "CV record created successfully",
      cv_id: result.insertId,
      isDuplicate: false
    });
  } catch (error) {
    console.error("Error creating CV record:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update CV analysis
router.put("/:id/analysis", async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis_data } = req.body;
    
    if (!analysis_data) {
      return res.status(400).json({
        success: false,
        message: "analysis_data is required"
      });
    }
    
    await CV.updateAnalysis(id, analysis_data);
    
    res.json({
      success: true,
      message: "CV analysis updated successfully"
    });
  } catch (error) {
    console.error("Error updating CV analysis:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete CV
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await CV.delete(id);
    
    res.json({
      success: true,
      message: "CV deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting CV:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
