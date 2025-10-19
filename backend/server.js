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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT =  5050;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
