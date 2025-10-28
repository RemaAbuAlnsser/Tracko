import db from "../config/database.js";

async function migrateWeeklyReports() {
  console.log("🔧 Starting Weekly_Reports table migration...");

  const migrations = [
    {
      name: "Add trainer_id column",
      sql: "ALTER TABLE Weekly_Reports ADD COLUMN trainer_id INT NULL AFTER student_id"
    },
    {
      name: "Add plan_id column",
      sql: "ALTER TABLE Weekly_Reports ADD COLUMN plan_id INT NULL AFTER trainer_id"
    },
    {
      name: "Add trainer foreign key",
      sql: "ALTER TABLE Weekly_Reports ADD CONSTRAINT fk_weekly_reports_trainer FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL"
    },
    {
      name: "Add plan foreign key",
      sql: "ALTER TABLE Weekly_Reports ADD CONSTRAINT fk_weekly_reports_plan FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE SET NULL"
    },
    {
      name: "Add trainer_id index",
      sql: "CREATE INDEX idx_weekly_reports_trainer_id ON Weekly_Reports(trainer_id)"
    },
    {
      name: "Add plan_id index",
      sql: "CREATE INDEX idx_weekly_reports_plan_id ON Weekly_Reports(plan_id)"
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

migrateWeeklyReports().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
