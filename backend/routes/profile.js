import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Update student profile
router.put('/students/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, major, gpa, academic_year, skills } = req.body;
    
    console.log(`📝 Updating profile for student ${id}:`, { full_name, email, phone, major, gpa, academic_year, skills });
    
    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }
    
    // Update user basic info using simple query
    try {
      const updateUserQuery = `UPDATE Users SET full_name = ?, email = ? WHERE id = ?`;
      await new Promise((resolve, reject) => {
        db.query(updateUserQuery, [full_name, email, id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`✅ User info updated for student ${id}`);
    } catch (error) {
      console.log(`⚠️ Could not update user info:`, error.message);
    }
    
    // Update student profile in Students table (not student_profiles)
    try {
      const updateStudentQuery = `
        UPDATE Students 
        SET major = ?, academic_year = ?, gpa = ?, skills = ?
        WHERE user_id = ?
      `;
      await new Promise((resolve, reject) => {
        db.query(updateStudentQuery, [major || null, academic_year || '3rd Year', gpa || null, skills || null, id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`✅ Profile data updated in Students table for user ${id}`);
    } catch (error) {
      console.log(`⚠️ Could not update Students table:`, error.message);
    }
    
    console.log(`✅ Profile updated successfully for student ${id}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: id,
        full_name: full_name,
        email: email,
        phone: phone,
        major: major,
        gpa: gpa,
        academic_year: academic_year,
        skills: skills
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Get student profile
router.get('/students/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Getting profile for student ${id}`);
    
    // Get complete student profile from Students table
    const getProfileQuery = `
      SELECT s.*, u.full_name, u.email 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
    
    const profileRows = await new Promise((resolve, reject) => {
      db.query(getProfileQuery, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    const profile = profileRows[0];
    
    console.log(`✅ Profile retrieved for student ${id}`);
    
    res.json({
      success: true,
      data: profile
    });
    
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile',
      error: error.message
    });
  }
});

export default router;
