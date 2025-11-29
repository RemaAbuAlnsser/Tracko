# Task Submission System - User Guide

## Overview
A complete task submission and review system has been implemented for students and trainers with notifications.

## Features

### For Students:
1. Submit solutions via:
   - File upload (PDF, DOC, DOCX, ZIP, RAR)
   - Text submission
   - Link (GitHub, Google Drive, etc.)

2. Track submission status:
   - Pending Review
   - Approved
   - Needs Revision

3. Receive notifications when trainer reviews submission

### For Trainers:
1. View Tasks button for each student in My Students section
2. Review submissions:
   - View solution (file, text, or link)
   - Approve or request revision
   - Add comments for student

3. Receive notifications when students submit solutions

## Files Added/Modified

### Backend:
- backend/models/TaskSubmission.js
- backend/routes/taskSubmission.js
- backend/routes/upload.js (added file upload endpoint)
- backend/server.js (added task-submissions route)

### Frontend:
- frontend/src/pages/StudentDashboard.js (added solution upload)
- frontend/src/pages/TrainerDashboard.js (added View Tasks button)
- frontend/src/pages/TrainerSubmissionsView.js (new review page)
- frontend/src/App.js (added new route)

## API Endpoints

POST /api/task-submissions/submit - Submit a task solution
GET /api/task-submissions/trainer/:trainerId - Get all submissions for trainer
GET /api/task-submissions/student/:studentId/trainer/:trainerId - Get submissions by student
GET /api/task-submissions/:id - Get submission by ID
PUT /api/task-submissions/:id/review - Review submission (approve/reject)
POST /api/upload/file - Upload solution file

## How to Use

### Student Workflow:
1. Go to Training Plans section
2. Click View Details on any task
3. Upload solution using one of three methods
4. Click Submit Solution
5. Wait for trainer review and notification

### Trainer Workflow:
1. Go to My Students section
2. Click View Tasks button for any student
3. Click Review on any submission
4. View the solution
5. Select Approve or Request Revision
6. Add optional comment
7. Click Submit Review
8. Student receives notification automatically

## Database Table

Task_Submissions table stores all submissions with:
- student_id, trainer_id, week_id, plan_id
- submission_file, submission_text, submission_link
- status (pending, approved, rejected)
- trainer_comment
- submitted_at, reviewed_at timestamps
