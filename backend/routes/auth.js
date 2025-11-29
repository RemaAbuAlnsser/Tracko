import express from "express";
import User from "../models/User.js";
import Company from "../models/Company.js";
import University from "../models/University.js";
import Trainer from "../models/Trainer.js";
import Student from "../models/Student.js";
import RegistrationRequest from "../models/RegistrationRequest.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Test endpoint to verify route is working
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!" });
});

// Create user directly (for testing)
router.post("/create-user", async (req, res) => {
  try {
    const { full_name, email, password, user_type } = req.body;
    console.log("Creating user directly:", { full_name, email, user_type });
    
    const result = await User.create({ full_name, email, password, user_type });
    console.log("User created:", result);
    
    res.json({ success: true, message: "User created successfully", userId: result.insertId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Get table structure (for debugging)
router.get("/table-structure", async (req, res) => {
  try {
    console.log("Getting table structure...");
    const query = "DESCRIBE users";
    
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) {
          console.error("Database error:", err);
          res.status(500).json({ success: false, message: "Server error", error: err.message });
          reject(err);
        } else {
          console.log("Table structure:", results);
          res.json({ success: true, structure: results });
          resolve(results);
        }
      });
    });
  } catch (error) {
    console.error("Error getting table structure:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    console.log("📝 Signup request received:", req.body);
    const { full_name, email, password, user_type } = req.body;

    // Validate input
    if (!full_name || !email || !password || !user_type) {
      console.log("❌ Validation failed: Missing fields");
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Validate user_type
    const validUserTypes = ['university', 'company', 'student', 'trainer'];
    if (!validUserTypes.includes(user_type)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user type. Must be 'university', 'company', 'student', or 'trainer'" 
      });
    }

    // Check if email already exists in Users table
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Check if email already has a pending or rejected request
    const existingRequest = await RegistrationRequest.findByEmail(email);
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(409).json({ 
          success: false,
          message: "Registration request already submitted. Please wait for admin approval." 
        });
      } else if (existingRequest.status === 'rejected') {
        return res.status(403).json({ 
          success: false,
          message: "Your registration request was rejected. Please contact support." 
        });
      }
    }

    // Create registration request instead of user directly
    console.log("💾 Creating registration request...");
    const result = await RegistrationRequest.create({ full_name, email, password, user_type });
    console.log("✅ Registration request created with ID:", result.insertId);

    // Helper function to send to admin
    async function sendToAdmin() {
      console.log("⚠️ Sending to admin as fallback");
      const adminQuery = "SELECT id FROM Users WHERE user_type = 'admin'";
      const admins = await new Promise((resolve, reject) => {
        db.query(adminQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      for (const admin of admins) {
        await Notification.create({
          user_id: admin.id,
          title: "New Registration Request",
          message: `${full_name} (${email}) has requested to register as ${user_type}. Request ID: ${result.insertId}`,
          type: "general"
        });
        console.log("✅ Notification sent to admin:", admin.id);
      }
    }

    // Send notifications based on user type
    console.log("📬 Determining notification recipient for user_type:", user_type);
    
    if (user_type === 'student') {
      // For students, send notification to their university
      const domain = email.split('@')[1];
      console.log("🔍 Student detected! Looking for university with domain:", domain);
      
      const university = await University.findByDomain(domain);
      console.log("🔎 University search result:", university ? `Found: ${university.name}` : 'Not found');
      
      if (university) {
        console.log("✅ Found university:", university.name, "- ID:", university.id);
        
        const universityUserQuery = "SELECT id FROM Users WHERE email = ? AND user_type = 'university'";
        const users = await new Promise((resolve, reject) => {
          db.query(universityUserQuery, [university.email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        
        if (users.length > 0) {
          const universityUser = users[0];
          await Notification.create({
            user_id: universityUser.id,
            title: "New Student Registration Request",
            message: `${full_name} (${email}) has requested to register as a student. Request ID: ${result.insertId}`,
            type: "registration_request"
          });
          console.log("✅ Notification sent to university user:", universityUser.id);
        } else {
          console.log("⚠️ University found but no user account");
        }
      } else {
        console.log("⚠️ No university found for domain:", domain);
      }
    } else if (user_type === 'trainer') {
      // For trainers, send notification to their company
      const domain = email.split('@')[1];
      console.log("🔍 Trainer detected! Email:", email);
      console.log("🔍 Extracted domain:", domain);
      console.log("🔍 Looking for company with this domain...");
      
      const company = await Company.findByDomain(domain);
      console.log("🔎 Company search result:", company ? `Found: ${company.name} (ID: ${company.id}, Email: ${company.email})` : 'Not found');
      
      if (company) {
        console.log("✅ Found company:", company.name, "- ID:", company.id);
        
        const companyUserQuery = "SELECT id FROM Users WHERE email = ? AND user_type = 'company'";
        const users = await new Promise((resolve, reject) => {
          db.query(companyUserQuery, [company.email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        
        if (users.length > 0) {
          const companyUser = users[0];
          await Notification.create({
            user_id: companyUser.id,
            title: "New Trainer Registration Request",
            message: `${full_name} (${email}) has requested to register as a trainer. Request ID: ${result.insertId}`,
            type: "registration_request"
          });
          console.log("✅ Notification sent to company user:", companyUser.id);
        } else {
          console.log("⚠️ Company found but no user account");
        }
      } else {
        console.log("⚠️ No company found for domain:", domain);
      }
    } else {
      // For other user types (company, university), send to admin
      console.log("ℹ️ User type is", user_type, "- sending to admin");
      await sendToAdmin();
    }

    res.status(201).json({ 
      success: true,
      message: "Registration request submitted successfully. Please wait for admin approval.",
      requestId: result.insertId
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Login request received:", { email: req.body.email });
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("❌ Validation failed: Missing fields");
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    console.log("✅ Login successful for user:", user.email);

    // Return user data (without password)
    res.status(200).json({ 
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        user_type: user.user_type
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

export default router;
