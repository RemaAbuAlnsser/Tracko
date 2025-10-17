import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentDashboard.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [recommendedInternships, setRecommendedInternships] = useState([]);
  const [studentData, setStudentData] = useState({
    major: '',
    academic_year: '',
    gpa: '',
    skills: '',
    university_id: '',
    university_name: '',
    student_img: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.user_type !== 'student') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    loadDashboardData();
    loadStudentData(parsedUser.id);
  }, [navigate]);

  const loadStudentData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/students/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.student) {
          // Load university name if university_id exists
          let universityName = '';
          if (data.student.university_id) {
            try {
              const uniResponse = await fetch(`http://localhost:5050/api/universities/${data.student.university_id}`);
              if (uniResponse.ok) {
                const uniData = await uniResponse.json();
                if (uniData.success && uniData.university) {
                  universityName = uniData.university.name;
                }
              }
            } catch (err) {
              console.error('Error loading university:', err);
            }
          }
          
          setStudentData({
            major: data.student.major || '',
            academic_year: data.student.academic_year || '',
            gpa: data.student.gpa || '',
            skills: data.student.skills || '',
            university_id: data.student.university_id || '',
            university_name: universityName,
            student_img: data.student.student_img || ''
          });
          
          // Set image preview if exists
          if (data.student.student_img) {
            setImagePreview(`http://localhost:5050${data.student.student_img}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const loadDashboardData = async () => {
    // Load applications and recommended internships
    // This is placeholder data - replace with actual API calls
    setApplications([
      {
        id: 1,
        title: 'Software Engineer Intern',
        company: 'TechCorp',
        timeAgo: '2 days ago',
        status: 'interview'
      },
      {
        id: 2,
        title: 'Product Manager Intern',
        company: 'StartupX',
        timeAgo: '1 week ago',
        status: 'under_review'
      },
      {
        id: 3,
        title: 'Data Science Intern',
        company: 'BigData Inc',
        timeAgo: '2 weeks ago',
        status: 'applied'
      }
    ]);

    setRecommendedInternships([
      {
        id: 1,
        title: 'DevOps Intern',
        company: 'CloudTech',
        location: 'Remote',
        match: 96
      },
      {
        id: 2,
        title: 'ML Engineer Intern',
        company: 'AI Innovations',
        location: 'Hybrid',
        match: 92
      },
      {
        id: 3,
        title: 'Backend Developer Intern',
        company: 'FinanceFlow',
        location: 'On-site',
        match: 89
      }
    ]);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // First, get the student record to get the student ID
      const getResponse = await fetch(`http://localhost:5050/api/students/user/${user.id}`);
      const getData = await getResponse.json();

      if (!getData.success || !getData.student) {
        setMessage({ type: 'error', text: 'Student record not found' });
        setLoading(false);
        return;
      }

      const studentId = getData.student.id;

      let uploadedImagePath = studentData.student_img;

      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);

        const uploadResponse = await fetch('http://localhost:5050/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          uploadedImagePath = uploadData.filePath;
        } else {
          setMessage({ type: 'error', text: 'Failed to upload image' });
          setLoading(false);
          return;
        }
      }

      // Prepare data - convert empty strings to null for numeric fields
      // Don't send university_name as it's not in the database
      const dataToSend = {
        university_id: studentData.university_id === '' || studentData.university_id === null ? null : studentData.university_id,
        major: studentData.major === '' ? null : studentData.major,
        academic_year: studentData.academic_year === '' ? null : studentData.academic_year,
        gpa: studentData.gpa === '' || studentData.gpa === null ? null : parseFloat(studentData.gpa),
        skills: studentData.skills === '' ? null : studentData.skills,
        cv_file: null,
        student_img: uploadedImagePath || null,
        status: 'active'
      };

      console.log('Sending data:', dataToSend);

      // Update student data
      const response = await fetch(`http://localhost:5050/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setSelectedImage(null);
        // Reload student data
        await loadStudentData(user.id);
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        console.error('Update failed:', data);
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      interview: { text: 'Interview', color: '#1e88e5' },
      under_review: { text: 'Under Review', color: '#fb8c00' },
      applied: { text: 'Applied', color: '#43a047' }
    };
    const config = statusConfig[status] || { text: status, color: '#757575' };
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '12px', 
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: config.color + '20',
        color: config.color
      }}>
        {config.text}
      </span>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <aside className="student-sidebar">
        {/* Student Profile Section */}
        <div className="student-profile-section">
          <div className="student-avatar">
            {studentData.student_img ? (
              <img src={`http://localhost:5050${studentData.student_img}`} alt={user.full_name} />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <div className="student-info">
            <h3>{user.full_name}</h3>
            <p>{studentData.university_name || 'Student'}</p>
            <div className="student-badge">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              Student
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
            className={`nav-item ${activeMenu === 'cv' ? 'active' : ''}`}
            onClick={() => setActiveMenu('cv')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Upload CV + AI
          </button>

          <button 
            className={`nav-item ${activeMenu === 'internships' ? 'active' : ''}`}
            onClick={() => setActiveMenu('internships')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Internship List
          </button>

          <button 
            className={`nav-item ${activeMenu === 'details' ? 'active' : ''}`}
            onClick={() => setActiveMenu('details')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Internship Details
          </button>

          <button 
            className={`nav-item ${activeMenu === 'status' ? 'active' : ''}`}
            onClick={() => setActiveMenu('status')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Applications Status
          </button>

          <button 
            className={`nav-item ${activeMenu === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveMenu('notifications')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </button>

          <button 
            className={`nav-item ${activeMenu === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveMenu('messages')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Messages/Chat
          </button>
        </nav>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="student-main">
        {activeMenu === 'dashboard' && (
          <>
            {/* Dashboard Header */}
            <div className="main-header">
              <h1>Dashboard</h1>
            </div>

            {/* Welcome Banner */}
            <div className="welcome-banner">
              <h2>Welcome back, {user.full_name.split(' ')[0]}!</h2>
              <p>You have 3 new internship matches and 2 application updates</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
                  <svg width="24" height="24" fill="#1e88e5" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>12</h3>
                  <p>Applications Sent</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                  <svg width="24" height="24" fill="#43a047" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>3</h3>
                  <p>Interviews Scheduled</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
                  <svg width="24" height="24" fill="#fb8c00" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>5</h3>
                  <p>Pending Reviews</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
                  <svg width="24" height="24" fill="#8e24aa" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>87%</h3>
                  <p>Profile Match Score</p>
                </div>
              </div>
            </div>

            {/* Applications and Recommendations */}
            <div className="content-grid">
              {/* Recent Applications */}
              <div className="content-section">
                <h3 className="section-title">Recent Applications</h3>
                <div className="applications-list">
                  {applications.map(app => (
                    <div key={app.id} className="application-item">
                      <div className="app-avatar">
                        {app.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="app-details">
                        <h4>{app.title}</h4>
                        <p>{app.company} • {app.timeAgo}</p>
                      </div>
                      <div className="app-status">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Matches */}
              <div className="content-section">
                <h3 className="section-title">Recommended Matches</h3>
                <div className="recommendations-list">
                  {recommendedInternships.map(internship => (
                    <div key={internship.id} className="recommendation-item">
                      <div className="rec-avatar">
                        {internship.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="rec-details">
                        <h4>{internship.title}</h4>
                        <p>{internship.company} • {internship.location}</p>
                      </div>
                      <div className="rec-actions">
                        <span className="match-score">{internship.match}% match</span>
                        <button className="view-btn">View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'profile' && (
          <>
            <div className="profile-header">
              <h2>Profile & Edit</h2>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="profile-content">
              {/* Profile Picture Section */}
              <div className="profile-card">
                <h3>Profile Picture</h3>
                <div className="image-upload-container">
                  <div className="image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Student" />
                    ) : (
                      <div className="no-image">
                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <p>No image</p>
                      </div>
                    )}
                  </div>
                  <div className="image-upload-btn">
                    <label htmlFor="student-image" className="upload-label">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose Image
                    </label>
                    <input 
                      id="student-image"
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                <small style={{ display: 'block', marginTop: '12px', color: '#6b7280' }}>
                  This image will appear in the sidebar
                </small>
              </div>

              {/* Personal Information */}
              <div className="profile-card">
                <h3>Personal Information</h3>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={user.full_name}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="profile-card">
                <h3>Academic Information</h3>
                
                <div className="form-group">
                  <label>University</label>
                  <input 
                    type="text" 
                    value={studentData.university_name || 'Not assigned'}
                    disabled
                    className="disabled-input"
                  />
                  <small>University is automatically assigned based on your email domain</small>
                </div>

                <div className="form-group">
                  <label>Major</label>
                  <input 
                    type="text" 
                    name="major"
                    value={studentData.major}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select 
                      name="academic_year"
                      value={studentData.academic_year}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>GPA</label>
                    <input 
                      type="number" 
                      name="gpa"
                      value={studentData.gpa}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.75"
                      step="0.01"
                      min="0"
                      max="4"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Skills</label>
                  <textarea 
                    name="skills"
                    value={studentData.skills}
                    onChange={handleInputChange}
                    placeholder="e.g., JavaScript, React, Python, SQL..."
                    rows="4"
                  />
                  <small>Separate skills with commas</small>
                </div>
              </div>

              {/* Save Button */}
              <div className="profile-card">
                <button 
                  className="btn-save-profile" 
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {activeMenu !== 'dashboard' && activeMenu !== 'profile' && (
          <div className="placeholder-content">
            <h2>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)} Page</h2>
            <p>This section is under development</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
