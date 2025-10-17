import express from "express";
import University from "../models/University.js";
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

export default router;
