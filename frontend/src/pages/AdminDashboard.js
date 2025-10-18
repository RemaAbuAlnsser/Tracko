import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [internships, setInternships] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Check if user is admin
    if (!user || user.user_type !== 'admin') {
      navigate('/login');
      return;
    }

    // Load initial data
    fetchStats();
  }, []);

  useEffect(() => {
    // Load data based on active tab
    switch (activeTab) {
      case 'users':
        fetchUsers();
        break;
      case 'companies':
        fetchCompanies();
        break;
      case 'universities':
        fetchUniversities();
        break;
      case 'students':
        fetchStudents();
        break;
      case 'trainers':
        fetchTrainers();
        break;
      case 'internships':
        fetchInternships();
        break;
      case 'partnerships':
        fetchPartnerships();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/universities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setUniversities(data.universities);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/trainers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setTrainers(data.trainers);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setError('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/internships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setInternships(data.internships);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      setError('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerships = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/admin/partnerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (data.success) {
        setPartnerships(data.partnerships);
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      setError('Failed to load partnerships');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5050/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          userIdToDelete: userId 
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderOverview = () => {
    if (!stats) return <div className="loading">Loading statistics...</div>;

    return (
      <div className="overview-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalCompanies}</h3>
              <p>Companies</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalUniversities}</h3>
              <p>Universities</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalTrainers}</h3>
              <p>Trainers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalInternships}</h3>
              <p>Total Internships</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.activeInternships}</h3>
              <p>Active Internships</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalPartnerships || 0}</h3>
              <p>Total Partnerships</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.activePartnerships || 0}</h3>
              <p>Active Partnerships</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.pendingCompanies}</h3>
              <p>Pending Companies</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="table-section">
        <h2>All Users</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>User Type</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.user_type}`}>
                      {u.user_type}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.user_type !== 'admin' && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderCompanies = () => {
    return (
      <div className="table-section">
        <h2>All Companies</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Industry</th>
                  <th>Address</th>
                  <th>Website</th>
                  <th>Domain</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.name}</td>
                    <td>{company.email}</td>
                    <td>{company.phone || 'N/A'}</td>
                    <td>{company.industry || 'N/A'}</td>
                    <td>{company.address || 'N/A'}</td>
                    <td>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                          {company.website}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{company.domain || 'N/A'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {company.description || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge badge-${company.status}`}>
                        {company.status}
                      </span>
                    </td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderUniversities = () => {
    return (
      <div className="table-section">
        <h2>All Universities</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Website</th>
                  <th>Domain</th>
                  <th>Coordinator Name</th>
                  <th>Coordinator Phone</th>
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr key={uni.id}>
                    <td>{uni.name}</td>
                    <td>{uni.email}</td>
                    <td>{uni.phone || 'N/A'}</td>
                    <td>{uni.address || 'N/A'}</td>
                    <td>
                      {uni.website ? (
                        <a href={uni.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                          {uni.website}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{uni.domain || 'N/A'}</td>
                    <td>{uni.coordinator_name || 'N/A'}</td>
                    <td>{uni.coordinator_phone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderStudents = () => {
    return (
      <div className="table-section">
        <h2>All Students</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>University</th>
                  <th>Major</th>
                  <th>Academic Year</th>
                  <th>GPA</th>
                  <th>Skills</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.full_name}</td>
                    <td>{student.email}</td>
                    <td>{student.university_name || 'N/A'}</td>
                    <td>{student.major || 'N/A'}</td>
                    <td>{student.academic_year || 'N/A'}</td>
                    <td>{student.gpa || 'N/A'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.skills || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge badge-${student.status}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderTrainers = () => {
    return (
      <div className="table-section">
        <h2>All Trainers</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : trainers.length === 0 ? (
          <div className="loading">No trainers found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainer ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Specialization</th>
                  <th>Experience Years</th>
                  <th>Bio</th>
                  <th>LinkedIn</th>
                  <th>GitHub</th>
                  <th>Hourly Rate</th>
                  <th>Max Trainees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => (
                  <tr key={trainer.id}>
                    <td>{trainer.id}</td>
                    <td>{trainer.full_name}</td>
                    <td>{trainer.email}</td>
                    <td>{trainer.company_name || 'N/A'}</td>
                    <td>{trainer.specialization || 'N/A'}</td>
                    <td>{trainer.experience_years || 'N/A'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trainer.bio || 'N/A'}
                    </td>
                    <td>
                      {trainer.linkedin_url ? (
                        <a href={trainer.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                          LinkedIn
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {trainer.github_url ? (
                        <a href={trainer.github_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
                          GitHub
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{trainer.hourly_rate ? `$${trainer.hourly_rate}` : 'N/A'}</td>
                    <td>{trainer.max_trainees || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${trainer.status}`}>
                        {trainer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderInternships = () => {
    return (
      <div className="table-section">
        <h2>All Internships</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : internships.length === 0 ? (
          <div className="loading">No internships found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Internship ID</th>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Description</th>
                  <th>Requirements</th>
                  <th>Specialization</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {internships.map((internship) => (
                  <tr key={internship.id}>
                    <td>{internship.id}</td>
                    <td>{internship.title}</td>
                    <td>{internship.company_name || 'N/A'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {internship.description || 'N/A'}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {internship.requirements || 'N/A'}
                    </td>
                    <td>{internship.specialization || 'N/A'}</td>
                    <td>{internship.capacity || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${internship.status}`}>
                        {internship.status}
                      </span>
                    </td>
                    <td>{internship.created_at ? new Date(internship.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPartnerships = () => {
    return (
      <div className="table-section">
        <h2>All Partnerships</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : partnerships.length === 0 ? (
          <div className="loading">No partnerships found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Partnership ID</th>
                  <th>University</th>
                  <th>Company</th>
                  <th>Agreement Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>University Contact</th>
                  <th>Company Contact</th>
                  <th>Terms & Conditions</th>
                </tr>
              </thead>
              <tbody>
                {partnerships.map((partnership) => (
                  <tr key={partnership.id}>
                    <td>{partnership.id}</td>
                    <td>{partnership.university_name || 'N/A'}</td>
                    <td>{partnership.company_name || 'N/A'}</td>
                    <td>{partnership.agreement_date ? new Date(partnership.agreement_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{partnership.agreement_end_date ? new Date(partnership.agreement_end_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{partnership.agreement_duration || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${partnership.status}`}>
                        {partnership.status}
                      </span>
                    </td>
                    <td>{partnership.contact_person_university || 'N/A'}</td>
                    <td>{partnership.contact_person_company || 'N/A'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {partnership.terms_and_conditions || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        {/* Profile Section */}
        <div className="admin-profile-section">
          <div className="admin-avatar">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="admin-info">
            <h3>{user?.full_name}</h3>
            <p>{user?.email}</p>
            <span className="admin-badge">
              Administrator
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users
          </button>
          <button
            className={`nav-item ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Companies
          </button>
          <button
            className={`nav-item ${activeTab === 'universities' ? 'active' : ''}`}
            onClick={() => setActiveTab('universities')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
            Universities
          </button>
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Students
          </button>
          <button
            className={`nav-item ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Trainers
          </button>
          <button
            className={`nav-item ${activeTab === 'internships' ? 'active' : ''}`}
            onClick={() => setActiveTab('internships')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Internships
          </button>
          <button
            className={`nav-item ${activeTab === 'partnerships' ? 'active' : ''}`}
            onClick={() => setActiveTab('partnerships')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Partnerships
          </button>
        </nav>

        {/* Logout Button */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="main-header">
          <h1>Admin Dashboard</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'companies' && renderCompanies()}
        {activeTab === 'universities' && renderUniversities()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'trainers' && renderTrainers()}
        {activeTab === 'internships' && renderInternships()}
        {activeTab === 'partnerships' && renderPartnerships()}
      </div>
    </div>
  );
}

export default AdminDashboard;
