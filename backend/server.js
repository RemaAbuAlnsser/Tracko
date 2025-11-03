import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./config/database.js";
import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/company.js";
import uploadRoutes from "./routes/upload.js";
import internshipRoutes from "./routes/internship.js";
import universityRoutes from "./routes/university.js";
import partnershipRoutes from "./routes/partnership.js";
import trainerRoutes from "./routes/trainer.js";
import studentRoutes from "./routes/student.js";
import cvRoutes from "./routes/cv.js";
import matchingRoutes from "./routes/matching.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import internshipPlanRoutes from "./routes/internshipPlan.js";
import reportsRoutes from "./routes/reports.js";
import taskSubmissionRoutes from "./routes/taskSubmission.js";
import finalReportRoutes from "./routes/finalReport.js";
import weeklyReportRoutes from "./routes/weeklyReport.js";
import eventRoutes from "./routes/events.js";
import videoCallRoutes from "./routes/videoCall.js";
import interviewRoutes from "./routes/interview.js";
import WeeklyReport from "./models/WeeklyReport.js";
import Event from "./models/Event.js";
import Interview from "./models/Interview.js";
import { sendInterviewReminders } from "./jobs/interviewReminders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API routes (must come before static files)
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/plans", internshipPlanRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/task-submissions", taskSubmissionRoutes);
app.use("/api/final-reports", finalReportRoutes);
app.use("/api/weekly-reports", weeklyReportRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/video-call", videoCallRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server running on port " + PORT,
    database: "✅ Connected to MySQL Database!"
  });
});

// Serve static files from React build (commented out for development)
// Uncomment these lines when deploying to production
/*
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Serve React app for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});
*/

// Initialize database tables
async function initializeDatabase() {
  try {
    await WeeklyReport.createTable();
    console.log("✅ Weekly_Reports table initialized");
    
    await Interview.createTable();
    console.log("✅ Interviews table initialized");
    
    // Note: Events table should be created manually using scripts/updateEventsTable.js
    // await Event.createTable();
    // console.log("✅ Events table initialized");
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
  
  // Schedule daily interview reminders at 9:00 AM
  const scheduleReminders = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    // If it's past 9 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilRun = scheduledTime - now;
    
    console.log(`⏰ Interview reminders scheduled for ${scheduledTime.toLocaleString()}`);
    
    setTimeout(async () => {
      await sendInterviewReminders();
      // Reschedule for next day
      setInterval(sendInterviewReminders, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilRun);
  };
  
  scheduleReminders();
  
  // Optional: Run reminders immediately on server start (for testing)
  // await sendInterviewReminders();
});
