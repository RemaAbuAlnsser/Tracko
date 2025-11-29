import Event from '../models/Event.js';

async function createEventsTable() {
  try {
    console.log('📅 Creating Events table...');
    await Event.createTable();
    console.log('✅ Events table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Events table:', error);
    process.exit(1);
  }
}

createEventsTable();
