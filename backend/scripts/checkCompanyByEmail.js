import db from "../config/database.js";

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("Usage: node checkCompanyByEmail.js <email>");
  console.log("Example: node checkCompanyByEmail.js asal@gmail.cop");
  process.exit(1);
}

console.log(`🔍 Checking company with email: ${email}\n`);

const query = "SELECT * FROM Company WHERE email = ?";

db.query(query, [email], (err, results) => {
  if (err) {
    console.error("❌ Error querying database:", err);
    process.exit(1);
  }
  
  if (results.length > 0) {
    const company = results[0];
    console.log("✅ Company found!\n");
    console.log("Company Details:");
    console.log("================");
    console.log(`ID: ${company.id}`);
    console.log(`Name: ${company.name}`);
    console.log(`Email: ${company.email}`);
    console.log(`Phone: ${company.phone || 'N/A'}`);
    console.log(`Industry: ${company.industry || 'N/A'}`);
    console.log(`Address: ${company.address || 'N/A'}`);
    console.log(`Website: ${company.website || 'N/A'}`);
    console.log(`Description: ${company.description || 'N/A'}`);
    console.log(`Logo: ${company.logo || 'N/A'}`);
    console.log(`Status: ${company.status}`);
    console.log(`Created: ${company.created_at}`);
    console.log(`Updated: ${company.updated_at}`);
  } else {
    console.log("❌ No company found with this email");
    console.log("\n💡 This means the company record was not created during signup.");
    console.log("   The company should be created automatically when a user signs up with user_type='company'");
  }
  
  process.exit(0);
});
