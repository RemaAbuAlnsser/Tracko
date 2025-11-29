import db from "../config/database.js";

const dropAndRecreatePartnershipsTable = () => {
  // First, drop the existing table
  const dropTableQuery = "DROP TABLE IF EXISTS University_Company_Partnerships";
  
  db.query(dropTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error dropping University_Company_Partnerships table:", err);
      process.exit(1);
    }
    console.log("✅ Old University_Company_Partnerships table dropped successfully!");
    
    // Now create the new table without created_at, updated_at
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS University_Company_Partnerships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        university_id INT NOT NULL,
        company_id INT NOT NULL,
        agreement_date DATE,
        agreement_end_date DATE,
        agreement_duration INT,
        status ENUM('active', 'expired', 'pending', 'terminated') DEFAULT 'pending',
        contact_person_university VARCHAR(255),
        contact_person_company VARCHAR(255),
        terms_and_conditions TEXT,
        FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
        UNIQUE KEY unique_partnership (university_id, company_id)
      )
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error creating University_Company_Partnerships table:", err);
        process.exit(1);
      }
      console.log("✅ University_Company_Partnerships table created successfully!");
      console.log("\nNew Table Structure:");
      console.log("====================");
      console.log("- id (INT, PRIMARY KEY, AUTO_INCREMENT)");
      console.log("- university_id (INT, FOREIGN KEY -> Universities.id)");
      console.log("- company_id (INT, FOREIGN KEY -> Company.id)");
      console.log("- agreement_date (DATE)");
      console.log("- agreement_end_date (DATE)");
      console.log("- agreement_duration (INT) - مدة الاتفاقية بالأشهر");
      console.log("- status (ENUM: 'active', 'expired', 'pending', 'terminated')");
      console.log("- contact_person_university (VARCHAR(255))");
      console.log("- contact_person_company (VARCHAR(255))");
      console.log("- terms_and_conditions (TEXT)");
      console.log("\n✅ Foreign Keys:");
      console.log("   - university_id -> Universities(id) with CASCADE delete");
      console.log("   - company_id -> Company(id) with CASCADE delete");
      console.log("\n✅ Unique Constraint: (university_id, company_id)");
      console.log("\n✅ Removed columns: created_at, updated_at");
      process.exit(0);
    });
  });
};

dropAndRecreatePartnershipsTable();
