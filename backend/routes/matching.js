import express from "express";
import InternshipMatch from "../models/InternshipMatch.js";
import Student from "../models/Student.js";
import CV from "../models/CV.js";
import Internship from "../models/Internship.js";
import Notification from "../models/Notification.js";
import aiMatchingService from "../services/aiMatchingService.js";
import db from "../config/database.js";

const router = express.Router();

// Run AI matching for a student
router.post("/student/:userId/run", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🤖 Starting AI matching for user ${userId}...`);

    // 1. Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // 2. Get student's CV
    const cv = await CV.findByStudentId(student.id);
    if (!cv || !cv.analysis_data) {
      return res.status(404).json({
        success: false,
        message: "No CV or analysis data found for this student"
      });
    }

    // 3. Get available internships based on university partnerships
    let internships = [];
    if (student.university_id) {
      internships = await Internship.findByStudentUniversity(student.university_id);
    } else {
      // If no university, get all open internships
      internships = await Internship.findAll();
      internships = internships.filter(i => i.status === 'open');
    }

    if (internships.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No internships available for matching",
        matchCount: 0
      });
    }

    console.log(`📊 Found ${internships.length} internships to match against`);

    // 4. Parse CV analysis data to get GPA and work mode
    let cvData = cv.analysis_data;
    if (typeof cvData === 'string') {
      cvData = JSON.parse(cvData);
    }
    
    // استخراج GPA من CV analysis إذا موجود، وإلا استخدم من Student table
    const studentGPA = cvData.GPA ? parseFloat(cvData.GPA) : student.gpa;
    
    // استخراج work mode/status من CV analysis إذا موجود
    const studentWorkMode = cvData.work_mode || cvData.status || cvData.WorkMode || null;
    
    console.log(`📋 Student Info:`, {
      gpa: studentGPA,
      gpaSource: cvData.GPA ? 'CV Analysis' : 'Student Table',
      workMode: studentWorkMode,
      workModeSource: studentWorkMode ? 'CV Analysis' : 'Not Available'
    });

    // 5. Run AI matching for each internship
    const matches = [];
    for (const internship of internships) {
      console.log(`\n🔍 Matching with: ${internship.title} (${internship.company_name})`);
      console.log(`   Requirements: min_gpa=${internship.min_gpa}, work_mode=${internship.work_mode}`);
      
      const matchResult = aiMatchingService.calculateMatch(
        cv.analysis_data,
        internship.requirements,
        internship.specialization,
        internship.min_gpa,           // GPA المطلوب للتدريب
        internship.work_mode,         // نوع العمل (onsite/online/hybrid)
        studentGPA,                   // GPA من CV analysis أو Student table
        studentWorkMode               // Work mode من CV analysis
      );
      
      console.log(`   Match Result: ${matchResult.matchPercentage}%`);
      if (matchResult.gpaMessage) console.log(`   GPA: ${matchResult.gpaMessage}`);
      if (matchResult.workModeMessage) console.log(`   Work Mode: ${matchResult.workModeMessage}`);

      // Only save matches with percentage > 0
      if (matchResult.matchPercentage > 0) {
        await InternshipMatch.upsert({
          student_id: student.id,
          internship_id: internship.id,
          match_percentage: matchResult.matchPercentage,
          matched_skills: matchResult.matchedSkills,
          matched_categories: matchResult.matchedCategories,
          gpa_match: matchResult.gpaMatch,
          gpa_message: matchResult.gpaMessage,
          work_mode_match: matchResult.workModeMatch,
          work_mode_message: matchResult.workModeMessage
        });

        matches.push({
          internship_id: internship.id,
          internship_title: internship.title,
          company_name: internship.company_name,
          match_percentage: matchResult.matchPercentage,
          gpa_match: matchResult.gpaMatch,
          gpa_message: matchResult.gpaMessage,
          work_mode_match: matchResult.workModeMatch,
          work_mode_message: matchResult.workModeMessage
        });
      }
    }

    console.log(`✅ AI matching completed. Found ${matches.length} matches`);

    res.status(200).json({
      success: true,
      message: "AI matching completed successfully",
      matchCount: matches.length,
      matches: matches.sort((a, b) => b.match_percentage - a.match_percentage)
    });

  } catch (error) {
    console.error("AI matching error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during matching"
    });
  }
});

// Get matches for a student
router.get("/student/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { minMatch = 0 } = req.query;

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get matches
    const matches = await InternshipMatch.getByStudentId(student.id, minMatch);

    res.status(200).json({
      success: true,
      count: matches.length,
      matches: matches
    });

  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get top matches for a student
router.get("/student/:userId/top", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get top matches
    const matches = await InternshipMatch.getTopMatches(student.id, parseInt(limit));

    res.status(200).json({
      success: true,
      count: matches.length,
      matches: matches
    });

  } catch (error) {
    console.error("Get top matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get specific match details
router.get("/student/:userId/internship/:internshipId", async (req, res) => {
  try {
    const { userId, internshipId } = req.params;

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get match
    const match = await InternshipMatch.getByStudentAndInternship(
      student.id, 
      internshipId
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.status(200).json({
      success: true,
      match: match
    });

  } catch (error) {
    console.error("Get match details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Save internship for later
router.post("/student/:userId/save/:internshipId", async (req, res) => {
  try {
    const { userId, internshipId } = req.params;
    
    console.log(`💾 Saving internship ${internshipId} for user ${userId}...`);

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Update or create match with saved = true
    await InternshipMatch.saveInternship(student.id, internshipId);

    console.log(`✅ Internship ${internshipId} saved for student ${student.id}`);

    res.status(200).json({
      success: true,
      message: "Internship saved successfully"
    });

  } catch (error) {
    console.error("❌ Save internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Unsave internship
router.post("/student/:userId/unsave/:internshipId", async (req, res) => {
  try {
    const { userId, internshipId } = req.params;
    
    console.log(`🗑️ Unsaving internship ${internshipId} for user ${userId}...`);

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Update match with saved = false
    await InternshipMatch.unsaveInternship(student.id, internshipId);

    console.log(`✅ Internship ${internshipId} unsaved for student ${student.id}`);

    res.status(200).json({
      success: true,
      message: "Internship unsaved successfully"
    });

  } catch (error) {
    console.error("❌ Unsave internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get saved internships for student
router.get("/student/:userId/saved", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📚 Getting saved internships for user ${userId}...`);

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      console.log(`❌ Student not found for user ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    console.log(`✅ Found student: ${student.id}`);

    // Get saved internships
    const savedInternships = await InternshipMatch.getSavedInternships(student.id);

    console.log(`✅ Found ${savedInternships.length} saved internships for student ${student.id}`);

    res.status(200).json({
      success: true,
      data: savedInternships
    });

  } catch (error) {
    console.error("❌ Get saved internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Apply to internship
router.post("/student/:userId/apply/:internshipId", async (req, res) => {
  try {
    const { userId, internshipId } = req.params;
    
    console.log(`📝 Student ${userId} applying to internship ${internshipId}...`);

    // Find student
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Apply to internship
    await InternshipMatch.applyToInternship(student.id, internshipId);

    console.log(`✅ Student ${student.id} applied to internship ${internshipId}`);

    res.status(200).json({
      success: true,
      message: "Application submitted successfully"
    });

  } catch (error) {
    console.error("❌ Apply to internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get applicants for a specific internship
router.get("/internship/:internshipId/applicants", async (req, res) => {
  try {
    const { internshipId } = req.params;
    
    console.log(`📋 Getting applicants for internship ${internshipId}...`);

    const applicants = await InternshipMatch.getApplicantsByInternship(internshipId);

    console.log(`✅ Found ${applicants.length} applicants`);

    res.status(200).json({
      success: true,
      data: applicants
    });

  } catch (error) {
    console.error("❌ Get applicants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all applicants for a company
router.get("/company/:companyId/applicants", async (req, res) => {
  try {
    const { companyId } = req.params;
    
    console.log(`📋 Getting all applicants for company ${companyId}...`);

    const applicants = await InternshipMatch.getApplicantsByCompany(companyId);

    console.log(`✅ Found ${applicants.length} applicants`);

    res.status(200).json({
      success: true,
      data: applicants
    });

  } catch (error) {
    console.error("❌ Get company applicants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get accepted applicants for a company
router.get("/company/:companyId/accepted", async (req, res) => {
  try {
    const { companyId } = req.params;
    
    console.log(`✅ Getting accepted applicants for company ${companyId}...`);

    const acceptedApplicants = await InternshipMatch.getAcceptedApplicantsByCompany(companyId);

    console.log(`✅ Found ${acceptedApplicants.length} accepted applicants`);

    res.status(200).json({
      success: true,
      data: acceptedApplicants
    });

  } catch (error) {
    console.error("❌ Get accepted applicants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Accept applicant
router.post("/applicant/:matchId/accept", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log(`✅ Accepting applicant with match ID ${matchId}...`);

    // Get match details before updating
    const matchDetails = await InternshipMatch.getMatchDetailsById(matchId);
    
    if (!matchDetails) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check capacity before accepting
    const checkCapacityQuery = `
      SELECT i.capacity, i.title 
      FROM Internships i
      INNER JOIN Internship_Matches im ON i.id = im.internship_id
      WHERE im.id = ?
    `;
    
    db.query(checkCapacityQuery, [matchId], async (err, results) => {
      if (err) {
        console.error("❌ Error checking capacity:", err);
        return res.status(500).json({
          success: false,
          message: "Server error"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Internship not found"
        });
      }

      const internship = results[0];
      
      if (internship.capacity <= 0) {
        console.log(`⚠️ Cannot accept: ${internship.title} has no available capacity`);
        return res.status(400).json({
          success: false,
          message: "This internship has reached its maximum capacity"
        });
      }

      // Proceed with acceptance
      try {
        await InternshipMatch.updateStatus(matchId, 'accepted');

        console.log(`✅ Applicant ${matchId} accepted successfully`);
        console.log(`📉 ${internship.title} capacity: ${internship.capacity} → ${internship.capacity - 1}`);

        // Send notification to student
        try {
          await Notification.create({
            user_id: matchDetails.student_user_id,
            title: '🎉 Application Accepted!',
            message: `Congratulations! Your application for "${matchDetails.internship_title}" at ${matchDetails.company_name} has been accepted.`,
            type: 'application'
          });
          console.log(`📧 Notification sent to student (user_id: ${matchDetails.student_user_id})`);
        } catch (notifError) {
          console.error("⚠️  Failed to send notification:", notifError);
          // Don't fail the request if notification fails
        }

        res.status(200).json({
          success: true,
          message: "Applicant accepted successfully"
        });
      } catch (error) {
        console.error("❌ Accept applicant error:", error);
        res.status(500).json({
          success: false,
          message: "Server error"
        });
      }
    });

  } catch (error) {
    console.error("❌ Accept applicant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Reject applicant
router.post("/applicant/:matchId/reject", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log(`❌ Rejecting applicant with match ID ${matchId}...`);

    // Get match details before updating
    const matchDetails = await InternshipMatch.getMatchDetailsById(matchId);
    
    if (!matchDetails) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Update status to rejected
    await InternshipMatch.updateStatus(matchId, 'rejected');

    console.log(`❌ Applicant ${matchId} rejected`);

    // Send notification to student
    try {
      await Notification.create({
        user_id: matchDetails.student_user_id,
        title: 'Application Update',
        message: `Thank you for your interest in "${matchDetails.internship_title}" at ${matchDetails.company_name}. Unfortunately, your application was not selected at this time. Keep looking for other opportunities!`,
        type: 'application'
      });
      console.log(`📧 Notification sent to student (user_id: ${matchDetails.student_user_id})`);
    } catch (notifError) {
      console.error("⚠️  Failed to send notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Applicant rejected successfully"
    });

  } catch (error) {
    console.error("❌ Reject applicant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get applied students for a specific internship
router.get('/internship/:internshipId/applied', async (req, res) => {
  try {
    const { internshipId } = req.params;
    
    console.log(`📋 Getting applied students for internship ${internshipId}...`);
    
    const query = `
      SELECT 
        s.id as student_id,
        s.user_id,
        u.full_name,
        u.email,
        s.major,
        s.academic_year as year_of_study,
        s.student_img,
        s.gpa,
        uni.name as university_name,
        im.match_percentage,
        im.applied_at,
        im.status,
        (SELECT analysis_data FROM CVs WHERE student_id = s.id ORDER BY id DESC LIMIT 1) as analysis_data
      FROM Internship_Matches im
      INNER JOIN Students s ON im.student_id = s.id
      INNER JOIN Users u ON s.user_id = u.id
      LEFT JOIN Universities uni ON s.university_id = uni.id
      WHERE im.internship_id = ? AND im.applied = TRUE AND im.status = 'pending'
      ORDER BY im.applied_at DESC
    `;
    
    db.query(query, [internshipId], (err, results) => {
      if (err) {
        console.error('❌ Error fetching applied students:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      
      // Parse GPA from analysis_data if available
      const studentsWithGPA = results.map(student => {
        let gpa = student.gpa;
        
        if (!gpa && student.analysis_data) {
          try {
            const analysisData = typeof student.analysis_data === 'string'
              ? JSON.parse(student.analysis_data)
              : student.analysis_data;
            
            gpa = analysisData.gpa || 
                  analysisData.GPA || 
                  analysisData.grade_point_average ||
                  analysisData.overall_gpa ||
                  null;
          } catch (e) {
            console.warn('Failed to parse analysis_data:', e.message);
          }
        }
        
        return {
          ...student,
          gpa: gpa,
          analysis_data: undefined // Remove from response
        };
      });
      
      console.log(`✅ Found ${studentsWithGPA.length} applied students for internship ${internshipId}`);
      
      res.json({
        success: true,
        applicants: studentsWithGPA
      });
    });
    
  } catch (error) {
    console.error('❌ Get applied students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
