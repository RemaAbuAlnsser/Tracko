import express from "express";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";

const router = express.Router();

// Create new internship
router.post("/", async (req, res) => {
  try {
    const { company_email, title, description, requirements, specialization, capacity, status } = req.body;

    // Validate required fields
    if (!company_email || !title) {
      return res.status(400).json({
        success: false,
        message: "Company email and title are required"
      });
    }

    // Find company by email
    const company = await Company.findByEmail(company_email);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Create internship
    const result = await Internship.create({
      company_id: company.id,
      title,
      description,
      requirements,
      specialization,
      capacity: capacity || 1,
      status: status || 'open'
    });

    console.log("✅ Internship created:", result.insertId);

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      internshipId: result.insertId
    });

  } catch (error) {
    console.error("Create internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all internships
router.get("/", async (req, res) => {
  try {
    const internships = await Internship.findAll();

    res.status(200).json({
      success: true,
      internships
    });

  } catch (error) {
    console.error("Get internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get internships by company email
router.get("/company/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Find company by email
    const company = await Company.findByEmail(email);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const internships = await Internship.findByCompanyId(company.id);

    res.status(200).json({
      success: true,
      internships
    });

  } catch (error) {
    console.error("Get company internships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get internship by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    res.status(200).json({
      success: true,
      internship
    });

  } catch (error) {
    console.error("Get internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update internship
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, specialization, capacity, status } = req.body;

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    // Update internship
    await Internship.update(id, {
      title: title || existingInternship.title,
      description: description || existingInternship.description,
      requirements: requirements || existingInternship.requirements,
      specialization: specialization || existingInternship.specialization,
      capacity: capacity || existingInternship.capacity,
      status: status || existingInternship.status
    });

    console.log("✅ Internship updated:", id);

    res.status(200).json({
      success: true,
      message: "Internship updated successfully"
    });

  } catch (error) {
    console.error("Update internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete internship
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    await Internship.delete(id);

    console.log("✅ Internship deleted:", id);

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });

  } catch (error) {
    console.error("Delete internship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update internship status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'closed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'open', 'closed', or 'pending'"
      });
    }

    // Check if internship exists
    const existingInternship = await Internship.findById(id);
    if (!existingInternship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    await Internship.updateStatus(id, status);

    console.log("✅ Internship status updated:", id, "->", status);

    res.status(200).json({
      success: true,
      message: "Internship status updated successfully"
    });

  } catch (error) {
    console.error("Update internship status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
