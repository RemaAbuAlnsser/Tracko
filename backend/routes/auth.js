import express from "express";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Trainer from "../models/Trainer.js";

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
    const validUserTypes = ['university', 'company', 'student'];
    if (!validUserTypes.includes(user_type)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user type. Must be 'university', 'company', or 'student'" 
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

    // If company type, also check Company table
    if (user_type === 'company') {
      const existingCompany = await Company.findByEmail(email);
      if (existingCompany) {
        return res.status(409).json({ 
          success: false,
          message: "Company with this email already exists" 
        });
      }
    }

    // Create new user
    console.log("💾 Creating user in database...");
    const result = await User.create({ full_name, email, password, user_type });
    console.log("✅ User created successfully with ID:", result.insertId);

    // If user type is company, also create a Company record and check for Trainer
    if (user_type === 'company') {
      try {
        console.log("🏢 Processing company user:", email);
        
        // Extract domain from email (e.g., ahmad@asal.com -> asal.com)
        const emailDomain = email.split('@')[1];
        console.log("🔍 Extracted domain:", emailDomain);
        
        // Check if there's a company with this domain
        const companyByDomain = await Company.findByEmailDomain(emailDomain);
        
        if (companyByDomain) {
          // Company exists with this domain - create Trainer record
          console.log("✅ Found company with domain:", companyByDomain.name);
          
          try {
            await Trainer.create({
              company_id: companyByDomain.id,
              user_id: result.insertId,
              status: 'active'
            });
            console.log("✅ Trainer record created successfully for company:", companyByDomain.name);
          } catch (trainerError) {
            console.error("⚠️ Warning: Failed to create trainer record:", trainerError);
          }
        } else {
          // No company with this domain - create new Company record
          console.log("ℹ️ No company found with domain, creating new company record");
          
          const existingCompany = await Company.findByEmail(email);
          if (!existingCompany) {
            await Company.create({
              name: full_name,
              email: email,
              status: 'pending'
            });
            console.log("✅ Company record created successfully");
          }
        }
      } catch (companyError) {
        console.error("⚠️ Warning: Failed to process company/trainer:", companyError);
        console.error("Error details:", companyError.message);
        // Don't fail the signup if company/trainer creation fails
      }
    }

    res.status(201).json({ 
      success: true,
      message: "User registered successfully",
      userId: result.insertId
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
