import express from "express";
import InternshipMatch from "../models/InternshipMatch.js";
import Student from "../models/Student.js";
import CV from "../models/CV.js";
import Internship from "../models/Internship.js";
import aiMatchingService from "../services/aiMatchingService.js";

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

    // 4. Run AI matching for each internship
    const matches = [];
    for (const internship of internships) {
      const matchResult = aiMatchingService.calculateMatch(
        cv.analysis_data,
        internship.requirements,
        internship.specialization,
        internship.min_gpa,           // GPA المطلوب للتدريب
        internship.work_mode,         // نوع العمل (onsite/online/hybrid)
        student.gpa,                  // GPA الطالب
        student.work_preference       // تفضيل الطالب للعمل
      );

      // Only save matches with percentage > 0
      if (matchResult.matchPercentage > 0) {
        await InternshipMatch.upsert({
          student_id: student.id,
          internship_id: internship.id,
          match_percentage: matchResult.matchPercentage,
          matched_skills: matchResult.matchedSkills,
          matched_categories: matchResult.matchedCategories
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

export default router;
