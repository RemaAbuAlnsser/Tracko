import db from "../config/database.js";

class InternshipMatch {
  // Create or update match
  static upsert(matchData) {
    const { 
      student_id,
      internship_id,
      match_percentage,
      matched_skills = null,
      matched_categories = null,
      gpa_match = null,
      gpa_message = null,
      work_mode_match = null,
      work_mode_message = null
    } = matchData;
    
    const query = `
      INSERT INTO Internship_Matches 
      (student_id, internship_id, match_percentage, matched_skills, matched_categories, gpa_match, gpa_message, work_mode_match, work_mode_message) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        match_percentage = VALUES(match_percentage),
        matched_skills = VALUES(matched_skills),
        matched_categories = VALUES(matched_categories),
        gpa_match = VALUES(gpa_match),
        gpa_message = VALUES(gpa_message),
        work_mode_match = VALUES(work_mode_match),
        work_mode_message = VALUES(work_mode_message),
        last_updated = CURRENT_TIMESTAMP
    `;
    
    return new Promise((resolve, reject) => {
      // Ensure proper JSON stringification
      const skillsJson = matched_skills ? JSON.stringify(matched_skills) : null;
      const categoriesJson = matched_categories ? JSON.stringify(matched_categories) : null;
      
      db.query(
        query, 
        [
          student_id, 
          internship_id, 
          match_percentage, 
          skillsJson,
          categoriesJson,
          gpa_match,
          gpa_message,
          work_mode_match,
          work_mode_message
        ], 
        (err, result) => {
          if (err) {
            console.error('Error upserting match:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Get matches for a student
  static getByStudentId(studentId, minMatchPercentage = 0) {
    const query = `
      SELECT 
        im.*,
        i.title as internship_title,
        i.description as internship_description,
        i.requirements as internship_requirements,
        i.specialization as internship_specialization,
        i.capacity,
        i.status as internship_status,
        i.min_gpa,
        i.work_mode,
        c.name as company_name,
        c.logo as company_logo,
        c.industry as company_industry
      FROM Internship_Matches im
      INNER JOIN Internships i ON im.internship_id = i.id
      INNER JOIN Company c ON i.company_id = c.id
      WHERE im.student_id = ? AND im.match_percentage >= ?
      ORDER BY im.match_percentage DESC, im.last_updated DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, minMatchPercentage], (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields safely
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let matchedCategories = null;
            
            // Parse matched_skills
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string' 
                  ? JSON.parse(row.matched_skills) 
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
                matchedSkills = null;
              }
            }
            
            // Parse matched_categories
            if (row.matched_categories) {
              try {
                matchedCategories = typeof row.matched_categories === 'string'
                  ? JSON.parse(row.matched_categories)
                  : row.matched_categories;
              } catch (e) {
                console.warn('Failed to parse matched_categories:', row.matched_categories);
                matchedCategories = null;
              }
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              matched_categories: matchedCategories
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }

  // Get match by student and internship
  static getByStudentAndInternship(studentId, internshipId) {
    const query = `
      SELECT * FROM Internship_Matches 
      WHERE student_id = ? AND internship_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, internshipId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results.length > 0) {
            const result = results[0];
            
            // Parse matched_skills safely
            try {
              result.matched_skills = result.matched_skills 
                ? (typeof result.matched_skills === 'string' ? JSON.parse(result.matched_skills) : result.matched_skills)
                : null;
            } catch (e) {
              console.warn('Failed to parse matched_skills:', result.matched_skills);
              result.matched_skills = null;
            }
            
            // Parse matched_categories safely
            try {
              result.matched_categories = result.matched_categories 
                ? (typeof result.matched_categories === 'string' ? JSON.parse(result.matched_categories) : result.matched_categories)
                : null;
            } catch (e) {
              console.warn('Failed to parse matched_categories:', result.matched_categories);
              result.matched_categories = null;
            }
            
            resolve(result);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  // Delete old matches for a student
  static deleteByStudentId(studentId) {
    const query = "DELETE FROM Internship_Matches WHERE student_id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Get top matches for a student
  static getTopMatches(studentId, limit = 10) {
    const query = `
      SELECT 
        im.*,
        i.title as internship_title,
        i.description as internship_description,
        c.name as company_name,
        c.logo as company_logo
      FROM Internship_Matches im
      INNER JOIN Internships i ON im.internship_id = i.id
      INNER JOIN Company c ON i.company_id = c.id
      WHERE im.student_id = ?
      ORDER BY im.match_percentage DESC
      LIMIT ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, limit], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let matchedCategories = null;
            
            // Parse matched_skills safely
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string'
                  ? JSON.parse(row.matched_skills)
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
              }
            }
            
            // Parse matched_categories safely
            if (row.matched_categories) {
              try {
                matchedCategories = typeof row.matched_categories === 'string'
                  ? JSON.parse(row.matched_categories)
                  : row.matched_categories;
              } catch (e) {
                console.warn('Failed to parse matched_categories:', row.matched_categories);
              }
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              matched_categories: matchedCategories
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }

  // Save internship for later
  static saveInternship(studentId, internshipId) {
    const query = `
      INSERT INTO Internship_Matches (student_id, internship_id, saved, match_percentage)
      VALUES (?, ?, TRUE, 0)
      ON DUPLICATE KEY UPDATE saved = TRUE
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, internshipId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Unsave internship
  static unsaveInternship(studentId, internshipId) {
    const query = `
      UPDATE Internship_Matches 
      SET saved = FALSE 
      WHERE student_id = ? AND internship_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, internshipId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Update application status (accept/reject)
  static updateStatus(matchId, status) {
    return new Promise((resolve, reject) => {
      // Start transaction
      db.beginTransaction((err) => {
        if (err) {
          return reject(err);
        }

        // Update status
        const updateStatusQuery = `
          UPDATE Internship_Matches 
          SET status = ? 
          WHERE id = ?
        `;

        db.query(updateStatusQuery, [status, matchId], (err, result) => {
          if (err) {
            return db.rollback(() => {
              reject(err);
            });
          }

          // If accepting, decrease capacity
          if (status === 'accepted') {
            const decreaseCapacityQuery = `
              UPDATE Internships i
              INNER JOIN Internship_Matches im ON i.id = im.internship_id
              SET i.capacity = i.capacity - 1
              WHERE im.id = ? AND i.capacity > 0
            `;

            db.query(decreaseCapacityQuery, [matchId], (err, result) => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }

              // Commit transaction
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    reject(err);
                  });
                }
                resolve(result);
              });
            });
          } else {
            // If rejecting, just commit
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve(result);
            });
          }
        });
      });
    });
  }

  // Apply to internship
  static applyToInternship(studentId, internshipId) {
    const query = `
      INSERT INTO Internship_Matches (student_id, internship_id, applied, applied_at, match_percentage)
      VALUES (?, ?, TRUE, NOW(), 0)
      ON DUPLICATE KEY UPDATE applied = TRUE, applied_at = NOW()
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId, internshipId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Get applicants for a company's internship
  static getApplicantsByInternship(internshipId) {
    const query = `
      SELECT 
        im.*,
        s.id as student_id,
        u.full_name,
        s.major,
        s.academic_year as year_of_study,
        s.student_img,
        u.email,
        un.name as university_name,
        cv.analysis_data,
        i.title as internship_title
      FROM Internship_Matches im
      INNER JOIN Students s ON im.student_id = s.id
      INNER JOIN Users u ON s.user_id = u.id
      LEFT JOIN Universities un ON s.university_id = un.id
      LEFT JOIN CVs cv ON s.id = cv.student_id
      INNER JOIN Internships i ON im.internship_id = i.id
      WHERE im.internship_id = ? AND im.applied = TRUE AND im.status = 'pending'
      ORDER BY im.applied_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [internshipId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields and extract GPA
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let gpa = null;
            
            // Parse matched_skills
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string' 
                  ? JSON.parse(row.matched_skills) 
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
              }
            }
            
            // Extract GPA from analysis_data (for internship)
            if (row.analysis_data) {
              try {
                const analysisData = typeof row.analysis_data === 'string'
                  ? JSON.parse(row.analysis_data)
                  : row.analysis_data;
                
                console.log('📊 [Internship] Analysis data for student', row.student_id, ':', JSON.stringify(analysisData).substring(0, 200));
                
                // Try different possible GPA field names
                gpa = analysisData.gpa || 
                      analysisData.GPA || 
                      analysisData.grade_point_average ||
                      analysisData.overall_gpa ||
                      null;
                
                console.log('📈 [Internship] Extracted GPA for student', row.student_id, ':', gpa);
              } catch (e) {
                console.warn('❌ Failed to parse analysis_data:', e.message);
              }
            } else {
              console.log('⚠️ No analysis_data for student:', row.student_id);
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              gpa: gpa
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }

  // Get accepted applicants for a company
  static getAcceptedApplicantsByCompany(companyId) {
    const query = `
      SELECT 
        im.*,
        s.id as student_id,
        u.full_name,
        s.major,
        s.academic_year as year_of_study,
        s.student_img,
        u.email,
        un.name as university_name,
        cv.analysis_data,
        i.title as internship_title,
        i.id as internship_id
      FROM Internship_Matches im
      INNER JOIN Students s ON im.student_id = s.id
      INNER JOIN Users u ON s.user_id = u.id
      LEFT JOIN Universities un ON s.university_id = un.id
      LEFT JOIN CVs cv ON s.id = cv.student_id
      INNER JOIN Internships i ON im.internship_id = i.id
      WHERE i.company_id = ? AND im.applied = TRUE AND im.status = 'accepted'
      ORDER BY im.applied_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [companyId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields and extract GPA
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let gpa = null;
            
            // Parse matched_skills
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string' 
                  ? JSON.parse(row.matched_skills) 
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
              }
            }
            
            // Extract GPA from analysis_data
            if (row.analysis_data) {
              try {
                const analysisData = typeof row.analysis_data === 'string'
                  ? JSON.parse(row.analysis_data)
                  : row.analysis_data;
                
                console.log('📊 [Accepted] Analysis data for student', row.student_id, ':', JSON.stringify(analysisData).substring(0, 200));
                
                gpa = analysisData.gpa || 
                      analysisData.GPA || 
                      analysisData.grade_point_average ||
                      analysisData.overall_gpa ||
                      null;
                
                console.log('📈 [Accepted] Extracted GPA for student', row.student_id, ':', gpa);
              } catch (e) {
                console.warn('❌ Failed to parse analysis_data:', e.message);
              }
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              gpa: gpa
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }

  // Get all applicants for a company (all internships)
  static getApplicantsByCompany(companyId) {
    const query = `
      SELECT 
        im.*,
        s.id as student_id,
        u.full_name,
        s.major,
        s.academic_year as year_of_study,
        s.student_img,
        u.email,
        un.name as university_name,
        cv.analysis_data,
        i.title as internship_title,
        i.id as internship_id
      FROM Internship_Matches im
      INNER JOIN Students s ON im.student_id = s.id
      INNER JOIN Users u ON s.user_id = u.id
      LEFT JOIN Universities un ON s.university_id = un.id
      LEFT JOIN CVs cv ON s.id = cv.student_id
      INNER JOIN Internships i ON im.internship_id = i.id
      WHERE i.company_id = ? AND im.applied = TRUE AND im.status = 'pending'
      ORDER BY im.applied_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [companyId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields and extract GPA
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let gpa = null;
            
            // Parse matched_skills
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string' 
                  ? JSON.parse(row.matched_skills) 
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
              }
            }
            
            // Extract GPA from analysis_data (for company)
            if (row.analysis_data) {
              try {
                const analysisData = typeof row.analysis_data === 'string'
                  ? JSON.parse(row.analysis_data)
                  : row.analysis_data;
                
                console.log('📊 [Company] Analysis data for student', row.student_id, ':', JSON.stringify(analysisData).substring(0, 200));
                
                // Try different possible GPA field names
                gpa = analysisData.gpa || 
                      analysisData.GPA || 
                      analysisData.grade_point_average ||
                      analysisData.overall_gpa ||
                      null;
                
                console.log('📈 [Company] Extracted GPA for student', row.student_id, ':', gpa);
              } catch (e) {
                console.warn('❌ Failed to parse analysis_data:', e.message);
              }
            } else {
              console.log('⚠️ No analysis_data for student:', row.student_id);
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              gpa: gpa
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }

  // Get saved internships for a student
  static getSavedInternships(studentId) {
    const query = `
      SELECT 
        im.*,
        i.title as internship_title,
        i.description as internship_description,
        i.requirements as internship_requirements,
        i.specialization as internship_specialization,
        i.capacity,
        i.status as internship_status,
        i.min_gpa,
        i.work_mode,
        c.name as company_name,
        c.logo as company_logo,
        c.industry as company_industry
      FROM Internship_Matches im
      INNER JOIN Internships i ON im.internship_id = i.id
      INNER JOIN Company c ON i.company_id = c.id
      WHERE im.student_id = ? AND im.saved = TRUE
      ORDER BY im.last_updated DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields safely
          const parsedResults = results.map(row => {
            let matchedSkills = null;
            let matchedCategories = null;
            
            if (row.matched_skills) {
              try {
                matchedSkills = typeof row.matched_skills === 'string' 
                  ? JSON.parse(row.matched_skills) 
                  : row.matched_skills;
              } catch (e) {
                console.warn('Failed to parse matched_skills:', row.matched_skills);
                matchedSkills = null;
              }
            }
            
            if (row.matched_categories) {
              try {
                matchedCategories = typeof row.matched_categories === 'string'
                  ? JSON.parse(row.matched_categories)
                  : row.matched_categories;
              } catch (e) {
                console.warn('Failed to parse matched_categories:', row.matched_categories);
                matchedCategories = null;
              }
            }
            
            return {
              ...row,
              matched_skills: matchedSkills,
              matched_categories: matchedCategories
            };
          });
          resolve(parsedResults);
        }
      });
    });
  }
}

export default InternshipMatch;
