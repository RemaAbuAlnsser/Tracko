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
    status: 'active'
  });
  const [trainerId, setTrainerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a company (trainer)
    if (parsedUser.user_type !== 'company') {
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
            status: data.trainer.status || 'active'
          });
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
      
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainerData)
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
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
            {getInitials(user.full_name)}
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
      </main>
    </div>
  );
}

export default TrainerDashboard;
