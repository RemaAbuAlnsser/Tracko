import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send login request to backend
      const response = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - store user data and redirect based on user type
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on user type
        switch(data.user.user_type) {
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'company':
            // Check if user is a trainer
            try {
              const trainerResponse = await fetch(`http://localhost:5050/api/trainers/user/${data.user.id}`);
              if (trainerResponse.ok) {
                const trainerData = await trainerResponse.json();
                if (trainerData.success && trainerData.trainer) {
                  // User is a trainer, redirect to trainer dashboard
                  navigate('/trainer-dashboard');
                } else {
                  // User is a company, redirect to company dashboard
                  navigate('/company-dashboard');
                }
              } else {
                // If API fails, default to company dashboard
                navigate('/company-dashboard');
              }
            } catch (error) {
              console.error('Error checking trainer status:', error);
              navigate('/company-dashboard');
            }
            break;
          case 'university':
            navigate('/university-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        // Show error message from server
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="App">
      {/* Header Navigation */}
      <header className="header">
        <div className="header-left">
          <h1
            className="logo-text"
            onClick={() => navigate('/')}
          >
            TRACKO
          </h1>
        </div>
        <nav className="header-nav">
          <button className="nav-link" onClick={() => scrollToSection('companies')}>Companies</button>
          <button className="nav-link" onClick={() => scrollToSection('universities')}>University</button>
          <button className="nav-link" onClick={() => scrollToSection('about')}>About Us</button>
          <button className="nav-link" onClick={() => navigate('/login')}>Login</button>
          {/* <button className="nav-link nav-link-signup" onClick={() => navigate('/signup')}>Sign Up</button> */}
        </nav>
      </header>

      {/* Login Section */}
      <section className="login-section">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your account</p>
            </div>
            
            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '12px',
                  marginBottom: '20px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c33',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={loading} />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
              
              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="login-footer">
              <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign up</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-logo">
              <h2>TRACKO</h2>
              <p>Connecting Dreams</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h3>Platform</h3>
                <a href="#">For Students</a>
                <a href="#">For Companies</a>
                <a href="#">For Universities</a>
              </div>
              <div className="footer-column">
                <h3>Services</h3>
                <a href="#">Job Matching</a>
                <a href="#">Career Guidance</a>
                <a href="#">Support</a>
              </div>
              <div className="footer-column">
                <h3>Resources</h3>
                <a href="#">Blog</a>
                <a href="#">FAQ</a>
                <a href="#">Documentation</a>
              </div>
              <div className="footer-column">
                <h3>Company</h3>
                <a href="#">About Us</a>
                <a href="#">Contact</a>
                <a href="#">Careers</a>
              </div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <div className="social-icons-footer">
              <a href="#" className="social-icon-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="social-icon-link" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="social-icon-link" aria-label="RSS">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
                </svg>
              </a>
              <a href="#" className="social-icon-link" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="social-icon-link" aria-label="More">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </a>
            </div>
            <p className="copyright">©Copyright. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
