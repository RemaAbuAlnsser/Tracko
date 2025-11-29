import db from '../config/database.js';

console.log('🔧 Removing columns from weekly_reports table...\n');

// Step 1: Drop foreign key for trainer_id
console.log('Step 1: Dropping foreign key for trainer_id...');

const dropFKQuery = `ALTER TABLE weekly_reports DROP FOREIGN KEY fk_weekly_reports_trainer`;

db.query(dropFKQuery, (err) => {
  if (err && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
    console.error('❌ Error dropping foreign key:', err);
    process.exit(1);
  }
  
  if (err && err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
    console.log('ℹ️  Foreign key fk_weekly_reports_trainer does not exist\n');
  } else {
    console.log('✅ Foreign key fk_weekly_reports_trainer dropped\n');
  }
  
  dropColumns();
});

function dropColumns() {
  console.log('Step 2: Dropping columns...');
  
  const dropColumnsQuery = `
    ALTER TABLE weekly_reports 
    DROP COLUMN trainer_id,
    DROP COLUMN trainer_comment,
    DROP COLUMN university_reviewed_at
  `;
  
  db.query(dropColumnsQuery, (err) => {
    if (err) {
      console.error('❌ Error dropping columns:', err);
      process.exit(1);
    }
    
    console.log('✅ Columns dropped successfully:');
    console.log('   - trainer_id');
    console.log('   - trainer_comment');
    console.log('   - university_reviewed_at');
    console.log('\n✅ All changes applied successfully!');
    console.log('ℹ️  Note: reviewed_at column will be used for university reviews');
    
    db.end();
    process.exit(0);
  });
}
