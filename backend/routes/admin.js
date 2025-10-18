import express from "express";
import User from "../models/User.js";
import Company from "../models/Company.js";
import University from "../models/University.js";
import Student from "../models/Student.js";
import Trainer from "../models/Trainer.js";
import Internship from "../models/Internship.js";
import Partnership from "../models/Partnership.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
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
        totalNotifications: "SELECT COUNT(*) as count FROM Notifications",
        activeInternships: "SELECT COUNT(*) as count FROM Internships WHERE status = 'active'",
        activePartnerships: "SELECT COUNT(*) as count FROM University_Company_Partnerships WHERE status = 'active'",
        unreadNotifications: "SELECT COUNT(*) as count FROM Notifications WHERE is_read = FALSE",
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
    
    const query = "DELETE FROM Users WHERE id = ? AND user_type != 'admin'";
    
    db.query(query, [userIdToDelete], (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ 
          success: false,
          message: "Server error" 
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          message: "User not found or cannot delete admin" 
        });
      }
      
      res.json({ 
        success: true,
        message: "User deleted successfully" 
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

export default router;
