import express from "express";
import Student from "../models/Student.js";
import db from "../config/database.js";

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

// Get students by university with their internship information
router.get("/university/:universityId", async (req, res) => {
  try {
    const { universityId } = req.params;
    
    console.log(`📚 Getting students for university ${universityId}...`);
    
    // Get students with their internship matches and final reports
    const query = `
      SELECT 
        s.id as student_id,
        s.user_id,
        u.full_name,
        u.email,
        s.major,
        s.academic_year,
        s.gpa,
        s.skills,
        s.status as student_status,
        s.student_img,
        s.cv_file,
        im.id as match_id,
        im.status as match_status,
        im.applied_at,
        i.id as internship_id,
        i.title as internship_title,
        i.specialization as internship_specialization,
        i.status as internship_status,
        c.id as company_id,
        c.name as company_name,
        c.logo as company_logo,
        fr.id as final_report_id,
        fr.overall_performance,
        fr.technical_skills_rating,
        fr.communication_rating,
        fr.teamwork_rating,
        fr.problem_solving_rating,
        fr.attendance_rating,
        fr.overall_rating,
        fr.university_approved,
        fr.approved_at,
        fr.created_at as report_created_at,
        fr.certificate_file,
        fr.certificate_uploaded_at,
        t.id as trainer_id,
        ut.full_name as trainer_name
      FROM Students s
      INNER JOIN Users u ON s.user_id = u.id
      LEFT JOIN Internship_Matches im ON s.id = im.student_id
      LEFT JOIN Internships i ON im.internship_id = i.id
      LEFT JOIN Company c ON i.company_id = c.id
      LEFT JOIN Final_Reports fr ON s.id = fr.student_id AND (fr.internship_id = i.id OR fr.internship_id IS NULL)
      LEFT JOIN Trainers t ON fr.trainer_id = t.id
      LEFT JOIN Users ut ON t.user_id = ut.id
      WHERE s.university_id = ?
      ORDER BY s.created_at DESC, im.applied_at DESC
    `;
    
    db.query(query, [universityId], (err, results) => {
      if (err) {
        console.error("❌ Error fetching students:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      // Group results by student
      const studentsMap = new Map();
      
      results.forEach(row => {
        if (!studentsMap.has(row.student_id)) {
          studentsMap.set(row.student_id, {
            id: row.student_id,
            user_id: row.user_id,
            full_name: row.full_name,
            email: row.email,
            major: row.major,
            academic_year: row.academic_year,
            gpa: row.gpa,
            skills: row.skills,
            status: row.student_status,
            student_img: row.student_img,
            cv_file: row.cv_file,
            internships: [],
            final_report: null
          });
        }
        
        const student = studentsMap.get(row.student_id);
        
        // Add internship if exists
        if (row.internship_id) {
          // Check if this internship is already added
          const existingInternship = student.internships.find(i => i.internship_id === row.internship_id);
          if (!existingInternship) {
            student.internships.push({
              match_id: row.match_id,
              match_status: row.match_status,
              applied_at: row.applied_at,
              internship_id: row.internship_id,
              internship_title: row.internship_title,
              internship_specialization: row.internship_specialization,
              internship_status: row.internship_status,
              company_id: row.company_id,
              company_name: row.company_name,
              company_logo: row.company_logo
            });
          }
        }
        
        // Add final report if exists (take the most recent one)
        if (row.final_report_id && !student.final_report) {
          student.final_report = {
            id: row.final_report_id,
            overall_performance: row.overall_performance,
            technical_skills_rating: row.technical_skills_rating,
            communication_rating: row.communication_rating,
            teamwork_rating: row.teamwork_rating,
            problem_solving_rating: row.problem_solving_rating,
            attendance_rating: row.attendance_rating,
            overall_rating: row.overall_rating,
            university_approved: row.university_approved,
            approved_at: row.approved_at,
            created_at: row.report_created_at,
            trainer_id: row.trainer_id,
            trainer_name: row.trainer_name
          };
        }
      });
      
      const students = Array.from(studentsMap.values());
      
      console.log(`✅ Found ${students.length} students for university ${universityId}`);
      
      res.json({
        success: true,
        data: students
      });
    });
    
  } catch (error) {
    console.error("❌ Get students by university error:", error);
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

// Get trainers for student's accepted internships
router.get("/:userId/trainers", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`👥 Getting trainers for student user ${userId}...`);
    
    // First get student_id from user_id
    const studentQuery = `SELECT id FROM Students WHERE user_id = ?`;
    
    db.query(studentQuery, [userId], (err, studentResults) => {
      if (err) {
        console.error("❌ Error fetching student:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      if (studentResults.length === 0) {
        return res.json({
          success: true,
          trainers: []
        });
      }
      
      const studentId = studentResults[0].id;
      
      // Get trainers from accepted internships (grouped by trainer to avoid duplicates)
      const query = `
        SELECT 
          t.id,
          t.user_id,
          u.full_name,
          u.email,
          t.specialization,
          t.profile_image,
          MAX(i.id) as internship_id,
          MAX(i.title) as internship_title,
          MAX(c.name) as company_name
        FROM Internship_Matches im
        INNER JOIN Internships i ON im.internship_id = i.id
        INNER JOIN Internship_Trainers it ON i.id = it.internship_id
        INNER JOIN Trainers t ON it.trainer_id = t.id
        INNER JOIN Users u ON t.user_id = u.id
        INNER JOIN Company c ON i.company_id = c.id
        WHERE im.student_id = ? AND im.status = 'accepted'
        GROUP BY t.id, t.user_id, u.full_name, u.email, t.specialization, t.profile_image
        ORDER BY u.full_name ASC
      `;
      
      db.query(query, [studentId], (err, results) => {
        if (err) {
          console.error("❌ Error fetching trainers:", err);
          return res.status(500).json({
            success: false,
            message: "Server error"
          });
        }
        
        console.log(`✅ Found ${results.length} trainers for student ${userId}`);
        
        res.json({
          success: true,
          trainers: results
        });
      });
    });
    
  } catch (error) {
    console.error("❌ Get student trainers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get active students count for a company
router.get("/company/:companyId/active", async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const query = `
      SELECT COUNT(DISTINCT s.id) as count
      FROM Students s
      INNER JOIN Internship_Matches im ON s.id = im.student_id
      INNER JOIN Internships i ON im.internship_id = i.id
      WHERE i.company_id = ? 
      AND im.status = 'accepted'
      AND s.status IN ('in_training', 'completed')
    `;
    
    db.query(query, [companyId], (err, results) => {
      if (err) {
        console.error("Error fetching active students count:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      res.json({
        success: true,
        count: results[0].count
      });
    });
  } catch (error) {
    console.error("Get active students count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get student certificate
router.get("/:studentId/certificate", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const query = `
      SELECT 
        fr.id as report_id,
        fr.certificate_file,
        fr.certificate_uploaded_at,
        fr.overall_rating,
        i.title as internship_title,
        c.name as company_name
      FROM Final_Reports fr
      JOIN Internships i ON fr.internship_id = i.id
      JOIN Company c ON i.company_id = c.id
      WHERE fr.student_id = ? AND fr.certificate_file IS NOT NULL
      ORDER BY fr.certificate_uploaded_at DESC
      LIMIT 1
    `;
    
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error("❌ Error fetching certificate:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
      
      if (results.length === 0) {
        return res.json({
          success: true,
          certificate: null
        });
      }
      
      res.json({
        success: true,
        certificate: results[0]
      });
    });
  } catch (error) {
    console.error("❌ Get certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
