import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CompanyDashboard.css';

function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: 'Technology',
    company_size: '1000-5000',
    founded_year: '2010',
    headquarters: 'San Francisco, CA',
    website: 'https://www.techcorp.com',
    linkedin_url: 'https://linkedin.com/company/techcorp',
    address: '123 Tech Street, Suite 400, San Francisco, CA 94105',
    description: 'TechCorp is a leading software development company specializing in cloud computing solutions and enterprise applications.'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [internshipData, setInternshipData] = useState({
    title: '',
    description: '',
    requirements: '',
    specialization: '',
    capacity: 1,
    status: 'open'
  });
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a company
    if (parsedUser.user_type !== 'company') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        const response = await fetch(`http://localhost:5050/api/companies/email/${parsedUser.email}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Loaded company data:', data);
          if (data.success && data.company) {
            setCompanyData({
              name: data.company.name || parsedUser.full_name,
              email: data.company.email || parsedUser.email,
              phone: data.company.phone || '',
              industry: data.company.industry || 'Technology',
              company_size: data.company.company_size || '1000-5000',
              founded_year: data.company.founded_year || '2010',
              headquarters: data.company.headquarters || 'San Francisco, CA',
              website: data.company.website || 'https://www.techcorp.com',
              linkedin_url: data.company.linkedin_url || 'https://linkedin.com/company/techcorp',
              address: data.company.address || '123 Tech Street, Suite 400, San Francisco, CA 94105',
              description: data.company.description || 'TechCorp is a leading software development company.',
              logo: data.company.logo || ''
            });
          } else {
            // Company not found in database, use user data
            console.log('⚠️ Company not found, using default values');
            setCompanyData(prev => ({
              ...prev,
              name: parsedUser.full_name,
              email: parsedUser.email
            }));
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        // Initialize with default values
        setCompanyData(prev => ({
          ...prev,
          name: parsedUser.full_name,
          email: parsedUser.email
        }));
      }
    };
    
    loadCompanyData();
  }, [navigate]);

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
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Upload file to server
      const formData = new FormData();
      formData.append('logo', file);

      try {
        setLoading(true);
        const response = await fetch('http://localhost:5050/api/upload/logo', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          // Save the logo path
          setCompanyData(prev => ({
            ...prev,
            logo: data.logoPath
          }));
          setMessage({ type: 'success', text: 'Logo uploaded! Click Save Changes to update.' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to upload logo' });
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage({ type: 'error', text: 'Failed to upload logo' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // If email was changed, update localStorage and user state
        if (data.newEmail && data.newEmail !== user.email) {
          const updatedUser = {
            ...user,
            email: data.newEmail,
            full_name: companyData.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('✅ Email updated in localStorage:', data.newEmail);
        } else if (companyData.name !== user.full_name) {
          // If only name was changed
          const updatedUser = {
            ...user,
            full_name: companyData.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('✅ Name updated in localStorage');
        }
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInternshipInputChange = (e) => {
    const { name, value } = e.target;
    setInternshipData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5050/api/internships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_email: user.email,
          ...internshipData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Internship posted successfully!' });
        // Reset form
        setInternshipData({
          title: '',
          description: '',
          requirements: '',
          specialization: '',
          capacity: 1,
          status: 'open'
        });
        // Reload internships
        loadInternships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to post internship' });
      }
    } catch (error) {
      console.error('Post internship error:', error);
      setMessage({ type: 'error', text: 'Failed to post internship' });
    } finally {
      setLoading(false);
    }
  };

  const loadInternships = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/internships/company/${user.email}`);
      const data = await response.json();

      if (response.ok) {
        setInternships(data.internships || []);
      }
    } catch (error) {
      console.error('Load internships error:', error);
    }
  };

  const handleDeleteInternship = async (id) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5050/api/internships/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Internship deleted successfully!' });
        loadInternships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete internship' });
    }
  };

  // Load internships when switching to manage tab
  useEffect(() => {
    if (activeMenu === 'manage' && user) {
      loadInternships();
    }
  }, [activeMenu, user]);

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || internship.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="company-dashboard">
      {/* Sidebar */}
      <aside className="company-sidebar">
        {/* Company Profile Section */}
        <div className="company-profile-section">
          <div className="company-avatar">
            {companyData.logo ? (
              <img 
                src={`http://localhost:5050${companyData.logo}`} 
                alt="Company Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <div className="company-info">
            <h3>{user.full_name}</h3>
            <p>Software Company</p>
            <div className="company-badge">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="company-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>

          <button 
            className={`nav-item ${activeMenu === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('profile')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Profile & Edit
          </button>

          <button 
            className={`nav-item ${activeMenu === 'post' ? 'active' : ''}`}
            onClick={() => setActiveMenu('post')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Internship
          </button>

          <button 
            className={`nav-item ${activeMenu === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveMenu('manage')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Manage Internships
          </button>

          <button 
            className={`nav-item ${activeMenu === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveMenu('applicants')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Applicants List
          </button>

          <button 
            className={`nav-item ${activeMenu === 'details' ? 'active' : ''}`}
            onClick={() => setActiveMenu('details')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Applicant Details
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages/Chat
          </button>
        </nav>

        {/* Logout Section */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="company-main-content">
        {activeMenu === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Dashboard</h1>
              <p>Welcome back, {user.full_name}</p>
            </div>

            <div className="dashboard-content">
              <h2>Company Overview</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User Type:</strong> {user.user_type}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              
              <div style={{ marginTop: '30px' }}>
                <h3>Quick Stats</h3>
                <p>Dashboard content coming soon...</p>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'profile' && (
          <>
            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Profile Header */}
            <div className="profile-header-card">
              <div className="profile-header-content">
                <div className="profile-avatar-large">
                  {companyData.logo ? (
                    <img 
                      src={`http://localhost:5050${companyData.logo}`} 
                      alt="Company Logo" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="profile-header-info">
                  <h2>{user.full_name}</h2>
                  <p>Software Development Company</p>
                  <div className="profile-badges">
                    <span className="verified-badge">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Company
                    </span>
                    <span className="rating-badge">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      4.8 ⭐ (127 reviews)
                    </span>
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                id="logo-upload" 
                accept="image/*" 
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <button 
                className="upload-logo-btn"
                onClick={() => document.getElementById('logo-upload').click()}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Logo
              </button>
            </div>

            {/* Company Information Forms */}
            <div className="profile-forms-container">
              <div className="profile-form-card">
                <h3>Company Information</h3>
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={companyData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select 
                    name="industry"
                    value={companyData.industry}
                    onChange={handleInputChange}
                  >
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>Education</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Company Size</label>
                  <select 
                    name="company_size"
                    value={companyData.company_size}
                    onChange={handleInputChange}
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>501-1000 employees</option>
                    <option>1000-5000 employees</option>
                    <option>5000+ employees</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Founded Year</label>
                  <input 
                    type="number" 
                    name="founded_year"
                    value={companyData.founded_year} 
                    onChange={handleInputChange}
                    placeholder="2010" 
                  />
                </div>
                <div className="form-group">
                  <label>Headquarters</label>
                  <input 
                    type="text" 
                    name="headquarters"
                    value={companyData.headquarters} 
                    onChange={handleInputChange}
                    placeholder="City, State/Country" 
                  />
                </div>
              </div>

              <div className="profile-form-card">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>Company Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={companyData.email} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={companyData.phone} 
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567" 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <div className="input-with-button">
                    <input 
                      type="url" 
                      name="website"
                      value={companyData.website} 
                      onChange={handleInputChange}
                      placeholder="https://" 
                    />
                    <button className="preview-btn">Preview</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={companyData.linkedin_url} 
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/company/" 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={companyData.address} 
                    onChange={handleInputChange}
                    placeholder="Full address" 
                  />
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="profile-form-card full-width">
              <h3>Company Description</h3>
              <div className="form-group">
                <label>About Company</label>
                <textarea 
                  rows="6" 
                  name="description"
                  value={companyData.description}
                  onChange={handleInputChange}
                  placeholder="Write a detailed description about your company..."
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

        {activeMenu === 'post' && (
          <>
            <div className="dashboard-header">
              <h1>Post New Internship</h1>
              <p>Create a new internship opportunity for students</p>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePostInternship} className="internship-form">
              <div className="profile-form-card">
                <h3>Internship Details</h3>
                
                <div className="form-group">
                  <label>Internship Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={internshipData.title} 
                    onChange={handleInternshipInputChange}
                    placeholder="e.g., Software Development Intern"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Specialization</label>
                  <select 
                    name="specialization"
                    value={internshipData.specialization} 
                    onChange={handleInternshipInputChange}
                  >
                    <option value="">Select Specialization</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="AI/Machine Learning">AI/Machine Learning</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input 
                      type="number" 
                      name="capacity"
                      value={internshipData.capacity} 
                      onChange={handleInternshipInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      name="status"
                      value={internshipData.status} 
                      onChange={handleInternshipInputChange}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    rows="6" 
                    name="description"
                    value={internshipData.description}
                    onChange={handleInternshipInputChange}
                    placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Requirements</label>
                  <textarea 
                    rows="4" 
                    name="requirements"
                    value={internshipData.requirements}
                    onChange={handleInternshipInputChange}
                    placeholder="List the required skills, qualifications, and experience..."
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="btn-secondary" 
                    onClick={() => setActiveMenu('dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Posting...' : 'Post Internship'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {activeMenu === 'manage' && (
          <>
            <div className="manage-header">
              <div>
                <h1>Manage Internships</h1>
                <p>View and manage all your internship posts</p>
              </div>
              <button 
                className="btn-post-new"
                onClick={() => setActiveMenu('post')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Internship
              </button>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Search and Filters */}
            <div className="manage-filters">
              <div className="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Internships Table */}
            <div className="internships-table-container">
              <div className="table-header-section">
                <h3>Your Internship Posts</h3>
                <span className="posts-count">{filteredInternships.length} posts</span>
              </div>

              {filteredInternships.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No internships found</h3>
                  <p>Start by posting your first internship opportunity</p>
                  <button className="btn-primary" onClick={() => setActiveMenu('post')}>
                    Post New Internship
                  </button>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Specialization</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInternships.map((internship) => (
                        <tr key={internship.id}>
                          <td>
                            <div className="position-cell">
                              <strong>{internship.title}</strong>
                              <span className="position-id">ID: {internship.id}</span>
                            </div>
                          </td>
                          <td>{internship.specialization || 'N/A'}</td>
                          <td>{internship.capacity}</td>
                          <td>
                            <span className={`status-badge status-${internship.status}`}>
                              {internship.status}
                            </span>
                          </td>
                          <td>
                            <div className="date-cell">
                              {new Date(internship.created_at).toLocaleDateString('en-GB')}
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="action-btn view-btn" title="View">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button className="action-btn edit-btn" title="Edit">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                title="Delete"
                                onClick={() => handleDeleteInternship(internship.id)}
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu !== 'dashboard' && activeMenu !== 'profile' && activeMenu !== 'post' && activeMenu !== 'manage' && (
          <div className="dashboard-header">
            <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</h1>
            <p>This section is under development</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default CompanyDashboard;
