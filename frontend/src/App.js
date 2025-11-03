import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InternshipDetails from './pages/InternshipDetails';
import TrainerSubmissionsView from './pages/TrainerSubmissionsView';
import VideoCallPage from './pages/VideoCallPage';
import './styles/App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/company-dashboard" element={<CompanyDashboard />} />
      <Route path="/university-dashboard" element={<UniversityDashboard />} />
      <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
      <Route path="/trainer/submissions/:studentId" element={<TrainerSubmissionsView />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/internship-details/:id" element={<InternshipDetails />} />
      <Route path="/video-call" element={<VideoCallPage />} />
      <Route path="/video-call/:roomId" element={<VideoCallPage />} />
    </Routes>
  );
}

export default App;
