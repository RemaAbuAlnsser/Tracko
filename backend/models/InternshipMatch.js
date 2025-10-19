import db from "../config/database.js";

class InternshipMatch {
  // Create or update match
  static upsert(matchData) {
    const { 
      student_id,
      internship_id,
      match_percentage,
      matched_skills = null,
      matched_categories = null
    } = matchData;
    
    const query = `
      INSERT INTO Internship_Matches 
      (student_id, internship_id, match_percentage, matched_skills, matched_categories) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        match_percentage = VALUES(match_percentage),
        matched_skills = VALUES(matched_skills),
        matched_categories = VALUES(matched_categories),
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
          categoriesJson
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
}

export default InternshipMatch;
