import db from '../config/database.js';

async function updateEventsTable() {
  try {
    console.log('🔧 Updating Events table...');
    
    // Drop old Events table if exists
    const dropEventsQuery = 'DROP TABLE IF EXISTS Event_Students';
    db.query(dropEventsQuery, (err) => {
      if (err) {
        console.error('❌ Error dropping Event_Students:', err);
        process.exit(1);
      }
      
      console.log('✅ Event_Students table dropped');
      
      const dropQuery = 'DROP TABLE IF EXISTS Events';
      db.query(dropQuery, (err) => {
        if (err) {
          console.error('❌ Error dropping Events table:', err);
          process.exit(1);
        }
        
        console.log('✅ Events table dropped');
        
        // Create new Events table with internship_id
        const createEventsQuery = `
          CREATE TABLE Events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            trainer_id INT NOT NULL,
            internship_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_type ENUM('training', 'meeting', 'review', 'workshop', 'other') DEFAULT 'training',
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
            FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE
          )
        `;
        
        db.query(createEventsQuery, (err) => {
          if (err) {
            console.error('❌ Error creating Events table:', err);
            process.exit(1);
          }
          
          console.log('✅ Events table created successfully');
          
          // Create Event_Students table
          const createEventStudentsQuery = `
            CREATE TABLE Event_Students (
              id INT PRIMARY KEY AUTO_INCREMENT,
              event_id INT NOT NULL,
              student_id INT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
              FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
              UNIQUE KEY unique_event_student (event_id, student_id)
            )
          `;
          
          db.query(createEventStudentsQuery, (err) => {
            if (err) {
              console.error('❌ Error creating Event_Students table:', err);
              process.exit(1);
            }
            
            console.log('✅ Event_Students table created successfully');
            console.log('🎉 All tables updated successfully!');
            process.exit(0);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateEventsTable();
