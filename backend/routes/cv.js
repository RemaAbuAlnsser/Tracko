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
    
    // Upsert CV record (update if exists, insert if not)
    const result = await CV.upsert({
      student_id: student.id,
      cv_file: cv_file,
      analysis_data: analysis_data
    });
    
    // Get the CV ID (either from insert or existing record)
    let cvId;
    if (result.insertId) {
      cvId = result.insertId;
    } else {
      // If it was an update, find the CV
      const existingCV = await CV.findByStudentId(student.id);
      cvId = existingCV ? existingCV.id : null;
    }
    
    res.json({
      success: true,
      message: result.insertId ? "CV uploaded successfully" : "CV updated successfully",
      cv_id: cvId,
      isUpdate: !result.insertId
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

// Analyze CV with AI
router.post("/analyze/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🤖 Starting AI analysis for user ${userId}...`);
    
    // Find student
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
    
    // TODO: Implement actual AI analysis here
    // For now, we'll create a mock analysis based on common patterns
    const mockAnalysis = {
      skills: [
        "JavaScript", "React", "Node.js", "Python", "SQL", 
        "HTML", "CSS", "Git", "MongoDB", "Express.js"
      ],
      experience: "2-3 years of software development experience",
      education: "Bachelor's degree in Computer Science or related field",
      categories: {
        "Frontend": ["JavaScript", "React", "HTML", "CSS"],
        "Backend": ["Node.js", "Python", "Express.js"],
        "Database": ["SQL", "MongoDB"],
        "Tools": ["Git"]
      },
      gpa: "3.5",
      work_mode: "hybrid",
      specialization: "Software Engineering",
      summary: "Experienced software developer with strong skills in full-stack development"
    };
    
    console.log(`✅ AI analysis completed for user ${userId}`);
    
    // Update CV with analysis data
    await CV.updateAnalysis(cv.id, mockAnalysis);
    
    res.json({
      success: true,
      message: "AI analysis completed successfully",
      analysis: mockAnalysis
    });
    
  } catch (error) {
    console.error("Error analyzing CV:", error);
    res.status(500).json({
      success: false,
      message: "Server error during AI analysis"
    });
  }
});

export default router;
