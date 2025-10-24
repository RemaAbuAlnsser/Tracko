import db from "../config/database.js";

async function deleteAllPlans() {
  try {
    console.log("🗑️  Deleting all training plans...");
    
    // First, delete all weeks (foreign key constraint)
    const deleteWeeksQuery = "DELETE FROM Plan_Weeks";
    
    db.query(deleteWeeksQuery, (err, result) => {
      if (err) {
        console.error("❌ Error deleting weeks:", err);
        process.exit(1);
      }
      
      console.log(`✅ Deleted ${result.affectedRows} weeks`);
      
      // Then, delete all plans
      const deletePlansQuery = "DELETE FROM Internship_Plans";
      
      db.query(deletePlansQuery, (err, result) => {
        if (err) {
          console.error("❌ Error deleting plans:", err);
          process.exit(1);
        }
        
        console.log(`✅ Deleted ${result.affectedRows} plans`);
        console.log("🎉 All training plans have been deleted successfully!");
        
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

deleteAllPlans();
