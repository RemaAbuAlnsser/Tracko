import express from "express";
import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import db from "../config/database.js";

const router = express.Router();

// Create a new event
router.post("/", async (req, res) => {
  try {
    const { trainer_id, internship_id, student_ids, title, description, event_type, start_time, end_time } = req.body;

    // Validate required fields
    if (!trainer_id || !title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: trainer_id, title, start_time, end_time"
      });
    }

    console.log('📅 Creating new event:', { trainer_id, internship_id, student_ids, title, event_type, start_time });

    // Create the event
    const event = await Event.create({
      trainer_id,
      internship_id: internship_id || null,
      student_ids: student_ids || [],
      title,
      description,
      event_type: event_type || 'training',
      start_time,
      end_time
    });

    console.log('✅ Event created successfully:', event.id);

    // Get trainer info for notification
    const trainerQuery = `
      SELECT u.full_name, u.id as user_id
      FROM Trainers t
      INNER JOIN Users u ON t.user_id = u.id
      WHERE t.id = ?
    `;

    db.query(trainerQuery, [trainer_id], async (err, trainerResults) => {
      if (err) {
        console.error('Error fetching trainer info:', err);
      } else if (trainerResults.length > 0) {
        const trainer = trainerResults[0];
        const eventDate = new Date(start_time).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Send notifications to selected students
        if (student_ids && student_ids.length > 0) {
          try {
            // Get user_ids for selected students
            const studentQuery = `SELECT id, user_id FROM Students WHERE id IN (?)`;
            db.query(studentQuery, [student_ids], async (err, studentResults) => {
              if (!err && studentResults.length > 0) {
                console.log(`📢 Sending notifications to ${studentResults.length} selected students`);
                
                for (const student of studentResults) {
                  try {
                    await Notification.create({
                      user_id: student.user_id,
                      title: 'New Event Scheduled',
                      message: `${trainer.full_name} has scheduled a new ${event_type || 'training'} event: "${title}" on ${eventDate}`,
                      type: 'event'
                    });
                  } catch (notifError) {
                    console.error(`Error sending notification to student ${student.id}:`, notifError);
                  }
                }
                
                console.log(`✅ Notifications sent to ${studentResults.length} students`);
              }
            });
          } catch (notifError) {
            console.error('Error sending notifications to students:', notifError);
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event
    });

  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all events for a trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const events = await Event.getByTrainerId(trainerId);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error("Error fetching trainer events:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get upcoming events for a trainer
router.get("/trainer/:trainerId/upcoming", async (req, res) => {
  try {
    const { trainerId } = req.params;
    console.log(`📅 Getting upcoming events for trainer ${trainerId}...`);
    const events = await Event.getUpcomingByTrainerId(trainerId);
    console.log(`✅ Found ${events.length} upcoming events:`, events);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get all events for a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const events = await Event.getByStudentId(studentId);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error("Error fetching student events:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get upcoming events for a student
router.get("/student/:studentId/upcoming", async (req, res) => {
  try {
    const { studentId } = req.params;
    const events = await Event.getUpcomingByStudentId(studentId);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Get event by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.getById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Update event
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_type, start_time, end_time, status } = req.body;

    // Check if event exists
    const existingEvent = await Event.getById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    await Event.update(id, {
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      event_type: event_type || existingEvent.event_type,
      start_time: start_time || existingEvent.start_time,
      end_time: end_time || existingEvent.end_time,
      status: status || existingEvent.status
    });

    res.json({
      success: true,
      message: "Event updated successfully"
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingEvent = await Event.getById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    await Event.delete(id);

    res.json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
