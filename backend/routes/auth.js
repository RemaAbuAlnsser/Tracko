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

    // Get all admin users and send notifications
    const adminQuery = "SELECT id FROM Users WHERE user_type = 'admin'";
    db.query(adminQuery, async (err, admins) => {
      if (!err && admins.length > 0) {
        for (const admin of admins) {
          try {
            await Notification.create({
              user_id: admin.id,
              title: "New Registration Request",
              message: `${full_name} (${email}) has requested to register as ${user_type}`,
              type: "general"
            });
            console.log("✅ Notification sent to admin:", admin.id);
          } catch (notifError) {
            console.error("Error creating notification:", notifError);
          }
        }
      }
    });

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
