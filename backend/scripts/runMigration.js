import db from "../config/database.js";

console.log("🔧 Running database migration...");

const migrations = [
  // Add week_number column
  `ALTER TABLE Task_Submissions ADD COLUMN week_number INT NULL AFTER task_title`,
  
  // Add task_type column
  `ALTER TABLE Task_Submissions ADD COLUMN task_type ENUM('task', 'weekly_report') DEFAULT 'task' AFTER week_number`,
  
  // Modify columns to allow NULL
  `ALTER TABLE Task_Submissions MODIFY COLUMN trainer_id INT NULL`,
  `ALTER TABLE Task_Submissions MODIFY COLUMN week_id INT NULL`,
  `ALTER TABLE Task_Submissions MODIFY COLUMN plan_id INT NULL`,
  `ALTER TABLE Task_Submissions MODIFY COLUMN task_title VARCHAR(255) NULL`
];

async function runMigrations() {
  for (const migration of migrations) {
    try {
      await new Promise((resolve, reject) => {
        db.query(migration, (err, result) => {
          if (err) {
            // Ignore "duplicate column" errors
            if (err.errno === 1060) {
              console.log("⚠️ Column already exists, skipping...");
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log("✅ Migration executed successfully");
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error("❌ Migration error:", error.message);
    }
  }
  
  // Add indexes
  try {
    await new Promise((resolve, reject) => {
      db.query("CREATE INDEX idx_task_type ON Task_Submissions(task_type)", (err) => {
        if (err && err.errno !== 1061) reject(err); // Ignore duplicate key errors
        else resolve();
      });
    });
    console.log("✅ Added index for task_type");
  } catch (err) {
    console.log("⚠️ Index already exists");
  }
  
  try {
    await new Promise((resolve, reject) => {
      db.query("CREATE INDEX idx_week_number ON Task_Submissions(week_number)", (err) => {
        if (err && err.errno !== 1061) reject(err);
        else resolve();
      });
    });
    console.log("✅ Added index for week_number");
  } catch (err) {
    console.log("⚠️ Index already exists");
  }
  
  console.log("🎉 Migration completed!");
  process.exit(0);
}

runMigrations();
