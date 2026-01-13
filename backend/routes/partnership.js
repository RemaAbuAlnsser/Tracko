import express from "express";
import Partnership from "../models/Partnership.js";

const router = express.Router();

// Get all partnerships
router.get("/", async (req, res) => {
  try {
    const { status, university_id, company_id } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (university_id) filters.university_id = university_id;
    if (company_id) filters.company_id = company_id;
    
    const partnerships = await Partnership.getAll(filters);
    res.json({
      success: true,
      data: partnerships
    });
  } catch (error) {
    console.error("Error fetching partnerships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partnerships"
    });
  }
});

// Get partnership by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const partnership = await Partnership.findById(id);
    
    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: "Partnership not found"
      });
    }
    
    res.json({
      success: true,
      data: partnership
    });
  } catch (error) {
    console.error("Error fetching partnership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partnership"
    });
  }
});

// Get partnerships by university ID
router.get("/university/:universityId", async (req, res) => {
  try {
    const { universityId } = req.params;
    const partnerships = await Partnership.getByUniversityId(universityId);
    
    res.json({
      success: true,
      data: partnerships
    });
  } catch (error) {
    console.error("Error fetching university partnerships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university partnerships"
    });
  }
});

// Get partnerships by company ID
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const partnerships = await Partnership.getByCompanyId(companyId);
    
    res.json({
      success: true,
      data: partnerships
    });
  } catch (error) {
    console.error("Error fetching company partnerships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company partnerships"
    });
  }
});

// Create new partnership
router.post("/", async (req, res) => {
  try {
    const partnershipData = req.body;
    
    // Validate required fields
    if (!partnershipData.university_id || !partnershipData.company_id) {
      return res.status(400).json({
        success: false,
        message: "University ID and Company ID are required"
      });
    }
    
    // Check if partnership already exists
    const existingPartnership = await Partnership.checkExists(
      partnershipData.university_id, 
      partnershipData.company_id
    );
    
    if (existingPartnership) {
      return res.status(409).json({
        success: false,
        message: "Partnership already exists between this university and company"
      });
    }
    
    const result = await Partnership.create(partnershipData);
    const newPartnership = await Partnership.findById(result.insertId);
    
    res.status(201).json({
      success: true,
      message: "Partnership created successfully",
      data: newPartnership
    });
  } catch (error) {
    console.error("Error creating partnership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create partnership"
    });
  }
});

// Update partnership
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const partnershipData = req.body;
    
    // Check if partnership exists
    const existingPartnership = await Partnership.findById(id);
    if (!existingPartnership) {
      return res.status(404).json({
        success: false,
        message: "Partnership not found"
      });
    }
    
    await Partnership.update(id, partnershipData);
    const updatedPartnership = await Partnership.findById(id);
    
    res.json({
      success: true,
      message: "Partnership updated successfully",
      data: updatedPartnership
    });
  } catch (error) {
    console.error("Error updating partnership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update partnership"
    });
  }
});

// Update partnership status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }
    
    const validStatuses = ['active', 'expired', 'pending', 'terminated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: active, expired, pending, or terminated"
      });
    }
    
    await Partnership.updateStatus(id, status);
    const updatedPartnership = await Partnership.findById(id);
    
    res.json({
      success: true,
      message: "Partnership status updated successfully",
      data: updatedPartnership
    });
  } catch (error) {
    console.error("Error updating partnership status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update partnership status"
    });
  }
});

// Delete partnership
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingPartnership = await Partnership.findById(id);
    if (!existingPartnership) {
      return res.status(404).json({
        success: false,
        message: "Partnership not found"
      });
    }
    
    await Partnership.delete(id);
    
    res.json({
      success: true,
      message: "Partnership deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting partnership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete partnership"
    });
  }
});

// Get active partnerships count for university
router.get("/university/:universityId/count", async (req, res) => {
  try {
    const { universityId } = req.params;
    const count = await Partnership.getActiveCountByUniversity(universityId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("Error getting partnership count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get partnership count"
    });
  }
});

// Get active partnerships count for company
router.get("/company/:companyId/count", async (req, res) => {
  try {
    const { companyId } = req.params;
    const count = await Partnership.getActiveCountByCompany(companyId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("Error getting partnership count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get partnership count"
    });
  }
});

export default router;
