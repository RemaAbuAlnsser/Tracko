import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [universitiesCount, setUniversitiesCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Define image arrays based on file naming convention
  const companies = [
    '/image/asal_cmp.png',
    '/image/foothill_cmp.png',
    '/image/itg_cmp.png',
    '/image/exalt_cmp.png',
    '/image/ghadeer_cmp.png',
    '/image/jawal_cmp.png',
   
  ];

  const universities = [

    '/image/najah_unv.png',
    '/image/Birzeit_unv.png',
     '/image/Khad_unv.png',
      '/image/boltic_unv.png',
       '/image/american_unv.png',
        '/image/alqods_univ.png'
  ];


  // Animated counter for hero stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            // Animate students count to 10000
            const studentsTarget = 10000;
            const studentsIncrement = studentsTarget / 100;
            let studentsCounter = 0;
            const studentsTimer = setInterval(() => {
              studentsCounter += studentsIncrement;
              if (studentsCounter >= studentsTarget) {
                setStudentsCount(studentsTarget);
                clearInterval(studentsTimer);
              } else {
                setStudentsCount(Math.floor(studentsCounter));
              }
            }, 20);

            // Animate universities count to 50
            const universitiesTarget = 50;
            const universitiesIncrement = universitiesTarget / 100;
            let universitiesCounter = 0;
            const universitiesTimer = setInterval(() => {
              universitiesCounter += universitiesIncrement;
              if (universitiesCounter >= universitiesTarget) {
                setUniversitiesCount(universitiesTarget);
                clearInterval(universitiesTimer);
              } else {
                setUniversitiesCount(Math.floor(universitiesCounter));
              }
            }, 20);

            // Animate companies count to 200
            const companiesTarget = 200;
            const companiesIncrement = companiesTarget / 100;
            let companiesCounter = 0;
            const companiesTimer = setInterval(() => {
              companiesCounter += companiesIncrement;
              if (companiesCounter >= companiesTarget) {
                setCompaniesCount(companiesTarget);
                clearInterval(companiesTimer);
              } else {
                setCompaniesCount(Math.floor(companiesCounter));
              }
            }, 20);
          }
        });
      },
      { threshold: 0.5 }
    );

    const heroElement = document.querySelector('.hero-stats');
    if (heroElement) {
      observer.observe(heroElement);
    }

    return () => {
      if (heroElement) {
        observer.unobserve(heroElement);
      }
    };
  }, [hasAnimated]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="App">
      {/* Header Navigation */}
      <header className="header">
        <div className="header-left">
          <h1
            className="logo-text"
            onClick={() => alert('Logo page will be implemented later!')}
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

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">Your Career Journey Starts Here</div>
            <h1>
              Bridge the Gap Between
              <span className="gradient-text"> Dreams </span>
              and
              <span className="gradient-text"> Opportunities</span>
            </h1>
            <p>Empowering students to connect with top universities and leading companies. 
            Build your future, one connection at a time.</p>
            <div className="hero-buttons">
              <button className="hero-btn secondary" onClick={() => navigate('/login')}>Get Started</button>
              <button className="hero-btn secondary" onClick={() => navigate('/login')}>Learn More</button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat-item">
                <span className="hero-stat-number">{studentsCount >= 1000 ? `${(studentsCount / 1000).toFixed(0)}K` : studentsCount}+</span>
                <span className="hero-stat-label">Students</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">{universitiesCount}+</span>
                <span className="hero-stat-label">Universities</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">{companiesCount}+</span>
                <span className="hero-stat-label">Companies</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://cdn.prod.website-files.com/6645e067437815581429586a/6645e4c4dcbe81af51eb80bf_freepik-export-20240423053531sHwp%201.png"
              alt="Tracko Platform Illustration"
              className="hero-img"
            />
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" className="companies-section">
        <h2>Our Partner Companies</h2>
        <div className="image-carousel">
          <div className="carousel-strip">
            {companies.concat(companies, companies).map((company, index) => (
              <img
                key={`company-${index}`}
                src={company}
                alt="Company Logo"
                className="carousel-image"
                onError={(e) => {
                  console.log('Image failed to load:', company);
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section id="universities" className="universities-section">
        <h2>Our Partner Universities</h2>
        <div className="image-carousel">
          <div className="carousel-strip">
            {universities.concat(universities, universities).map((university, index) => (
              <img
                key={`university-${index}`}
                src={university}
                alt="University Logo"
                className="carousel-image"
                onError={(e) => {
                  console.log('University image failed to load:', university);
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <h2>About Us</h2>
        <div className="about-content">
          <p className="about-description">
            Tracko is a revolutionary platform that bridges the gap between ambitious students, prestigious universities,
            and leading companies. We empower the next generation of professionals by creating meaningful connections
            and opportunities in the ever-evolving job market.
          </p>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50+</div>
              <div className="stat-label">Universities</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">200+</div>
              <div className="stat-label">Companies</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1M+</div>
              <div className="stat-label">Site Visitors</div>
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

export default Home;
