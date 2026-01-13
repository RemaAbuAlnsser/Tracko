import db from "../config/database.js";
import bcrypt from "bcrypt";

async function createAdmin() {
  try {
    console.log("🔧 Creating admin user...");
    
    const adminEmail = "admin@admin.com";
    const adminPassword = "3231admin";
    const adminName = "Admin";
    
    // Check if admin already exists
    const checkQuery = "SELECT * FROM Users WHERE email = ?";
    
    db.query(checkQuery, [adminEmail], async (err, results) => {
      if (err) {
        console.error("❌ Error checking for existing admin:", err);
        process.exit(1);
      }
      
      if (results.length > 0) {
        console.log("ℹ️ Admin user already exists");
        process.exit(0);
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      
      // Insert admin user
      const insertQuery = `
        INSERT INTO Users (full_name, email, password, user_type) 
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [adminName, adminEmail, hashedPassword, 'admin'], (err, result) => {
        if (err) {
          console.error("❌ Error creating admin user:", err);
          process.exit(1);
        }
        
        console.log("✅ Admin user created successfully!");
        console.log("📧 Email: admin@admin.com");
        console.log("🔑 Password: 3231admin");
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdmin();
