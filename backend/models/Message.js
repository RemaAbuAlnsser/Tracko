import db from '../config/database.js';

class Message {
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sender_receiver (sender_id, receiver_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    try {
      await db.execute(createTableQuery);
      console.log('✅ Messages table ready');
    } catch (error) {
      console.error('❌ Error creating Messages table:', error);
      throw error;
    }
  }

  static async insertSampleData() {
    try {
      // Check if we already have sample data
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM messages');
      if (rows[0].count > 0) {
        console.log('📨 Messages table already has data, skipping sample data insertion');
        return;
      }

      // Insert some sample messages between student (user_id=7) and trainer (user_id=5 and 10)
      const sampleMessages = [
        {
          sender_id: 5, // Trainer
          receiver_id: 7, // Student
          message: 'Hello! How is your internship progress going?',
          created_at: '2024-11-20 10:00:00'
        },
        {
          sender_id: 7, // Student
          receiver_id: 5, // Trainer
          message: 'Hi! It\'s going well, thank you for asking.',
          created_at: '2024-11-20 10:05:00'
        },
        {
          sender_id: 5, // Trainer
          receiver_id: 7, // Student
          message: 'Great! Do you have any questions about your current tasks?',
          created_at: '2024-11-20 10:10:00'
        },
        {
          sender_id: 7, // Student
          receiver_id: 5, // Trainer
          message: 'Yes, I have a question about the database design task.',
          created_at: '2024-11-20 10:15:00'
        },
        {
          sender_id: 10, // Another Trainer
          receiver_id: 7, // Student
          message: 'Hi! I wanted to check on your weekly report submission.',
          created_at: '2024-11-20 11:00:00'
        },
        {
          sender_id: 7, // Student
          receiver_id: 10, // Trainer
          message: 'Hello! I will submit it by the end of today.',
          created_at: '2024-11-20 11:05:00'
        }
      ];

      for (const msg of sampleMessages) {
        await db.execute(
          'INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, ?)',
          [msg.sender_id, msg.receiver_id, msg.message, msg.created_at]
        );
      }

      console.log('✅ Sample messages inserted successfully');
    } catch (error) {
      console.error('❌ Error inserting sample messages:', error);
    }
  }
}

export default Message;
