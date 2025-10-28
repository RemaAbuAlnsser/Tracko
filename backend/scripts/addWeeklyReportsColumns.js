import db from "../config/database.js";

async function addWeeklyReportsColumns() {
  console.log("🔧 Adding missing columns to Weekly_Reports table...");

  const migrations = [
    {
      name: "Add status column",
      sql: "ALTER TABLE Weekly_Reports ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER report_file"
    },
    {
      name: "Add trainer_comment column",
      sql: "ALTER TABLE Weekly_Reports ADD COLUMN trainer_comment TEXT AFTER status"
    },
    {
      name: "Add reviewed_at column",
      sql: "ALTER TABLE Weekly_Reports ADD COLUMN reviewed_at TIMESTAMP NULL AFTER trainer_comment"
    },
    {
      name: "Add status index",
      sql: "CREATE INDEX idx_weekly_reports_status ON Weekly_Reports(status)"
    }
  ];

  for (const migration of migrations) {
    try {
      await new Promise((resolve, reject) => {
        db.query(migration.sql, (err) => {
          if (err) {
            // Ignore "Duplicate column" or "Duplicate key" errors
            if (err.errno === 1060 || err.errno === 1061 || err.errno === 1826) {
              console.log(`⚠️  ${migration.name}: Already exists, skipping...`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`✅ ${migration.name}: Success`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`❌ ${migration.name}: Failed`);
      console.error(error.message);
      // Continue with next migration
    }
  }

  console.log("✅ Migration completed!");
  process.exit(0);
}

addWeeklyReportsColumns().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
