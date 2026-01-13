import db from "../config/database.js";

console.log("🔍 Checking Company table...\n");

const query = "SELECT * FROM Company";

db.query(query, (err, results) => {
  if (err) {
    console.error("❌ Error querying database:", err);
    process.exit(1);
  }
  
  console.log(`📊 Total companies in database: ${results.length}\n`);
  
  if (results.length > 0) {
    console.log("Companies:");
    results.forEach((company, index) => {
      console.log(`\n${index + 1}. Company ID: ${company.id}`);
      console.log(`   Name: ${company.name}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Phone: ${company.phone || 'N/A'}`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Status: ${company.status}`);
      console.log(`   Created: ${company.created_at}`);
    });
  } else {
    console.log("⚠️  No companies found in database");
  }
  
  process.exit(0);
});
