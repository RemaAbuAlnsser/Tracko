import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TrainerDashboard.css';

function TrainerDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [trainerData, setTrainerData] = useState({
    specialization: '',
    experience_years: 0,
    bio: '',
    linkedin_url: '',
    github_url: '',
    hourly_rate: 0,
    max_trainees: 5,
    status: 'active',
    profile_image: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [trainerId, setTrainerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [messages, setMessages] = useState([]);
  const [internships, setInternships] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newReport, setNewReport] = useState({
    student_id: '',
    report_type: 'weekly',
    performance_rating: 5,
    attendance: true,
    technical_skills: 5,
    communication_skills: 5,
    problem_solving: 5,
    teamwork: 5,
    comments: ''
  });
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    event_type: 'training',
    start_time: '',
    end_time: '',
    student_id: ''
  });
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    internship_id: '',
    title: '',
    description: '',
    duration_weeks: 4,
    start_date: '',
    end_date: '',
    status: 'draft'
  });
  const [planWeeks, setPlanWeeks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a trainer or company (trainer)
    if (parsedUser.user_type !== 'company' && parsedUser.user_type !== 'trainer') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    
    // Load trainer data from database
    loadTrainerData(parsedUser.id);
  }, [navigate]);

  const loadTrainerData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/trainers/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Loaded trainer data:', data);
        if (data.success && data.trainer) {
          setTrainerId(data.trainer.id);
          setTrainerData({
            specialization: data.trainer.specialization || '',
            experience_years: data.trainer.experience_years || 0,
            bio: data.trainer.bio || '',
            linkedin_url: data.trainer.linkedin_url || '',
            github_url: data.trainer.github_url || '',
            hourly_rate: data.trainer.hourly_rate || 0,
            max_trainees: data.trainer.max_trainees || 5,
            status: data.trainer.status || 'active',
            profile_image: data.trainer.profile_image || ''
          });
          if (data.trainer.profile_image) {
            setImagePreview(`http://localhost:5050${data.trainer.profile_image}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading trainer data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setTrainerData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const formData = new FormData();
    formData.append('logo', selectedImage);

    try {
      const response = await fetch('http://localhost:5050/api/upload/logo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        return data.logoPath;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const loadStudents = async () => {
    if (!trainerId) return;
    try {
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}/students`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5050/api/notifications/user/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadReports = async () => {
    if (!trainerId) return;
    try {
      const response = await fetch(`http://localhost:5050/api/reports/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadSchedules = async () => {
    if (!trainerId) return;
    try {
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}/schedules`);
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadInternships = async () => {
    if (!trainerId) return;
    try {
      console.log('📋 Loading internships for trainer:', trainerId);
      const response = await fetch(`http://localhost:5050/api/internships/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ Loaded internships:', data.internships);
        setInternships(data.internships || []);
      }
    } catch (error) {
      console.error('Error loading internships:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!trainerId) {
      setMessage({ type: 'error', text: 'Trainer profile not found' });
      return;
    }

    // Validation
    if (trainerData.hourly_rate < 0) {
      setMessage({ type: 'error', text: 'Hourly rate cannot be negative' });
      return;
    }

    if (trainerData.max_trainees < 1) {
      setMessage({ type: 'error', text: 'Maximum trainees must be at least 1' });
      return;
    }

    if (trainerData.experience_years < 0) {
      setMessage({ type: 'error', text: 'Experience years cannot be negative' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('💾 Saving trainer data:', trainerData);
      
      // Upload image if selected
      let imagePath = trainerData.profile_image;
      if (selectedImage) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) {
          imagePath = uploadedPath;
        }
      }
      
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...trainerData,
          profile_image: imagePath
        })
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setSelectedImage(null);
        // Reload trainer data
        await loadTrainerData(user.id);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!trainerId || !newReport.student_id) {
      setMessage({ type: 'error', text: 'Please select a student' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5050/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReport, trainer_id: trainerId })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Report submitted successfully! Student has been notified.' });
        setNewReport({
          student_id: '',
          report_type: 'weekly',
          performance_rating: 5,
          attendance: true,
          technical_skills: 5,
          communication_skills: 5,
          problem_solving: 5,
          teamwork: 5,
          comments: ''
        });
        loadReports();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!trainerId) return;

    try {
      const response = await fetch('http://localhost:5050/api/trainers/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSchedule, trainer_id: trainerId })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Schedule added successfully!' });
        setNewSchedule({
          title: '',
          description: '',
          event_type: 'training',
          start_time: '',
          end_time: '',
          student_id: ''
        });
        loadSchedules();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add schedule' });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5050/api/messages/conversations/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/messages/conversation/${conversationId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setSelectedConversation(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const response = await fetch('http://localhost:5050/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          conversation_id: selectedConversation,
          message: newMessage
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        loadMessages(selectedConversation);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send message' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const loadPlans = async () => {
    if (!trainerId) return;
    try {
      console.log('📋 Loading plans for trainer:', trainerId);
      const response = await fetch(`http://localhost:5050/api/plans/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ Loaded plans:', data.plans);
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadPlanDetails = async (planId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedPlan(data.plan);
        setPlanWeeks(data.plan.weeks || []);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!trainerId || !newPlan.internship_id || !newPlan.title || !newPlan.duration_weeks) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5050/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          trainer_id: trainerId,
          weeks: planWeeks
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Plan created successfully! Students have been notified.' });
        setNewPlan({
          internship_id: '',
          title: '',
          description: '',
          duration_weeks: 4,
          start_date: '',
          end_date: '',
          status: 'draft'
        });
        setPlanWeeks([]);
        loadPlans();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create plan' });
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleAddWeek = () => {
    const weekNumber = planWeeks.length + 1;
    setPlanWeeks([...planWeeks, {
      week_number: weekNumber,
      title: `Week ${weekNumber}`,
      description: '',
      objectives: '',
      tasks: '',
      resources: '',
      deliverables: ''
    }]);
  };

  const handleUpdateWeek = (index, field, value) => {
    const updatedWeeks = [...planWeeks];
    updatedWeeks[index][field] = value;
    setPlanWeeks(updatedWeeks);
  };

  const handleRemoveWeek = (index) => {
    const updatedWeeks = planWeeks.filter((_, i) => i !== index);
    // Renumber weeks
    updatedWeeks.forEach((week, i) => {
      week.week_number = i + 1;
    });
    setPlanWeeks(updatedWeeks);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="trainer-dashboard">
      {/* Sidebar */}
      <aside className="trainer-sidebar">
        {/* Trainer Profile Section */}
        <div className="trainer-profile-section">
          <div className="trainer-avatar">
            {imagePreview ? (
              <img src={imagePreview} alt={user.full_name} className="avatar-image" />
            ) : (
              <span className="avatar-initials">{getInitials(user.full_name)}</span>
            )}
          </div>
          <div className="trainer-info">
            <h3>{user.full_name}</h3>
            <p>Trainer</p>
            <div className="trainer-badge">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Trainer
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>

          <button 
            className={`nav-item ${activeMenu === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('profile')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile & Edit
          </button>

          <button 
            className={`nav-item ${activeMenu === 'internships' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('internships'); loadInternships(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            My Internships
          </button>

          <button 
            className={`nav-item ${activeMenu === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('students'); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            My Students
          </button>

          <button 
            className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('reports'); loadReports(); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </button>

          <button 
            className={`nav-item ${activeMenu === 'schedule' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('schedule'); loadSchedules(); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </button>

          <button 
            className={`nav-item ${activeMenu === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('notifications'); loadNotifications(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'messages' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('messages'); loadConversations(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </button>

          <button 
            className={`nav-item ${activeMenu === 'plans' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('plans'); loadPlans(); loadInternships(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Training Plans
          </button>
        </nav>

        {/* Logout Section */}
        <div className="logout-section">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="trainer-main-content">
        {activeMenu === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Welcome back, {user.full_name}!</h1>
              <p>Manage your trainer profile and track your trainees</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{trainerData.max_trainees || 0}</h3>
                  <p>Max Trainees</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{trainerData.experience_years || 0}</h3>
                  <p>Years Experience</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>${trainerData.hourly_rate || 0}</h3>
                  <p>Hourly Rate</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{trainerData.status}</h3>
                  <p>Status</p>
                </div>
              </div>
            </div>

            <div className="quick-info-card">
              <h3>Your Specialization</h3>
              <p>{trainerData.specialization || 'Not set yet - Click Profile & Edit to add your specialization'}</p>
              
              {trainerData.bio && (
                <>
                  <h3 style={{ marginTop: '1.5rem' }}>About You</h3>
                  <p>{trainerData.bio}</p>
                </>
              )}
              
              {(trainerData.linkedin_url || trainerData.github_url) && (
                <>
                  <h3 style={{ marginTop: '1.5rem' }}>Social Links</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {trainerData.linkedin_url && (
                      <a 
                        href={trainerData.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1e88e5', textDecoration: 'none', fontWeight: '500' }}
                      >
                        🔗 LinkedIn
                      </a>
                    )}
                    {trainerData.github_url && (
                      <a 
                        href={trainerData.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1e88e5', textDecoration: 'none', fontWeight: '500' }}
                      >
                        💻 GitHub
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {activeMenu === 'profile' && (
          <>
            <div className="dashboard-header">
              <h1>Trainer Profile & Edit</h1>
              <p>Update your professional information</p>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Profile Image Section */}
            <div className="profile-image-section">
              <div className="image-container">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="profile-image" />
                ) : (
                  <div className="no-image">
                    <span>No Profile Image</span>
                  </div>
                )}
              </div>
              <div className="image-upload">
                <label htmlFor="profile-image" className="upload-label">
                  Choose Profile Image
                </label>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {selectedImage && (
                  <span className="file-name">{selectedImage.name}</span>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="profile-forms-container">
              <div className="profile-form-card">
                <h3>Professional Information</h3>
                
                <div className="form-group">
                  <label>Specialization</label>
                  <input 
                    type="text" 
                    name="specialization"
                    value={trainerData.specialization} 
                    onChange={handleInputChange}
                    placeholder="e.g., Full Stack Development, Data Science"
                  />
                </div>

                <div className="form-group">
                  <label>Years of Experience</label>
                  <input 
                    type="number" 
                    name="experience_years"
                    value={trainerData.experience_years} 
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input 
                    type="number" 
                    name="hourly_rate"
                    value={trainerData.hourly_rate} 
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Trainees</label>
                  <input 
                    type="number" 
                    name="max_trainees"
                    value={trainerData.max_trainees} 
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="profile-form-card">
                <h3>Contact & Social Links</h3>
                
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={trainerData.linkedin_url} 
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {trainerData.linkedin_url && (
                    <a 
                      href={trainerData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="preview-link"
                    >
                      View Profile →
                    </a>
                  )}
                </div>

                <div className="form-group">
                  <label>GitHub URL</label>
                  <input 
                    type="url" 
                    name="github_url"
                    value={trainerData.github_url} 
                    onChange={handleInputChange}
                    placeholder="https://github.com/yourusername"
                  />
                  {trainerData.github_url && (
                    <a 
                      href={trainerData.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="preview-link"
                    >
                      View Profile →
                    </a>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    name="status"
                    value={trainerData.status} 
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio Section - Full Width */}
            <div className="profile-form-card full-width">
              <h3>About Me</h3>
              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  rows="6" 
                  name="bio"
                  value={trainerData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself, your experience, and what you can offer to trainees..."
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-secondary" 
                  onClick={() => setActiveMenu('dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Students Section */}
        {activeMenu === 'students' && (
          <>
            <div className="dashboard-header">
              <h1>My Students</h1>
              <p>View and manage your trainees</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="table-section">
              <h2>Accepted Students ({students.length})</h2>
              {students.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3>No Accepted Students Yet</h3>
                  <p>Students who are accepted in your internships will appear here.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Internship</th>
                      <th>Company</th>
                      <th>University</th>
                      <th>Major</th>
                      <th>GPA</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={`${student.student_id}-${student.internship_id}-${index}`}>
                        <td>
                          <div className="student-cell">
                            {student.student_img ? (
                              <img 
                                src={`http://localhost:5050${student.student_img}`} 
                                alt={student.full_name}
                                className="student-avatar-small"
                              />
                            ) : (
                              <div className="student-avatar-placeholder">
                                {student.full_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <div className="student-name">{student.full_name}</div>
                              <div className="student-email">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="internship-cell">
                            <strong>{student.internship_title}</strong>
                          </div>
                        </td>
                        <td>{student.company_name}</td>
                        <td>{student.university_name || 'N/A'}</td>
                        <td>{student.major || 'N/A'}</td>
                        <td>
                          <span className="gpa-badge">
                            {student.gpa && !isNaN(student.gpa) ? Number(student.gpa).toFixed(2) : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-accepted">
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-view"
                            onClick={() => {
                              setNewReport({ ...newReport, student_id: student.student_id });
                              setActiveMenu('reports');
                            }}
                          >
                            Create Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Reports Section */}
        {activeMenu === 'reports' && (
          <>
            <div className="dashboard-header">
              <h1>Student Reports</h1>
              <p>Create and manage performance reports</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Create New Report */}
            <div className="profile-form-card full-width">
              <h3>Create New Report</h3>
              <form onSubmit={handleSubmitReport}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Select Student *</label>
                    <select
                      value={newReport.student_id}
                      onChange={(e) => setNewReport({ ...newReport, student_id: e.target.value })}
                      required
                    >
                      <option value="">Choose a student...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Report Type</label>
                    <select
                      value={newReport.report_type}
                      onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value })}
                    >
                      <option value="weekly">Weekly Report</option>
                      <option value="monthly">Monthly Report</option>
                      <option value="final">Final Report</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newReport.attendance}
                      onChange={(e) => setNewReport({ ...newReport, attendance: e.target.checked })}
                    />
                    {' '}Attendance Confirmed
                  </label>
                </div>

                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Performance Evaluation</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Technical Skills (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.technical_skills}
                      onChange={(e) => setNewReport({ ...newReport, technical_skills: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Communication Skills (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.communication_skills}
                      onChange={(e) => setNewReport({ ...newReport, communication_skills: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Problem Solving (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.problem_solving}
                      onChange={(e) => setNewReport({ ...newReport, problem_solving: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Teamwork (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.teamwork}
                      onChange={(e) => setNewReport({ ...newReport, teamwork: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Overall Performance Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newReport.performance_rating}
                    onChange={(e) => setNewReport({ ...newReport, performance_rating: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Comments & Feedback</label>
                  <textarea
                    rows="5"
                    value={newReport.comments}
                    onChange={(e) => setNewReport({ ...newReport, comments: e.target.value })}
                    placeholder="Provide detailed feedback about the student's performance..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveMenu('students')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Report
                  </button>
                </div>
              </form>
            </div>

            {/* Previous Reports */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>Previous Reports</h2>
              {reports.length === 0 ? (
                <div className="empty-state">
                  <h3>No Reports Yet</h3>
                  <p>You haven't submitted any reports yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Attendance</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{report.student_name}</td>
                        <td><span className="badge badge-info">{report.report_type}</span></td>
                        <td>{report.performance_rating}/10</td>
                        <td>
                          <span className={`badge ${report.attendance ? 'badge-success' : 'badge-danger'}`}>
                            {report.attendance ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td>{new Date(report.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-view">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Schedule Section */}
        {activeMenu === 'schedule' && (
          <>
            <div className="dashboard-header">
              <h1>Training Schedule</h1>
              <p>Manage your training sessions and meetings</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Add New Schedule */}
            <div className="profile-form-card full-width">
              <h3>Add New Event</h3>
              <form onSubmit={handleAddSchedule}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Title *</label>
                    <input
                      type="text"
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                      placeholder="e.g., Weekly Training Session"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Type</label>
                    <select
                      value={newSchedule.event_type}
                      onChange={(e) => setNewSchedule({ ...newSchedule, event_type: e.target.value })}
                    >
                      <option value="training">Training Session</option>
                      <option value="meeting">Meeting</option>
                      <option value="workshop">Workshop</option>
                      <option value="review">Performance Review</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Student (Optional)</label>
                  <select
                    value={newSchedule.student_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, student_id: e.target.value })}
                  >
                    <option value="">All Students</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="Add event details..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveMenu('dashboard')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Event
                  </button>
                </div>
              </form>
            </div>

            {/* Calendar View */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>Upcoming Events</h2>
              {schedules.length === 0 ? (
                <div className="empty-state">
                  <h3>No Events Scheduled</h3>
                  <p>You don't have any upcoming events.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Student</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td><strong>{schedule.title}</strong></td>
                        <td><span className="badge badge-info">{schedule.event_type}</span></td>
                        <td>{schedule.student_name || 'All Students'}</td>
                        <td>{new Date(schedule.start_time).toLocaleString()}</td>
                        <td>{new Date(schedule.end_time).toLocaleString()}</td>
                        <td>
                          <button className="btn-view">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Notifications Section */}
        {activeMenu === 'notifications' && (
          <>
            <div className="dashboard-header">
              <h1>Notifications</h1>
              <p>Stay updated with important messages</p>
            </div>

            <div className="table-section">
              <h2>All Notifications</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <h3>No Notifications</h3>
                  <p>You don't have any notifications yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map(notification => (
                      <tr key={notification.id} className={!notification.is_read ? 'unread-row' : ''}>
                        <td><strong>{notification.title}</strong></td>
                        <td>{notification.message}</td>
                        <td><span className="badge badge-info">{notification.type}</span></td>
                        <td>
                          <span className={`badge ${notification.is_read ? 'badge-success' : 'badge-warning'}`}>
                            {notification.is_read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td>{new Date(notification.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* My Internships Section */}
        {activeMenu === 'internships' && (
          <>
            <div className="dashboard-header">
              <h1>My Internships</h1>
              <p>Internships you are training</p>
            </div>

            {internships.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3>No Internships Assigned</h3>
                <p>You haven't been assigned to any internships yet</p>
              </div>
            ) : (
              <div className="internships-grid">
                {internships.map(internship => (
                  <div key={internship.id} className="internship-card">
                    <div className="internship-header">
                      <div className="company-info">
                        {internship.company_logo ? (
                          <img 
                            src={`http://localhost:5050${internship.company_logo}`} 
                            alt={internship.company_name}
                            className="company-logo-small"
                          />
                        ) : (
                          <div className="company-logo-placeholder">
                            {internship.company_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3>{internship.title}</h3>
                          <p className="company-name">{internship.company_name}</p>
                        </div>
                      </div>
                      <span className={`status-badge status-${internship.status}`}>
                        {internship.status}
                      </span>
                    </div>

                    <div className="internship-details">
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                        <span>{internship.specialization || 'General'}</span>
                      </div>
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                        </svg>
                        <span>{internship.capacity} positions</span>
                      </div>
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span>{new Date(internship.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="internship-stats">
                      <div className="stat-box">
                        <span className="stat-number">{internship.applicants_count || 0}</span>
                        <span className="stat-label">Applicants</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-number">{internship.accepted_count || 0}</span>
                        <span className="stat-label">Accepted</span>
                      </div>
                    </div>

                    {internship.description && (
                      <div className="internship-description">
                        <p>{internship.description.substring(0, 150)}...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Messages Section */}
        {activeMenu === 'messages' && (
          <>
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Chat with your students and colleagues</p>
            </div>

            <div className="chat-container">
              {/* Conversations List */}
              <div className="conversations-sidebar">
                <h3>Conversations</h3>
                {conversations.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {conversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={`conversation-item ${selectedConversation === conversation.id ? 'active' : ''}`}
                        onClick={() => loadMessages(conversation.id)}
                      >
                        <div className="conversation-avatar">
                          {conversation.participant_name ? conversation.participant_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="conversation-info">
                          <h4>{conversation.participant_name || 'Unknown'}</h4>
                          <p>{conversation.last_message || 'No messages yet'}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <span className="unread-count">{conversation.unread_count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {!selectedConversation ? (
                  <div className="empty-state">
                    <h3>Select a Conversation</h3>
                    <p>Choose a conversation from the list to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Messages List */}
                    <div className="messages-list">
                      {messages.length === 0 ? (
                        <div className="empty-state-small">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`message-item ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                          >
                            <div className="message-bubble">
                              <p>{msg.message}</p>
                              <span className="message-time">
                                {new Date(msg.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <form className="message-input-form" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="message-input"
                      />
                      <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Training Plans Section */}
        {activeMenu === 'plans' && (
          <>
            <div className="dashboard-header">
              <h1>Training Plans</h1>
              <p>Create and manage internship training plans</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Create New Plan */}
            <div className="profile-form-card">
              <h3>Create New Training Plan</h3>
              <form onSubmit={handleCreatePlan}>
                <div className="form-group">
                  <label>Select Internship *</label>
                  <select
                    value={newPlan.internship_id}
                    onChange={(e) => setNewPlan({...newPlan, internship_id: e.target.value})}
                    required
                  >
                    <option value="">-- Select Internship --</option>
                    {internships.map(internship => (
                      <option key={internship.id} value={internship.id}>
                        {internship.title} - {internship.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plan Title *</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                    placeholder="e.g., Full Stack Development Training Plan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="Brief description of the training plan..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (Weeks) *</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={newPlan.duration_weeks}
                      onChange={(e) => setNewPlan({...newPlan, duration_weeks: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={newPlan.start_date}
                      onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={newPlan.end_date}
                      onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newPlan.status}
                      onChange={(e) => setNewPlan({...newPlan, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Weekly Plan */}
                <div className="weeks-section">
                  <div className="weeks-header">
                    <h4>Weekly Plan</h4>
                    <button type="button" className="btn-secondary" onClick={handleAddWeek}>
                      + Add Week
                    </button>
                  </div>

                  {planWeeks.length === 0 ? (
                    <div className="empty-state-small">
                      <p>No weeks added yet. Click "Add Week" to start planning.</p>
                    </div>
                  ) : (
                    <div className="weeks-list">
                      {planWeeks.map((week, index) => (
                        <div key={index} className="week-card">
                          <div className="week-header">
                            <h5>Week {week.week_number}</h5>
                            <button
                              type="button"
                              className="btn-danger-small"
                              onClick={() => handleRemoveWeek(index)}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Week Title</label>
                            <input
                              type="text"
                              value={week.title}
                              onChange={(e) => handleUpdateWeek(index, 'title', e.target.value)}
                              placeholder={`Week ${week.week_number} title`}
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              rows="2"
                              value={week.description}
                              onChange={(e) => handleUpdateWeek(index, 'description', e.target.value)}
                              placeholder="What will students learn this week?"
                            />
                          </div>

                          <div className="form-group">
                            <label>Learning Objectives</label>
                            <textarea
                              rows="2"
                              value={week.objectives}
                              onChange={(e) => handleUpdateWeek(index, 'objectives', e.target.value)}
                              placeholder="Key learning objectives for this week..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Tasks</label>
                            <textarea
                              rows="2"
                              value={week.tasks}
                              onChange={(e) => handleUpdateWeek(index, 'tasks', e.target.value)}
                              placeholder="Tasks and activities for students..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Resources</label>
                            <textarea
                              rows="2"
                              value={week.resources}
                              onChange={(e) => handleUpdateWeek(index, 'resources', e.target.value)}
                              placeholder="Learning resources, links, materials..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Deliverables</label>
                            <textarea
                              rows="2"
                              value={week.deliverables}
                              onChange={(e) => handleUpdateWeek(index, 'deliverables', e.target.value)}
                              placeholder="Expected deliverables from students..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setNewPlan({
                      internship_id: '',
                      title: '',
                      description: '',
                      duration_weeks: 4,
                      start_date: '',
                      end_date: '',
                      status: 'draft'
                    });
                    setPlanWeeks([]);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Plans */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>My Training Plans ({plans.length})</h2>
              {plans.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3>No Training Plans Yet</h3>
                  <p>Create your first training plan above to get started.</p>
                </div>
              ) : (
                <div className="plans-grid">
                  {plans.map(plan => (
                    <div key={plan.id} className="plan-card">
                      <div className="plan-header">
                        <h3>{plan.title}</h3>
                        <span className={`status-badge status-${plan.status}`}>
                          {plan.status}
                        </span>
                      </div>

                      <div className="plan-info">
                        <p className="internship-title">
                          <strong>Internship:</strong> {plan.internship_title}
                        </p>
                        <p className="company-name">
                          <strong>Company:</strong> {plan.company_name}
                        </p>
                      </div>

                      {plan.description && (
                        <p className="plan-description">{plan.description}</p>
                      )}

                      <div className="plan-stats">
                        <div className="stat-item">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span>{plan.duration_weeks} weeks</span>
                        </div>
                        <div className="stat-item">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                          </svg>
                          <span>{plan.weeks_count || 0} weeks planned</span>
                        </div>
                      </div>

                      {(plan.start_date || plan.end_date) && (
                        <div className="plan-dates">
                          {plan.start_date && (
                            <span>Start: {new Date(plan.start_date).toLocaleDateString()}</span>
                          )}
                          {plan.end_date && (
                            <span>End: {new Date(plan.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}

                      <div className="plan-actions">
                        <button
                          className="btn-secondary-small"
                          onClick={() => loadPlanDetails(plan.id)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Details Modal */}
            {selectedPlan && (
              <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{selectedPlan.title}</h2>
                    <button className="close-btn" onClick={() => setSelectedPlan(null)}>×</button>
                  </div>

                  <div className="modal-body">
                    <div className="plan-detail-info">
                      <p><strong>Internship:</strong> {selectedPlan.internship_title}</p>
                      <p><strong>Company:</strong> {selectedPlan.company_name}</p>
                      <p><strong>Duration:</strong> {selectedPlan.duration_weeks} weeks</p>
                      <p><strong>Status:</strong> <span className={`status-badge status-${selectedPlan.status}`}>{selectedPlan.status}</span></p>
                      {selectedPlan.description && (
                        <p><strong>Description:</strong> {selectedPlan.description}</p>
                      )}
                    </div>

                    <div className="weeks-timeline">
                      <h3>Weekly Breakdown</h3>
                      {selectedPlan.weeks && selectedPlan.weeks.length > 0 ? (
                        selectedPlan.weeks.map(week => (
                          <div key={week.id} className="week-detail-card">
                            <h4>Week {week.week_number}: {week.title}</h4>
                            {week.description && <p className="week-desc">{week.description}</p>}
                            
                            {week.objectives && (
                              <div className="week-section">
                                <strong>Objectives:</strong>
                                <p>{week.objectives}</p>
                              </div>
                            )}
                            
                            {week.tasks && (
                              <div className="week-section">
                                <strong>Tasks:</strong>
                                <p>{week.tasks}</p>
                              </div>
                            )}
                            
                            {week.resources && (
                              <div className="week-section">
                                <strong>Resources:</strong>
                                <p>{week.resources}</p>
                              </div>
                            )}
                            
                            {week.deliverables && (
                              <div className="week-section">
                                <strong>Deliverables:</strong>
                                <p>{week.deliverables}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No weekly breakdown available for this plan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default TrainerDashboard;
