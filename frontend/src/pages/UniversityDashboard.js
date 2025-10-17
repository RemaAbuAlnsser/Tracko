import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function UniversityDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a university
    if (parsedUser.user_type !== 'university') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-left">
          <h1 className="logo-text">TRACKO</h1>
        </div>
        <nav className="header-nav">
          <span style={{ color: '#fff', marginRight: '20px' }}>Welcome, {user.full_name}</span>
          <button className="nav-link" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <section style={{ padding: '100px 20px', minHeight: '80vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1>University Dashboard</h1>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '30px', 
            borderRadius: '10px',
            marginTop: '30px'
          }}>
            <h2>Welcome, {user.full_name}!</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User Type:</strong> {user.user_type}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            
            <div style={{ marginTop: '30px' }}>
              <h3>Quick Actions</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '10px' }}>🎓 Manage Students</li>
                <li style={{ marginBottom: '10px' }}>🤝 Partner Companies</li>
                <li style={{ marginBottom: '10px' }}>📈 Placement Statistics</li>
                <li style={{ marginBottom: '10px' }}>📋 Reports & Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UniversityDashboard;
