import express from "express";
import Company from "../models/Company.js";
import db from "../config/database.js";
import RegistrationRequest from "../models/RegistrationRequest.js";
import User from "../models/User.js";
import Trainer from "../models/Trainer.js";

const router = express.Router();

// Create a new company
router.post("/", async (req, res) => {
  try {
    console.log("📝 Create company request received");
    const { name, email, phone, industry, address, description, website, logo, status } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        message: "Name and email are required" 
      });
    }

    // Check if email already exists
    const existingCompany = await Company.findByEmail(email);
    if (existingCompany) {
      return res.status(409).json({ 
        success: false,
        message: "Company with this email already exists" 
      });
    }

    // Create company
    const result = await Company.create({ 
      name, 
      email, 
      phone, 
      industry, 
      address, 
      description, 
      website, 
      logo, 
      status 
    });

    console.log("✅ Company created with ID:", result.insertId);

    res.status(201).json({ 
      success: true,
      message: "Company created successfully",
      companyId: result.insertId
    });

  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all companies
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filters = status ? { status } : {};
    
    const companies = await Company.getAll(filters);

    res.status(200).json({ 
      success: true,
      count: companies.length,
      data: companies,
      companies // Keep for backward compatibility
    });

  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get company by email
router.get("/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const company = await Company.findByEmail(email);

    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      company
    });

  } catch (error) {
    console.error("Get company by email error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get company by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      company
    });

  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Update company by email
router.put("/email/:email", async (req, res) => {
  try {
    const oldEmail = req.params.email; // The current email in the URL
    const { 
      name, 
      email: newEmail, // The new email from the form
      phone, 
      industry, 
      address, 
      description, 
      website, 
      logo
    } = req.body;

    // Find company by old email
    const existingCompany = await Company.findByEmail(oldEmail);
    if (!existingCompany) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    // If email is being changed, check if new email already exists
    if (newEmail && newEmail !== oldEmail) {
      const emailExists = await Company.findByEmail(newEmail);
      if (emailExists) {
        return res.status(409).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
      
      // Check in Users table too
      const userEmailExists = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM Users WHERE email = ?', [newEmail], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0);
        });
      });
      
      if (userEmailExists) {
        return res.status(409).json({ 
          success: false,
          message: "Email already in use" 
        });
      }
    }

    // Update company table
    const companyQuery = `
      UPDATE Company 
      SET name = ?, email = ?, phone = ?, industry = ?, address = ?, 
          description = ?, website = ?, logo = ?
      WHERE email = ?
    `;

    const updateValues = [
      name || existingCompany.name,
      newEmail || oldEmail,
      phone || existingCompany.phone,
      industry || existingCompany.industry,
      address || existingCompany.address,
      description || existingCompany.description,
      website || existingCompany.website,
      logo !== undefined ? logo : existingCompany.logo,
      oldEmail // WHERE condition
    ];

    console.log("📝 Updating company with values:", {
      name: updateValues[0],
      oldEmail: oldEmail,
      newEmail: updateValues[1],
      phone: updateValues[2],
      hasLogo: !!updateValues[7]
    });

    await new Promise((resolve, reject) => {
      db.query(companyQuery, updateValues, (err, result) => {
        if (err) {
          console.error("❌ Update query error:", err);
          reject(err);
        } else {
          console.log("✅ Company table updated:", result);
          resolve(result);
        }
      });
    });

    // Update the Users table with new name and/or email
    const userUpdateFields = [];
    const userUpdateValues = [];
    
    if (name && name !== existingCompany.name) {
      userUpdateFields.push('full_name = ?');
      userUpdateValues.push(name);
    }
    
    if (newEmail && newEmail !== oldEmail) {
      userUpdateFields.push('email = ?');
      userUpdateValues.push(newEmail);
    }
    
    if (userUpdateFields.length > 0) {
      const userQuery = `UPDATE Users SET ${userUpdateFields.join(', ')} WHERE email = ?`;
      userUpdateValues.push(oldEmail);
      
      await new Promise((resolve, reject) => {
        db.query(userQuery, userUpdateValues, (err, result) => {
          if (err) {
            console.error("⚠️ Warning: Failed to update Users table:", err);
            resolve(); // Don't fail the whole operation
          } else {
            console.log("✅ Users table updated");
            resolve(result);
          }
        });
      });
    }

    console.log("✅ Company updated via email:", oldEmail, "->", newEmail || oldEmail);

    res.status(200).json({ 
      success: true,
      message: "Company profile updated successfully",
      newEmail: newEmail || oldEmail // Return the new email for frontend to update
    });

  } catch (error) {
    console.error("Update company by email error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Update company by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, industry, address, description, website, logo, status } = req.body;

    // Check if company exists
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingCompany.email) {
      const emailExists = await Company.findByEmail(email);
      if (emailExists) {
        return res.status(409).json({ 
          success: false,
          message: "Email already in use by another company" 
        });
      }
    }

    // Update company
    await Company.update(id, { 
      name, 
      email, 
      phone, 
      industry, 
      address, 
      description, 
      website, 
      logo, 
      status 
    });

    console.log("✅ Company updated:", id);

    res.status(200).json({ 
      success: true,
      message: "Company updated successfully"
    });

  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Delete company
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    // Delete company
    await Company.delete(id);

    console.log("✅ Company deleted:", id);

    res.status(200).json({ 
      success: true,
      message: "Company deleted successfully"
    });

  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Update company status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid status. Must be 'active', 'inactive', or 'pending'" 
      });
    }

    // Check if company exists
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    // Update status
    await Company.updateStatus(id, status);

    console.log("✅ Company status updated:", id, "->", status);

    res.status(200).json({ 
      success: true,
      message: "Company status updated successfully"
    });

  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Search companies
router.get("/search/:term", async (req, res) => {
  try {
    const { term } = req.params;
    const companies = await Company.search(term);

    res.status(200).json({ 
      success: true,
      count: companies.length,
      companies
    });

  } catch (error) {
    console.error("Search companies error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get company dashboard stats
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Getting stats for company ${id}`);

    const queries = {
      internshipsCount: "SELECT COUNT(*) as count FROM Internships WHERE company_id = ?",
      trainersCount: "SELECT COUNT(*) as count FROM Trainers WHERE company_id = ?",
      activeStudentsCount: `
        SELECT COUNT(DISTINCT s.id) as count
        FROM Students s
        INNER JOIN Internship_Matches im ON s.id = im.student_id
        INNER JOIN Internships i ON im.internship_id = i.id
        WHERE i.company_id = ? 
        AND im.status = 'accepted'
        AND s.status = 'in_training'
      `,
      applicantsCount: `
        SELECT COUNT(DISTINCT im.id) as count
        FROM Internship_Matches im
        INNER JOIN Internships i ON im.internship_id = i.id
        WHERE i.company_id = ?
      `
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      await new Promise((resolve, reject) => {
        db.query(query, [id], (err, result) => {
          if (err) {
            console.error(`Error executing ${key}:`, err);
            reject(err);
          } else {
            results[key] = result[0].count;
            resolve();
          }
        });
      });
    }

    console.log("✅ Company stats:", results);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error("Get company stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get trainer registration requests for a company
router.get("/:companyId/trainer-requests", async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get company email to match with trainer email domain
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }
    
    const domain = company.email.split('@')[1];
    
    // Get all pending trainer requests that match company domain
    const query = `
      SELECT * FROM Registration_Requests 
      WHERE user_type = 'trainer' 
      AND status = 'pending'
      AND email LIKE ?
      ORDER BY created_at DESC
    `;
    
    const requests = await new Promise((resolve, reject) => {
      db.query(query, [`%@${domain}`], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    res.json({
      success: true,
      requests: requests || []
    });
    
  } catch (error) {
    console.error("Error fetching trainer requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Approve trainer registration request
router.post("/:companyId/trainer-requests/approve", async (req, res) => {
  try {
    const { companyId } = req.params;
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
    
    if (request.user_type !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: "This is not a trainer request"
      });
    }
    
    // Create user in Users table
    const userResult = await User.create({
      full_name: request.full_name,
      email: request.email,
      password: request.password,
      user_type: 'trainer'
    });
    
    const userId = userResult.insertId;
    
    // Create trainer record
    await Trainer.create({
      company_id: companyId,
      user_id: userId,
      status: 'active'
    });
    
    // Update request status to approved
    await RegistrationRequest.updateStatus(requestId, 'approved');
    
    res.json({
      success: true,
      message: "Trainer registration approved successfully",
      userId
    });
    
  } catch (error) {
    console.error("Error approving trainer request:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Reject trainer registration request
router.post("/:companyId/trainer-requests/reject", async (req, res) => {
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
      message: "Trainer registration rejected successfully"
    });
    
  } catch (error) {
    console.error("Error rejecting trainer request:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
