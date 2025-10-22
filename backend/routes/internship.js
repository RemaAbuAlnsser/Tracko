import express from "express";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";
import Student from "../models/Student.js";
import CV from "../models/CV.js";
import Notification from "../models/Notification.js";
import aiMatchingService from "../services/aiMatchingService.js";
import db from "../config/database.js";

const router = express.Router();

// Create new internship
router.post("/", async (req, res) => {
  try {
    const { company_email, title, description, requirements, specialization, capacity, status, trainer_ids, min_gpa, work_mode } = req.body;

    // Validate required fields
    if (!company_email || !title) {
      return res.status(400).json({
        success: false,
        message: "Company email and title are required"
      });
    }

    // Find company by email
    const company = await Company.findByEmail(company_email);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Create internship
    const result = await Internship.create({
      company_id: company.id,
      title,
      description,
      requirements,
      specialization,
      capacity: capacity || 1,
      status: status || 'open',
      min_gpa: min_gpa || null,
      work_mode: work_mode || null
    });

    const internshipId = result.insertId;
    console.log("✅ Internship created:", internshipId);

    // Assign trainers if provided
    if (trainer_ids && Array.isArray(trainer_ids) && trainer_ids.length > 0) {
      const values = trainer_ids.map(trainerId => [internshipId, trainerId]);
      const insertQuery = 'INSERT INTO Internship_Trainers (internship_id, trainer_id) VALUES ?';
      
      await new Promise((resolve, reject) => {
        db.query(insertQuery, [values], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      console.log(`✅ Assigned ${trainer_ids.length} trainer(s) to internship ${internshipId}`);
    }

    // Send notifications to matching students (async, don't wait for it)
    notifyMatchingStudents(internshipId, {
      company_id: company.id,
      company_name: company.name,
      title,
      description,
      requirements,
      specialization,
      min_gpa,
      work_mode
    }).catch(err => {
      console.error('⚠️  Error sending notifications:', err);
    });

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      internshipId
    });

  } catch (error) {
    console.error("Create internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all internships
router.get("/", async (req, res) => {
  try {
    const internships = await Internship.findAll();

    res.status(200).json({
      success: true,
      internships
    });

  } catch (error) {
    console.error("Get internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get internships by company email
router.get("/by-company/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Find company by email
    const company = await Company.findByEmail(email);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const internships = await Internship.findByCompanyId(company.id);

    // Get trainers for each internship
    const internshipsWithTrainers = await Promise.all(
      internships.map(async (internship) => {
        const trainersQuery = `
          SELECT t.id, t.user_id, u.full_name, t.specialization
          FROM Internship_Trainers it
          JOIN Trainers t ON it.trainer_id = t.id
          JOIN Users u ON t.user_id = u.id
          WHERE it.internship_id = ?
        `;
        
        const trainers = await new Promise((resolve, reject) => {
          db.query(trainersQuery, [internship.id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        return {
          ...internship,
          trainers
        };
      })
    );

    res.status(200).json({
      success: true,
      internships: internshipsWithTrainers
    });

  } catch (error) {
    console.error("Get company internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update internship
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, specialization, capacity, status, trainer_ids, min_gpa, work_mode } = req.body;

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    // Update internship
    await Internship.update(id, {
      title: title || existingInternship.title,
      description: description || existingInternship.description,
      requirements: requirements || existingInternship.requirements,
      specialization: specialization || existingInternship.specialization,
      capacity: capacity || existingInternship.capacity,
      status: status || existingInternship.status,
      min_gpa: min_gpa !== undefined ? min_gpa : existingInternship.min_gpa,
      work_mode: work_mode !== undefined ? work_mode : existingInternship.work_mode
    });

    // Update trainer assignments if provided
    if (trainer_ids !== undefined) {
      // First, delete existing trainer assignments
      const deleteQuery = 'DELETE FROM Internship_Trainers WHERE internship_id = ?';
      await new Promise((resolve, reject) => {
        db.query(deleteQuery, [id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Then, insert new trainer assignments
      if (Array.isArray(trainer_ids) && trainer_ids.length > 0) {
        const values = trainer_ids.map(trainerId => [id, trainerId]);
        const insertQuery = 'INSERT INTO Internship_Trainers (internship_id, trainer_id) VALUES ?';
        
        await new Promise((resolve, reject) => {
          db.query(insertQuery, [values], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        console.log(`✅ Updated trainer assignments: ${trainer_ids.length} trainer(s) for internship ${id}`);
      }
    }

    console.log("✅ Internship updated:", id);

    res.status(200).json({
      success: true,
      message: "Internship updated successfully"
    });

  } catch (error) {
    console.error("Update internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete internship
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    await Internship.delete(id);

    console.log("✅ Internship deleted:", id);

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });

  } catch (error) {
    console.error("Delete internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update internship status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'closed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'open', 'closed', or 'pending'"
      });
    }

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    await Internship.updateStatus(id, status);

    console.log("✅ Internship status updated:", id, "->", status);

    res.status(200).json({
      success: true,
      message: "Internship status updated successfully"
    });

  } catch (error) {
    console.error("Update internship status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all internships for university (all available internships)
router.get("/by-university/:universityId", async (req, res) => {
  try {
    const { universityId } = req.params;
    
    // Get all internships from all companies
    const query = `
      SELECT 
        i.*,
        c.name as company_name,
        c.logo as company_logo,
        c.industry as company_industry,
        c.email as company_email
      FROM Internships i
      INNER JOIN Company c ON i.company_id = c.id
      ORDER BY i.created_at DESC
    `;
    
    const internships = await new Promise((resolve, reject) => {
      db.query(query, async (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Get trainers for each internship
          const internshipsWithTrainers = await Promise.all(
            results.map(async (internship) => {
              const trainersQuery = `
                SELECT t.id, u.full_name, t.specialization, u.email
                FROM Trainers t
                INNER JOIN Internship_Trainers it ON t.id = it.trainer_id
                INNER JOIN Users u ON t.user_id = u.id
                WHERE it.internship_id = ?
              `;
              
              const trainers = await new Promise((resolve, reject) => {
                db.query(trainersQuery, [internship.id], (err, trainerResults) => {
                  if (err) reject(err);
                  else resolve(trainerResults);
                });
              });
              
              return {
                ...internship,
                trainers
              };
            })
          );
          
          resolve(internshipsWithTrainers);
        }
      });
    });
    
    console.log(`✅ Found ${internships.length} internships`);
    
    res.status(200).json({
      success: true,
      count: internships.length,
      data: internships
    });
    
  } catch (error) {
    console.error("Get university internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get internships for student based on university partnerships
router.get("/by-student/:userId", async (req, res) => {
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

    // Check if student has university_id
    if (!student.university_id) {
      return res.status(200).json({
        success: true,
        message: "Student has no university assigned",
        internships: []
      });
    }

    // Get internships based on university partnerships
    const internships = await Internship.findByStudentUniversity(student.university_id);

    res.status(200).json({
      success: true,
      count: internships.length,
      internships: internships
    });

  } catch (error) {
    console.error("Get student internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get internship by ID (must be last to avoid conflicts with other routes)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching internship with ID: ${id}`);
    
    const internship = await Internship.findById(id);
    console.log(`📦 Internship data:`, internship);

    if (!internship) {
      console.log(`❌ Internship ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    console.log(`✅ Returning internship ${id}:`, internship.title);
    res.status(200).json({
      success: true,
      internship
    });

  } catch (error) {
    console.error("❌ Get internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Helper function: Notify matching students about new internship
async function notifyMatchingStudents(internshipId, internshipData) {
  try {
    console.log(`\n🔔 Starting notification process for internship ${internshipId}...`);
    
    // Get all students with CVs
    const students = await Student.findAll();
    console.log(`📊 Found ${students.length} students to check`);
    
    let notificationsSent = 0;
    
    for (const student of students) {
      try {
        // Get student's CV
        const cv = await CV.findByStudentId(student.id);
        if (!cv || !cv.analysis_data) {
          continue; // Skip students without CV or analysis
        }
        
        // Parse CV data
        let cvData = cv.analysis_data;
        if (typeof cvData === 'string') {
          cvData = JSON.parse(cvData);
        }
        
        // Get student GPA and work mode preference
        const studentGPA = cvData.GPA ? parseFloat(cvData.GPA) : student.gpa;
        const studentWorkMode = cvData.work_mode || cvData.status || cvData.WorkMode || null;
        
        // Calculate match percentage
        const matchResult = aiMatchingService.calculateMatch(
          cv.analysis_data,
          internshipData.requirements,
          internshipData.specialization,
          internshipData.min_gpa,
          internshipData.work_mode,
          studentGPA,
          studentWorkMode
        );
        
        // Send notification if match is above 50%
        if (matchResult.matchPercentage > 50) {
          await Notification.create({
            user_id: student.user_id,
            title: '🎯 New Matching Internship!',
            message: `A new internship "${internshipData.title}" at ${internshipData.company_name} matches your profile with ${matchResult.matchPercentage}% compatibility!`,
            type: 'general'
          });
          
          notificationsSent++;
          console.log(`✅ Notification sent to ${student.full_name} (${matchResult.matchPercentage}% match)`);
        }
        
      } catch (studentError) {
        console.error(`⚠️  Error processing student ${student.id}:`, studentError.message);
        // Continue with next student
      }
    }
    
    console.log(`\n✅ Notification process completed: ${notificationsSent} notifications sent\n`);
    
  } catch (error) {
    console.error('❌ Error in notifyMatchingStudents:', error);
    throw error;
  }
}

export default router;
