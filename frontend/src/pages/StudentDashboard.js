import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      // If no user data, redirect to login
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a student
    if (parsedUser.user_type !== 'student') {
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
          <h1>Student Dashboard</h1>
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
                <li style={{ marginBottom: '10px' }}>📚 Browse Job Opportunities</li>
                <li style={{ marginBottom: '10px' }}>📝 Update Your Profile</li>
                <li style={{ marginBottom: '10px' }}>💼 View Applications</li>
                <li style={{ marginBottom: '10px' }}>🎓 Career Resources</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
