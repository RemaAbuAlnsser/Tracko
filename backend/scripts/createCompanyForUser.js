import db from "../config/database.js";

// Get email from command line
const email = process.argv[2];
const name = process.argv[3] || "Company Name";

if (!email) {
  console.log("Usage: node createCompanyForUser.js <email> <name>");
  console.log("Example: node createCompanyForUser.js asal@gmail.cop 'Asal Company'");
  process.exit(1);
}

console.log(`🏢 Creating company record for: ${email}\n`);

const query = `
  INSERT INTO Company (name, email, status) 
  VALUES (?, ?, 'pending')
`;

db.query(query, [name, email], (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log("ℹ️ Company already exists for this email");
    } else {
      console.error("❌ Error creating company:", err);
    }
    process.exit(1);
  }
  
  console.log("✅ Company created successfully!");
  console.log(`   Company ID: ${result.insertId}`);
  console.log(`   Name: ${name}`);
  console.log(`   Email: ${email}`);
  
  process.exit(0);
});
