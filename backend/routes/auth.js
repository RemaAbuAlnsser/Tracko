import express from "express";
import User from "../models/User.js";
import Company from "../models/Company.js";
import University from "../models/University.js";
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

    // If university type, also check University table
    if (user_type === 'university') {
      const existingUniversity = await University.findByEmail(email);
      if (existingUniversity) {
        return res.status(409).json({ 
          success: false,
          message: "University with this email already exists" 
        });
      }
    }

    // Create new user
    console.log("💾 Creating user in database...");
    const result = await User.create({ full_name, email, password, user_type });
    console.log("✅ User created successfully with ID:", result.insertId);

    // If user type is company, also create a Company record
    if (user_type === 'company') {
      try {
        console.log("🏢 Creating company record for:", email);
        
        // Check if company already exists
        const existingCompany = await Company.findByEmail(email);
        if (existingCompany) {
          console.log("ℹ️ Company record already exists");
        } else {
          await Company.create({
            name: full_name,
            email: email,
            status: 'pending'
          });
          console.log("✅ Company record created successfully");
        }
      } catch (companyError) {
        console.error("⚠️ Warning: Failed to create company record:", companyError);
        console.error("Error details:", companyError.message);
        // Don't fail the signup if company creation fails
      }
    }

    // If user type is university, also create a University record
    if (user_type === 'university') {
      try {
        console.log("🎓 Creating university record for:", email);
        
        // Check if university already exists
        const existingUniversity = await University.findByEmail(email);
        if (existingUniversity) {
          console.log("ℹ️ University record already exists");
        } else {
          await University.create({
            name: full_name,
            email: email
          });
          console.log("✅ University record created successfully");
        }
      } catch (universityError) {
        console.error("⚠️ Warning: Failed to create university record:", universityError);
        console.error("Error details:", universityError.message);
        // Don't fail the signup if university creation fails
      }
    }

    // If user type is trainer, find company by domain and create trainer record
    if (user_type === 'trainer') {
      try {
        console.log("👨‍🏫 Processing trainer signup for:", email);
        
        // Extract domain from email (e.g., noor@ghadeer.com -> ghadeer.com)
        const domain = email.split('@')[1];
        console.log("🔍 Looking for company with domain:", domain);
        
        // Find company by domain
        const company = await Company.findByDomain(domain);
        
        if (company) {
          console.log("✅ Found company:", company.name, "with ID:", company.id);
          
          // Create trainer record
          await Trainer.create({
            company_id: company.id,
            user_id: result.insertId,
            status: 'active'
          });
          
          console.log("✅ Trainer record created successfully");
        } else {
          console.log("❌ No company found with domain:", domain);
          return res.status(400).json({ 
            success: false,
            message: `No company found with domain ${domain}. Please contact your company administrator.`
          });
        }
      } catch (trainerError) {
        console.error("❌ Error creating trainer record:", trainerError);
        console.error("Error details:", trainerError.message);
        return res.status(500).json({ 
          success: false,
          message: "Failed to create trainer record" 
        });
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
