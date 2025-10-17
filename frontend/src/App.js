import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import TrainerProfile from './pages/TrainerProfile';
import TrainerDashboard from './pages/TrainerDashboard';
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
      <Route path="/trainer-profile" element={<TrainerProfile />} />
      <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
    </Routes>
  );
}

export default App;
