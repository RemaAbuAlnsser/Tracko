import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TrainerProfile.css';

function TrainerProfile() {
  const [user, setUser] = useState(null);
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [trainerId, setTrainerId] = useState(null);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTrainerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!trainerId) {
      setMessage({ type: 'error', text: 'Trainer profile not found' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainerData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        // Reload trainer data
        loadTrainerData(user.id);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="trainer-profile-container">
      <nav className="trainer-navbar">
        <div className="navbar-brand">
          <h2>Tracko - Trainer Portal</h2>
        </div>
        <div className="navbar-user">
          <span className="user-name">{user.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="trainer-content">
        <div className="profile-header">
          <h1>Trainer Profile</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="edit-btn"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="trainer-form">
          <div className="form-grid">
            {/* Professional Information */}
            <div className="form-section">
              <h3>Professional Information</h3>
              
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={trainerData.specialization}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., Full Stack Development, Data Science"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience_years">Years of Experience</label>
                <input
                  type="number"
                  id="experience_years"
                  name="experience_years"
                  value={trainerData.experience_years}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourly_rate">Hourly Rate ($)</label>
                <input
                  type="number"
                  id="hourly_rate"
                  name="hourly_rate"
                  value={trainerData.hourly_rate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="max_trainees">Maximum Trainees</label>
                <input
                  type="number"
                  id="max_trainees"
                  name="max_trainees"
                  value={trainerData.max_trainees}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  min="1"
                />
              </div>
            </div>

            {/* Contact & Social Links */}
            <div className="form-section">
              <h3>Contact & Social Links</h3>
              
              <div className="form-group">
                <label htmlFor="linkedin_url">LinkedIn URL</label>
                <input
                  type="url"
                  id="linkedin_url"
                  name="linkedin_url"
                  value={trainerData.linkedin_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {trainerData.linkedin_url && !isEditing && (
                  <a 
                    href={trainerData.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="preview-link"
                  >
                    View Profile
                  </a>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="github_url">GitHub URL</label>
                <input
                  type="url"
                  id="github_url"
                  name="github_url"
                  value={trainerData.github_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/yourusername"
                />
                {trainerData.github_url && !isEditing && (
                  <a 
                    href={trainerData.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="preview-link"
                  >
                    View Profile
                  </a>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={trainerData.status}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bio Section - Full Width */}
          <div className="form-section full-width">
            <h3>About Me</h3>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={trainerData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows="6"
                placeholder="Tell us about yourself, your experience, and what you can offer to trainees..."
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  loadTrainerData(user.id);
                }} 
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default TrainerProfile;
