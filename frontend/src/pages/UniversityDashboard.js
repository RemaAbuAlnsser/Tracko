import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CompanyDashboard.css';

function UniversityDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [universityData, setUniversityData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo: '',
    coordinator_name: '',
    coordinator_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [partnerships, setPartnerships] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [partnershipData, setPartnershipData] = useState({
    agreement_date: '',
    agreement_end_date: '',
    agreement_duration: '',
    contact_person_university: '',
    contact_person_company: '',
    terms_and_conditions: '',
    status: 'pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.user_type !== 'university') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    loadUniversityData(parsedUser.email);
  }, [navigate]);

  const loadUniversityData = async (email) => {
    try {
      const response = await fetch(`http://localhost:5050/api/universities`);
      if (response.ok) {
        const data = await response.json();
        const university = data.data.find(u => u.email === email);
        if (university) {
          setUniversityData(university);
        } else {
          // Initialize with user data if university not found
          setUniversityData(prev => ({
            ...prev,
            name: user?.full_name || '',
            email: email
          }));
        }
      }
    } catch (error) {
      console.error('Error loading university data:', error);
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
    const { name, value } = e.target;
    setUniversityData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

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
          setUniversityData(prev => ({
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
      const response = await fetch(`http://localhost:5050/api/universities/${universityData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(universityData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update localStorage if name changed
        if (universityData.name !== user.full_name) {
          const updatedUser = {
            ...user,
            full_name: universityData.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
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

  // Load partnerships when partnerships menu is active
  useEffect(() => {
    if (activeMenu === 'partnerships' && universityData.id) {
      loadPartnerships();
      loadCompanies();
    }
  }, [activeMenu, universityData.id]);

  const loadPartnerships = async () => {
    if (!universityData.id) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/partnerships/university/${universityData.id}`);
      const data = await response.json();
      if (response.ok) {
        setPartnerships(data.data || []);
      }
    } catch (error) {
      console.error('Error loading partnerships:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/companies');
      const data = await response.json();
      if (response.ok) {
        setCompanies(data.data || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handlePartnershipInputChange = (e) => {
    const { name, value } = e.target;
    setPartnershipData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreatePartnership = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5050/api/partnerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          university_id: universityData.id,
          company_id: selectedCompany,
          ...partnershipData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Partnership created successfully!' });
        setPartnershipData({
          agreement_date: '',
          agreement_end_date: '',
          agreement_duration: '',
          contact_person_university: '',
          contact_person_company: '',
          terms_and_conditions: '',
          status: 'pending'
        });
        setSelectedCompany('');
        loadPartnerships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create partnership' });
      }
    } catch (error) {
      console.error('Create partnership error:', error);
      setMessage({ type: 'error', text: 'Failed to create partnership' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartnership = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partnership?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5050/api/partnerships/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Partnership deleted successfully!' });
        loadPartnerships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete partnership' });
    }
  };

  const handleUpdatePartnershipStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5050/api/partnerships/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Partnership status updated successfully!' });
        loadPartnerships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Update status error:', error);
      setMessage({ type: 'error', text: 'Failed to update partnership status' });
    }
  };

  // Filter partnerships
  const filteredPartnerships = partnerships.filter(partnership => {
    const matchesSearch = partnership.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.contact_person_company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || partnership.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="company-dashboard">
      {/* Sidebar */}
      <aside className="company-sidebar">
        {/* University Profile Section */}
        <div className="company-profile-section">
          <div className="company-avatar">
            {universityData.logo ? (
              <img 
                src={`http://localhost:5050${universityData.logo}`} 
                alt="University Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <div className="company-info">
            <h3>{universityData.name || user.full_name}</h3>
            <p>University</p>
            <div className="company-badge">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
              University
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
            className={`nav-item ${activeMenu === 'partnerships' ? 'active' : ''}`}
            onClick={() => setActiveMenu('partnerships')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Company Partnerships
          </button>

          <button 
            className={`nav-item ${activeMenu === 'students' ? 'active' : ''}`}
            onClick={() => setActiveMenu('students')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Students Management
          </button>

          <button 
            className={`nav-item ${activeMenu === 'internships' ? 'active' : ''}`}
            onClick={() => setActiveMenu('internships')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Internship Opportunities
          </button>

          <button 
            className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMenu('reports')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports & Analytics
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
              <h2>University Overview</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User Type:</strong> {user.user_type}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              
              <div style={{ marginTop: '30px' }}>
                <h3>Quick Stats</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  marginTop: '20px'
                }}>
                  <div style={{ 
                    padding: '20px', 
                    background: '#f0f9ff', 
                    borderRadius: '10px',
                    border: '1px solid #bae6fd'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Students</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0c4a6e' }}>0</p>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    background: '#f0fdf4', 
                    borderRadius: '10px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#15803d' }}>Active Partnerships</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>0</p>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    background: '#fef3c7', 
                    borderRadius: '10px',
                    border: '1px solid #fde68a'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Internship Opportunities</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#78350f' }}>0</p>
                  </div>
                </div>
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
                  {universityData.logo ? (
                    <img 
                      src={`http://localhost:5050${universityData.logo}`} 
                      alt="University Logo" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="profile-header-info">
                  <h2>{universityData.name || user.full_name}</h2>
                  <p>University</p>
                  <div className="profile-badges">
                    <span className="verified-badge">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified University
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
                disabled={loading}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Logo
              </button>
            </div>

            {/* University Information Forms */}
            <div className="profile-forms-container">
              <div className="profile-form-card">
                <h3>University Information</h3>
                <div className="form-group">
                  <label>University Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={universityData.name} 
                    onChange={handleInputChange}
                    placeholder="Enter university name"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={universityData.address} 
                    onChange={handleInputChange}
                    placeholder="Full address" 
                  />
                </div>
              </div>

              <div className="profile-form-card">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>University Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={universityData.email} 
                    onChange={handleInputChange}
                    placeholder="university@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={universityData.phone} 
                    onChange={handleInputChange}
                    placeholder="+970 123 456 789" 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <div className="input-with-button">
                    <input 
                      type="url" 
                      name="website"
                      value={universityData.website} 
                      onChange={handleInputChange}
                      placeholder="https://www.university.edu" 
                    />
                    <button className="preview-btn" type="button">Preview</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinator Information */}
            <div className="profile-form-card full-width">
              <h3>Training Coordinator Information</h3>
              <div className="profile-forms-container">
                <div className="form-group">
                  <label>Coordinator Name</label>
                  <input 
                    type="text" 
                    name="coordinator_name"
                    value={universityData.coordinator_name}
                    onChange={handleInputChange}
                    placeholder="Full name of training coordinator"
                  />
                </div>
                <div className="form-group">
                  <label>Coordinator Phone</label>
                  <input 
                    type="tel" 
                    name="coordinator_phone"
                    value={universityData.coordinator_phone}
                    onChange={handleInputChange}
                    placeholder="+970 123 456 789"
                  />
                </div>
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

        {activeMenu === 'partnerships' && (
          <>
            <div className="manage-header">
              <div>
                <h1>Company Partnerships</h1>
                <p>View and manage all your partnerships with companies</p>
              </div>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Create New Partnership Form */}
            <form onSubmit={handleCreatePartnership} className="internship-form">
              <div className="profile-form-card">
                <h3>Create New Partnership</h3>
                
                <div className="form-group">
                  <label>Select Company *</label>
                  <select 
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    required
                  >
                    <option value="">-- Select a company --</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} - {company.industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Agreement Start Date</label>
                    <input 
                      type="date" 
                      name="agreement_date"
                      value={partnershipData.agreement_date}
                      onChange={handlePartnershipInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Agreement End Date</label>
                    <input 
                      type="date" 
                      name="agreement_end_date"
                      value={partnershipData.agreement_end_date}
                      onChange={handlePartnershipInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Agreement Duration (months)</label>
                  <input 
                    type="number" 
                    name="agreement_duration"
                    value={partnershipData.agreement_duration}
                    onChange={handlePartnershipInputChange}
                    min="1"
                    placeholder="12"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>University Contact Person</label>
                    <input 
                      type="text" 
                      name="contact_person_university"
                      value={partnershipData.contact_person_university}
                      onChange={handlePartnershipInputChange}
                      placeholder="Name of university representative"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Contact Person</label>
                    <input 
                      type="text" 
                      name="contact_person_company"
                      value={partnershipData.contact_person_company}
                      onChange={handlePartnershipInputChange}
                      placeholder="Name of company representative"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Terms and Conditions</label>
                  <textarea 
                    rows="6" 
                    name="terms_and_conditions"
                    value={partnershipData.terms_and_conditions}
                    onChange={handlePartnershipInputChange}
                    placeholder="Enter partnership terms and conditions..."
                  />
                </div>

                <div className="form-group">
                  <label>Partnership Status</label>
                  <select 
                    name="status"
                    value={partnershipData.status}
                    onChange={handlePartnershipInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading || !selectedCompany}
                  >
                    {loading ? 'Creating...' : 'Create Partnership'}
                  </button>
                </div>
              </div>
            </form>

            {/* Search and Filters */}
            <div className="manage-filters" style={{ marginTop: '30px' }}>
              <div className="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Search partnerships..."
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
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {/* Partnerships Table */}
            <div className="internships-table-container">
              <div className="table-header-section">
                <h3>Your Partnerships</h3>
                <span className="posts-count">{filteredPartnerships.length} partnerships</span>
              </div>

              {filteredPartnerships.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3>No partnerships found</h3>
                  <p>Start by creating your first partnership with a company</p>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Agreement Period</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Contact Person</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartnerships.map((partnership) => (
                        <tr key={partnership.id}>
                          <td>
                            <div className="position-cell">
                              <strong>{partnership.company_name}</strong>
                              <span className="position-id">ID: {partnership.id}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              {partnership.agreement_date ? new Date(partnership.agreement_date).toLocaleDateString('en-GB') : 'N/A'}
                              {' - '}
                              {partnership.agreement_end_date ? new Date(partnership.agreement_end_date).toLocaleDateString('en-GB') : 'N/A'}
                            </div>
                          </td>
                          <td>{partnership.agreement_duration ? `${partnership.agreement_duration} months` : 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${partnership.status}`}>
                              {partnership.status}
                            </span>
                          </td>
                          <td>{partnership.contact_person_company || 'N/A'}</td>
                          <td>
                            <div className="actions-cell">
                              <select 
                                className="status-select"
                                value={partnership.status}
                                onChange={(e) => handleUpdatePartnershipStatus(partnership.id, e.target.value)}
                                style={{ 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  border: '1px solid #ddd',
                                  fontSize: '12px',
                                  marginRight: '8px'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="terminated">Terminated</option>
                              </select>
                              <button 
                                className="action-btn delete-btn" 
                                title="Delete"
                                onClick={() => handleDeletePartnership(partnership.id)}
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

        {activeMenu === 'students' && (
          <div className="dashboard-content">
            <h2>Students Management</h2>
            <p>Student management page coming soon...</p>
          </div>
        )}

        {activeMenu === 'internships' && (
          <div className="dashboard-content">
            <h2>Internship Opportunities</h2>
            <p>Internship opportunities page coming soon...</p>
          </div>
        )}

        {activeMenu === 'reports' && (
          <div className="dashboard-content">
            <h2>Reports & Analytics</h2>
            <p>Reports page coming soon...</p>
          </div>
        )}

        {activeMenu === 'notifications' && (
          <div className="dashboard-content">
            <h2>Notifications</h2>
            <p>No new notifications</p>
          </div>
        )}

        {activeMenu === 'messages' && (
          <div className="dashboard-content">
            <h2>Messages</h2>
            <p>No new messages</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default UniversityDashboard;
