import express from "express";
import User from "../models/User.js";
import Company from "../models/Company.js";
import University from "../models/University.js";
import Student from "../models/Student.js";
import Trainer from "../models/Trainer.js";
import Internship from "../models/Internship.js";
import Partnership from "../models/Partnership.js";
import Notification from "../models/Notification.js";
import RegistrationRequest from "../models/RegistrationRequest.js";
import db from "../config/database.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    // Get userId from body (for POST) or query params (for GET/PUT)
    const userId = req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user || user.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Get all users
router.post("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ 
      success: true,
      users 
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all companies
router.post("/companies", isAdmin, async (req, res) => {
  try {
    const companies = await Company.getAll();
    res.json({ 
      success: true,
      companies 
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all universities
router.post("/universities", isAdmin, async (req, res) => {
  try {
    const universities = await University.getAll();
    res.json({ 
      success: true,
      universities 
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all students
router.post("/students", isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.full_name, u.email, uni.name as university_name
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      LEFT JOIN Universities uni ON s.university_id = uni.id
    `;
    
    const students = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
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

// Get all trainers
router.post("/trainers", isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT t.*, u.full_name, u.email, c.name as company_name
      FROM Trainers t
      JOIN Users u ON t.user_id = u.id
      LEFT JOIN Company c ON t.company_id = c.id
    `;
    
    const trainers = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
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

// Get all internships
router.post("/internships", isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT i.*, c.name as company_name
      FROM Internships i
      LEFT JOIN Company c ON i.company_id = c.id
      ORDER BY i.created_at DESC
    `;
    
    const internships = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    res.json({ 
      success: true,
      internships 
    });
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get dashboard statistics
router.post("/stats", isAdmin, async (req, res) => {
  try {
    
    const stats = await new Promise((resolve, reject) => {
      const queries = {
        totalUsers: "SELECT COUNT(*) as count FROM Users WHERE user_type != 'admin'",
        totalCompanies: "SELECT COUNT(*) as count FROM Company",
        totalUniversities: "SELECT COUNT(*) as count FROM Universities",
        totalStudents: "SELECT COUNT(*) as count FROM Students",
        totalTrainers: "SELECT COUNT(*) as count FROM Trainers",
        totalInternships: "SELECT COUNT(*) as count FROM Internships",
        totalPartnerships: "SELECT COUNT(*) as count FROM University_Company_Partnerships",
        totalNotifications: "SELECT COUNT(*) as count FROM notifications",
        pendingRequests: "SELECT COUNT(*) as count FROM Registration_Requests WHERE status = 'pending'",
        activeInternships: "SELECT COUNT(*) as count FROM Internships WHERE status = 'active'",
        activePartnerships: "SELECT COUNT(*) as count FROM University_Company_Partnerships WHERE status = 'active'",
        unreadNotifications: "SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE",
        pendingCompanies: "SELECT COUNT(*) as count FROM Company WHERE status = 'pending'"
      };
      
      const results = {};
      let completed = 0;
      
      Object.entries(queries).forEach(([key, query]) => {
        db.query(query, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          results[key] = result[0].count;
          completed++;
          
          if (completed === Object.keys(queries).length) {
            resolve(results);
          }
        });
      });
    });
    
    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all partnerships
router.post("/partnerships", isAdmin, async (req, res) => {
  try {
    const partnerships = await Partnership.getAll();
    res.json({ 
      success: true,
      partnerships 
    });
  } catch (error) {
    console.error("Error fetching partnerships:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all notifications
router.post("/notifications", isAdmin, async (req, res) => {
  try {
    const notifications = await Notification.getAll();
    res.json({ 
      success: true,
      notifications 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Delete user
router.post("/users/delete", isAdmin, async (req, res) => {
  try {
    const { userIdToDelete } = req.body;
    
    if (!userIdToDelete) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    // First, get user email to delete from Registration_Requests
    const getUserQuery = "SELECT email FROM Users WHERE id = ? AND user_type != 'admin'";
    
    db.query(getUserQuery, [userIdToDelete], (err, userResults) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ 
          success: false,
          message: "Server error" 
        });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: "User not found or cannot delete admin" 
        });
      }
      
      const userEmail = userResults[0].email;
      
      // Delete from Users table
      const deleteUserQuery = "DELETE FROM Users WHERE id = ? AND user_type != 'admin'";
      
      db.query(deleteUserQuery, [userIdToDelete], (err, result) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res.status(500).json({ 
            success: false,
            message: "Server error" 
          });
        }
        
        // Also delete from Registration_Requests if exists
        const deleteRequestQuery = "DELETE FROM Registration_Requests WHERE email = ?";
        
        db.query(deleteRequestQuery, [userEmail], (err, requestResult) => {
          if (err) {
            console.error("Error deleting registration request:", err);
            // Don't fail the whole operation if this fails
          }
          
          console.log(`✅ User deleted: ${userEmail}`);
          console.log(`✅ Registration request deleted (if existed): ${userEmail}`);
          
          res.json({ 
            success: true,
            message: "User deleted successfully" 
          });
        });
      });
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all registration requests
router.post("/registration-requests", isAdmin, async (req, res) => {
  try {
    const requests = await RegistrationRequest.getAll();
    res.json({ 
      success: true,
      requests 
    });
  } catch (error) {
    console.error("Error fetching registration requests:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Approve registration request
router.post("/registration-requests/approve", isAdmin, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ 
        success: false,
        message: "Request ID is required" 
      });
    }
    
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
    
    // Create user in Users table
    const userResult = await User.create({
      full_name: request.full_name,
      email: request.email,
      password: request.password,
      user_type: request.user_type
    });
    
    const userId = userResult.insertId;
    
    // Create related records based on user type
    if (request.user_type === 'company') {
      await Company.create({
        name: request.full_name,
        email: request.email,
        status: 'pending'
      });
    } else if (request.user_type === 'university') {
      await University.create({
        name: request.full_name,
        email: request.email
      });
    } else if (request.user_type === 'student') {
      const domain = request.email.split('@')[1];
      const university = await University.findByDomain(domain);
      await Student.create({
        user_id: userId,
        university_id: university ? university.id : null,
        status: 'active'
      });
    } else if (request.user_type === 'trainer') {
      const domain = request.email.split('@')[1];
      const company = await Company.findByDomain(domain);
      if (company) {
        await Trainer.create({
          company_id: company.id,
          user_id: userId,
          status: 'active'
        });
      }
    }
    
    // Update request status to approved
    await RegistrationRequest.updateStatus(requestId, 'approved');
    
    res.json({ 
      success: true,
      message: "Registration request approved successfully",
      userId 
    });
    
  } catch (error) {
    console.error("Error approving registration request:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Reject registration request
router.post("/registration-requests/reject", isAdmin, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ 
        success: false,
        message: "Request ID is required" 
      });
    }
    
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
    
    // Update request status to rejected
    await RegistrationRequest.updateStatus(requestId, 'rejected');
    
    res.json({ 
      success: true,
      message: "Registration request rejected successfully" 
    });
    
  } catch (error) {
    console.error("Error rejecting registration request:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Mark notification as read
router.put("/notifications/:notificationId/read", isAdmin, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    console.log('📥 Received request to mark notification as read:', notificationId);
    
    if (!notificationId) {
      return res.status(400).json({ 
        success: false,
        message: "Notification ID is required" 
      });
    }
    
    // Update notification status to read
    const query = "UPDATE notifications SET is_read = TRUE WHERE id = ?";
    
    db.query(query, [notificationId], (err, result) => {
      if (err) {
        console.error("❌ Error marking notification as read:", err);
        return res.status(500).json({ 
          success: false,
          message: "Server error" 
        });
      }
      
      if (result.affectedRows === 0) {
        console.log('⚠️ Notification not found:', notificationId);
        return res.status(404).json({ 
          success: false,
          message: "Notification not found" 
        });
      }
      
      console.log('✅ Notification marked as read successfully:', notificationId);
      console.log('📊 Affected rows:', result.affectedRows);
      
      res.json({ 
        success: true,
        message: "Notification marked as read" 
      });
    });
    
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

export default router;
