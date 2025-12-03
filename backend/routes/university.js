import express from "express";
import University from "../models/University.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import RegistrationRequest from "../models/RegistrationRequest.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

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

// Get university by email
router.get("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("🎓 Fetching university by email:", email);
    
    const query = "SELECT * FROM Universities WHERE email = ?";
    const university = await new Promise((resolve, reject) => {
      db.query(query, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    console.log("🎓 University found:", university ? university.name : "Not found");
    
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

// Update university by email
router.put("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const universityData = req.body;
    
    // Find university by email
    const existingUniversity = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Universities WHERE email = ?", [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    if (!existingUniversity) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const oldEmail = existingUniversity.email;
    const newEmail = universityData.email;
    const newName = universityData.name;
    
    // Update university
    await University.update(existingUniversity.id, universityData);
    
    // Update Users table if email or name changed
    if (oldEmail && (newEmail !== oldEmail || newName !== existingUniversity.name)) {
      const updateUserQuery = `
        UPDATE Users 
        SET email = ?, full_name = ?
        WHERE email = ? AND user_type = 'university'
      `;
      
      await new Promise((resolve, reject) => {
        db.query(updateUserQuery, [newEmail, newName, oldEmail], (err, result) => {
          if (err) {
            console.error('Error updating Users table:', err);
            reject(err);
          } else {
            console.log(`✅ Updated Users table for university: ${oldEmail} -> ${newEmail}`);
            resolve(result);
          }
        });
      });
    }
    
    // Get updated university
    const updatedUniversity = await University.findById(existingUniversity.id);
    
    res.json({
      success: true,
      message: "University updated successfully",
      data: updatedUniversity,
      newEmail: newEmail !== oldEmail ? newEmail : null
    });
  } catch (error) {
    console.error("Error updating university:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update university"
    });
  }
});

// Update university by ID
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
    
    const oldEmail = existingUniversity.email;
    const newEmail = universityData.email;
    const newName = universityData.name;
    
    // Update university
    await University.update(id, universityData);
    
    // Update Users table if email or name changed
    if (oldEmail && (newEmail !== oldEmail || newName !== existingUniversity.name)) {
      const updateUserQuery = `
        UPDATE Users 
        SET email = ?, full_name = ?
        WHERE email = ? AND user_type = 'university'
      `;
      
      await new Promise((resolve, reject) => {
        db.query(updateUserQuery, [newEmail, newName, oldEmail], (err, result) => {
          if (err) {
            console.error('Error updating Users table:', err);
            reject(err);
          } else {
            console.log(`✅ Updated Users table for university: ${oldEmail} -> ${newEmail}`);
            resolve(result);
          }
        });
      });
    }
    
    // Get updated university
    const updatedUniversity = await University.findById(id);
    
    res.json({
      success: true,
      message: "University updated successfully",
      data: updatedUniversity,
      newEmail: newEmail !== oldEmail ? newEmail : null
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

// Get university statistics
router.get("/:id/statistics", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if university exists
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    // Get students count
    const studentsCountQuery = `
      SELECT COUNT(*) as count 
      FROM Students 
      WHERE university_id = ?
    `;
    
    const studentsCount = await new Promise((resolve, reject) => {
      db.query(studentsCountQuery, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
    
    // Get active partnerships count
    const activePartnershipsQuery = `
      SELECT COUNT(*) as count 
      FROM University_Company_Partnerships 
      WHERE university_id = ? AND status = 'active'
    `;
    
    const activePartnershipsCount = await new Promise((resolve, reject) => {
      db.query(activePartnershipsQuery, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
    
    // Get total internships count (all internships from all companies)
    const internshipsCountQuery = `
      SELECT COUNT(*) as count 
      FROM Internships
    `;
    
    const internshipsCount = await new Promise((resolve, reject) => {
      db.query(internshipsCountQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
    
    res.json({
      success: true,
      data: {
        studentsCount,
        activePartnershipsCount,
        internshipsCount
      }
    });
  } catch (error) {
    console.error("Error fetching university statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university statistics"
    });
  }
});

// Get pending student registration requests for a university
router.get("/:universityId/registration-requests", async (req, res) => {
  try {
    const { universityId } = req.params;
    
    // Get university to find its domain
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    // Get pending student registration requests for this university's domain
    const query = `
      SELECT * FROM Registration_Requests 
      WHERE user_type = 'student' 
      AND status = 'pending'
      AND email LIKE ?
      ORDER BY created_at DESC
    `;
    
    const requests = await new Promise((resolve, reject) => {
      db.query(query, [`%@${university.domain}`], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("Error fetching registration requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration requests"
    });
  }
});

// Approve student registration request by university
router.post("/registration-requests/:requestId/approve", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { universityId } = req.body;
    
    // Get the request details
    const request = await RegistrationRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Registration request not found"
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }
    
    if (request.user_type !== 'student') {
      return res.status(400).json({
        success: false,
        message: "Only student requests can be approved by universities"
      });
    }
    
    // Verify university domain matches student email
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const studentDomain = request.email.split('@')[1];
    if (university.domain !== studentDomain) {
      return res.status(403).json({
        success: false,
        message: "You can only approve students from your university domain"
      });
    }
    
    // Create user in Users table
    const userResult = await User.create({
      full_name: request.full_name,
      email: request.email,
      password: request.password,
      user_type: request.user_type
    });
    
    const userId = userResult.insertId;
    
    // Create student record with university_id
    await Student.create({
      user_id: userId,
      university_id: universityId,
      status: 'not_started'
    });
    
    // Update request status to approved
    await RegistrationRequest.updateStatus(requestId, 'approved');
    
    // Send notification to student
    await Notification.create({
      user_id: userId,
      title: "Registration Approved",
      message: `Your registration has been approved by ${university.name}. You can now login to the system.`,
      type: "registration_approved"
    });
    
    console.log(`✅ Student registration approved by university ${universityId}: ${request.email}`);
    
    res.json({
      success: true,
      message: "Student registration approved successfully",
      userId
    });
    
  } catch (error) {
    console.error("Error approving registration request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve registration request"
    });
  }
});

// Reject student registration request by university
router.post("/registration-requests/:requestId/reject", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { universityId } = req.body;
    
    // Get the request details
    const request = await RegistrationRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Registration request not found"
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }
    
    if (request.user_type !== 'student') {
      return res.status(400).json({
        success: false,
        message: "Only student requests can be rejected by universities"
      });
    }
    
    // Verify university domain matches student email
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const studentDomain = request.email.split('@')[1];
    if (university.domain !== studentDomain) {
      return res.status(403).json({
        success: false,
        message: "You can only reject students from your university domain"
      });
    }
    
    // Update request status to rejected
    await RegistrationRequest.updateStatus(requestId, 'rejected');
    
    console.log(`❌ Student registration rejected by university ${universityId}: ${request.email}`);
    
    res.json({
      success: true,
      message: "Student registration rejected successfully"
    });
    
  } catch (error) {
    console.error("Error rejecting registration request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject registration request"
    });
  }
});

export default router;
