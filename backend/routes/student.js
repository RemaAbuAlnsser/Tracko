import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

// Get student by user_id
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const student = await Student.findByUserId(userId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get student by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.findAll();
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update student profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📝 Updating student ID:", id);
    console.log("📦 Request body:", req.body);
    
    const {
      university_id,
      major,
      academic_year,
      gpa,
      cv_file,
      student_img,
      skills,
      status
    } = req.body;
    
    // Check if student exists
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      console.log("❌ Student not found");
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    console.log("✅ Existing student found:", existingStudent.id);
    
    // Update student - handle empty strings and convert to null for numeric fields
    const updateData = {
      university_id: university_id !== undefined ? (university_id === '' || university_id === null ? null : university_id) : existingStudent.university_id,
      major: major !== undefined ? (major === '' ? null : major) : existingStudent.major,
      academic_year: academic_year !== undefined ? (academic_year === '' ? null : academic_year) : existingStudent.academic_year,
      gpa: gpa !== undefined ? (gpa === '' || gpa === null ? null : gpa) : existingStudent.gpa,
      cv_file: cv_file !== undefined ? (cv_file === '' ? null : cv_file) : existingStudent.cv_file,
      student_img: student_img !== undefined ? (student_img === '' ? null : student_img) : existingStudent.student_img,
      skills: skills !== undefined ? (skills === '' ? null : skills) : existingStudent.skills,
      status: status !== undefined ? status : existingStudent.status
    };
    
    console.log("📤 Update data:", updateData);
    
    await Student.update(id, updateData);
    
    console.log("✅ Student updated successfully");
    
    res.json({
      success: true,
      message: "Student profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    await Student.delete(id);
    
    res.json({
      success: true,
      message: "Student deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
