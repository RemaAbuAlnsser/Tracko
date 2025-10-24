import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentDashboard.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [recommendedInternships, setRecommendedInternships] = useState([]);
  const [partnershipInternships, setPartnershipInternships] = useState([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
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
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showInternshipDetails, setShowInternshipDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savedInternships, setSavedInternships] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [studentId, setStudentId] = useState(null);
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
    console.log('👤 User loaded:', parsedUser);
    loadDashboardData();
    loadStudentData(parsedUser.id);
    loadPartnershipInternships(parsedUser.id);
    loadSavedInternshipsWithUser(parsedUser);
    loadNotificationsOnLogin(parsedUser);
  }, [navigate]);

  const loadSavedInternshipsWithUser = async (userData) => {
    if (!userData) return;
    
    try {
      console.log('📚 Loading saved internships for user:', userData.id);
      const response = await fetch(`http://localhost:5050/api/matching/student/${userData.id}/saved`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Saved internships loaded:', data.data);
        setSavedInternships(data.data || []);
      }
    } catch (error) {
      console.error('Error loading saved internships:', error);
    }
  };

  const loadStudentData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/students/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.student) {
          setStudentId(data.student.id);
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

          // Load CV data if exists
          await loadStudentCV(data.student.id);
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const loadStudentCV = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/cvs/student-id/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cv) {
          // Set CV file name
          if (data.cv.file_path) {
            const fileName = data.cv.file_path.split('/').pop();
            setCvFileName(fileName);
          }
          
          // Set CV analysis if exists
          if (data.cv.analysis_data) {
            try {
              const analysisData = typeof data.cv.analysis_data === 'string' 
                ? JSON.parse(data.cv.analysis_data) 
                : data.cv.analysis_data;
              setCvAnalysis(analysisData);
              console.log('✅ CV analysis loaded from database');
            } catch (e) {
              console.error('Error parsing CV analysis:', e);
            }
          }
        }
      } else if (response.status === 404) {
        // No CV found - this is normal for new students
        console.log('ℹ️ No CV found for this student yet');
      }
    } catch (error) {
      console.error('Error loading CV:', error);
    }
  };

  const loadPartnershipInternships = async (userId) => {
    try {
      setLoadingInternships(true);
      
      // First, run AI matching to refresh data
      await runAIMatching(userId);
      
      // Then, load the matched internships
      const response = await fetch(`http://localhost:5050/api/matching/student/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPartnershipInternships(data.matches || []);
        }
      }
    } catch (error) {
      console.error('Error loading partnership internships:', error);
    } finally {
      setLoadingInternships(false);
    }
  };

  const runAIMatching = async (userId) => {
    try {
      console.log('🤖 Running AI matching...');
      const response = await fetch(`http://localhost:5050/api/matching/student/${userId}/run`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ AI matching completed: ${data.matchCount} matches found`);
      }
    } catch (error) {
      console.error('Error running AI matching:', error);
    }
  };

  const handleViewDetails = async (internshipId) => {
    try {
      setLoadingDetails(true);
      console.log('🔍 Loading internship details for ID:', internshipId);
      const response = await fetch(`http://localhost:5050/api/internships/${internshipId}`);
      
      console.log('📡 Response status:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.success && data.internship) {
          console.log('✅ Internship loaded successfully:', data.internship);
          // Check if this internship is already saved
          const isSaved = savedInternships.some(saved => saved.internship_id === internshipId);
          setSelectedInternship({
            ...data.internship,
            isSaved: isSaved
          });
          setShowInternshipDetails(true);
        } else {
          console.error('❌ Invalid data structure:', data);
          alert('Failed to load internship details');
        }
      } else {
        console.error('❌ Response not OK:', response.status);
        alert('Failed to load internship details');
      }
    } catch (error) {
      console.error('❌ Error loading internship details:', error);
      alert('An error occurred while loading internship details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setShowInternshipDetails(false);
    setSelectedInternship(null);
  };

  const handleApplyInternship = async () => {
    if (!selectedInternship || !user) return;
    
    try {
      console.log(`📝 Applying to internship ${selectedInternship.id}...`);
      const response = await fetch(
        `http://localhost:5050/api/matching/student/${user.id}/apply/${selectedInternship.id}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Application submitted successfully!');
        handleCloseDetails();
      } else {
        alert('❌ Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to internship:', error);
      alert('❌ An error occurred while submitting application');
    }
  };

  const handleSaveInternship = async () => {
    if (!selectedInternship || !user) return;
    
    try {
      if (selectedInternship.isSaved) {
        // Unsave the internship
        console.log(`🗑️ Unsaving internship ${selectedInternship.id}...`);
        const response = await fetch(
          `http://localhost:5050/api/matching/student/${user.id}/unsave/${selectedInternship.id}`,
          { method: 'POST' }
        );
        
        const data = await response.json();
        
        if (data.success) {
          alert('✅ Internship removed from saved list!');
          // Reload saved internships
          loadSavedInternships();
          handleCloseDetails();
        } else {
          alert('❌ Failed to unsave internship');
        }
      } else {
        // Save the internship
        console.log(`💾 Saving internship ${selectedInternship.id}...`);
        const response = await fetch(
          `http://localhost:5050/api/matching/student/${user.id}/save/${selectedInternship.id}`,
          { method: 'POST' }
        );
        
        const data = await response.json();
        
        if (data.success) {
          alert('✅ Internship saved successfully!');
          // Reload saved internships
          loadSavedInternships();
          handleCloseDetails();
        } else {
          alert('❌ Failed to save internship');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving internship:', error);
      alert('❌ An error occurred');
    }
  };

  const loadSavedInternships = async () => {
    if (!user) return;
    
    try {
      console.log('📚 Loading saved internships...');
      const response = await fetch(`http://localhost:5050/api/matching/student/${user.id}/saved`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Saved internships loaded:', data.data);
        setSavedInternships(data.data || []);
      }
    } catch (error) {
      console.error('Error loading saved internships:', error);
    }
  };

  const loadTrainingPlans = async () => {
    if (!studentId) {
      console.log('No student ID found');
      return;
    }
    
    try {
      console.log('📋 Loading training plans for student:', studentId);
      const response = await fetch(`http://localhost:5050/api/plans/student/${studentId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Training plans loaded:', data.plans);
        setTrainingPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading training plans:', error);
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

  const loadNotificationsOnLogin = async (userData) => {
    if (!userData) {
      console.log('❌ No user data provided');
      return;
    }
    
    console.log('🔔 Loading notifications on login for user:', userData.id);
    
    try {
      const response = await fetch(`http://localhost:5050/api/notifications/user/${userData.id}`);
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        console.log(`✅ Notifications loaded: ${data.notifications.length} total`);
        const unreadCount = data.notifications.filter(n => !n.is_read).length;
        console.log(`📬 Unread notifications: ${unreadCount}`);
        setNotifications(data.notifications || []);
      } else {
        console.log('⚠️ API returned error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Loading notifications for user:', user.id);
    
    try {
      const response = await fetch(`http://localhost:5050/api/notifications/user/${user.id}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Notifications loaded:', data.notifications.length);
        setNotifications(data.notifications || []);
      } else {
        console.log('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        ));
        console.log('Notification marked as read');
      } else {
        console.error('Failed to mark notification as read:', data.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
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

  const handleCVChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please upload PDF, DOC, or DOCX file only' });
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      
      setSelectedCV(file);
      setCvFileName(file.name);
      setMessage({ type: '', text: '' });
    }
  };

  const handleCVUpload = async () => {
    if (!selectedCV) {
      setMessage({ type: 'error', text: 'Please select a CV file first' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Step 1: Upload CV
      const formData = new FormData();
      formData.append('cv', selectedCV);

      const uploadResponse = await fetch('http://localhost:5050/api/upload/cv', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        setMessage({ type: 'error', text: uploadData.message || 'Failed to upload CV' });
        setLoading(false);
        return;
      }

      setMessage({ type: 'success', text: 'CV uploaded! Analyzing with AI...' });

      // Step 2: Analyze CV with AI
      const analyzeResponse = await fetch('http://localhost:5001/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_path: uploadData.filePath
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeResponse.ok && analyzeData.success) {
        console.log('AI Analysis Result:', analyzeData.analysis);
        
        // Step 3: Save CV record to database
        const saveCVResponse = await fetch('http://localhost:5050/api/cvs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            cv_file: uploadData.filePath,
            analysis_data: analyzeData.analysis
          }),
        });

        const saveCVData = await saveCVResponse.json();

        if (saveCVResponse.ok && saveCVData.success) {
          setMessage({ 
            type: 'success', 
            text: `CV analyzed successfully!` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `CV analyzed! (DB save failed)` 
          });
        }
        
        // Set analysis results to display
        setCvAnalysis(analyzeData.analysis);
        setSelectedCV(null);
        setCvFileName('');
      } else {
        setMessage({ 
          type: 'error', 
          text: analyzeData.message || 'AI analysis failed, but CV was uploaded' 
        });
      }
    } catch (error) {
      console.error('CV upload/analysis error:', error);
      setMessage({ type: 'error', text: 'Failed to process CV' });
    } finally {
      setLoading(false);
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
            className={`nav-item ${activeMenu === 'cv-upload' ? 'active' : ''}`}
            onClick={() => setActiveMenu('cv-upload')}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved Internships
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
            onClick={() => { setActiveMenu('notifications'); loadNotifications(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
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

          <button 
            className={`nav-item ${activeMenu === 'plans' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('plans'); loadTrainingPlans(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Training Plans
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

        {activeMenu === 'cv-upload' && (
          <>
            <div className="cv-upload-section">
              <div className="cv-header">
                <div className="cv-header-icon">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="cv-header-text">
                  <h2>CV Upload & AI Analysis</h2>
                  <p>Upload your CV to get AI-powered skills analysis and match recommendations</p>
                </div>
                <button className="cv-preview-btn">Preview</button>
              </div>

              {message.text && (
                <div className={`alert alert-${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="cv-upload-container">
                <div className="cv-upload-box">
                  <div className="cv-upload-icon">
                    <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3>Upload Your CV</h3>
                  <p className="cv-upload-description">Drag and drop your CV here, or click to browse</p>
                  
                  {cvFileName && (
                    <div className="cv-selected-file">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span>{cvFileName}</span>
                    </div>
                  )}

                  <label htmlFor="cv-file" className="cv-choose-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </label>
                  <input 
                    id="cv-file"
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVChange}
                    style={{ display: 'none' }}
                  />
                  <p className="cv-upload-formats">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                </div>

                {selectedCV && (
                  <button 
                    className="btn-upload-cv" 
                    onClick={handleCVUpload}
                    disabled={loading}
                  >
                    {loading ? 'Uploading...' : 'Upload & Analyze'}
                  </button>
                )}
              </div>

              {/* AI Analysis Results */}
              {cvAnalysis && (
                <div className="cv-analysis-results">
                  <div className="analysis-header">
                    <h3>
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                      AI Analysis Results
                    </h3>
                    <button className="btn-clear-analysis" onClick={() => setCvAnalysis(null)}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="analysis-grid">
                    {/* Personal Info */}
                    <div className="analysis-card">
                      <div className="analysis-card-header">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                        <h4>Personal Information</h4>
                      </div>
                      <div className="analysis-items">
                        {cvAnalysis.Name && (
                          <div className="analysis-item">
                            <span className="item-label">Name:</span>
                            <span className="item-value">{cvAnalysis.Name}</span>
                          </div>
                        )}
                        {cvAnalysis.Email && (
                          <div className="analysis-item">
                            <span className="item-label">Email:</span>
                            <span className="item-value">{cvAnalysis.Email}</span>
                          </div>
                        )}
                        {cvAnalysis.Phone && (
                          <div className="analysis-item">
                            <span className="item-label">Phone:</span>
                            <span className="item-value">{cvAnalysis.Phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Info */}
                    <div className="analysis-card">
                      <div className="analysis-card-header">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                          <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/>
                        </svg>
                        <h4>Academic Information</h4>
                      </div>
                      <div className="analysis-items">
                        {cvAnalysis.Degree && (
                          <div className="analysis-item">
                            <span className="item-label">Degree:</span>
                            <span className="item-value">{cvAnalysis.Degree}</span>
                          </div>
                        )}
                        {cvAnalysis.GPA && (
                          <div className="analysis-item">
                            <span className="item-label">GPA:</span>
                            <span className="item-value">{cvAnalysis.GPA}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {cvAnalysis.Skills && cvAnalysis.Skills.length > 0 && (
                      <div className="analysis-card analysis-card-full">
                        <div className="analysis-card-header">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                          </svg>
                          <h4>Skills</h4>
                        </div>
                        <div className="skills-tags">
                          {cvAnalysis.Skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {cvAnalysis.Experience && cvAnalysis.Experience.length > 0 && (
                      <div className="analysis-card analysis-card-full">
                        <div className="analysis-card-header">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                          </svg>
                          <h4>Experience</h4>
                        </div>
                        <div className="experience-list">
                          {cvAnalysis.Experience.map((exp, index) => (
                            <div key={index} className="experience-item">
                              <div className="exp-position">{exp.position || 'Position'}</div>
                              <div className="exp-company">{exp.company || 'Company'}</div>
                              {exp.duration && <div className="exp-duration">{exp.duration}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu === 'internships' && (
          <>
            <div className="main-header">
              <h1>AI-Matched Internships</h1>
              <p>Internships matched to your skills and profile - sorted by compatibility</p>
            </div>

            {loadingInternships ? (
              <div className="loading-container">
                <p>Loading internships...</p>
              </div>
            ) : partnershipInternships.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3>No Internships Available</h3>
                <p>There are currently no internships from companies partnered with your university.</p>
              </div>
            ) : (
              <div className="internships-grid">
                {partnershipInternships.map(internship => (
                  <div key={internship.id} className="internship-card">
                    {/* Match Percentage Badge */}
                    <div className="match-badge-container">
                      <div className={`match-badge ${
                        internship.match_percentage >= 80 ? 'match-excellent' :
                        internship.match_percentage >= 60 ? 'match-good' :
                        internship.match_percentage >= 40 ? 'match-fair' : 'match-low'
                      }`}>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span>{Math.round(internship.match_percentage)}% Match</span>
                      </div>
                    </div>

                    <div className="internship-header">
                      <div className="company-logo">
                        {internship.company_logo ? (
                          <img src={`http://localhost:5050${internship.company_logo}`} alt={internship.company_name} />
                        ) : (
                          <div className="logo-placeholder">
                            {internship.company_name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="internship-title-section">
                        <h3>{internship.internship_title || internship.title}</h3>
                        <p className="company-name">{internship.company_name}</p>
                      </div>
                    </div>
                    
                    <div className="internship-details">
                      {internship.specialization && (
                        <div className="detail-item">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                            <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/>
                          </svg>
                          <span>{internship.specialization || internship.internship_specialization}</span>
                        </div>
                      )}
                      {internship.min_gpa && (
                        <div className={`detail-item ${internship.gpa_match === false ? 'gpa-mismatch' : ''}`}>
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span>
                            Min GPA: {internship.min_gpa}
                            {(() => {
                              // Get GPA from CV analysis_data first, fallback to studentData
                              const studentGPA = cvAnalysis?.GPA || studentData.gpa;
                              if (studentGPA) {
                                return (
                                  <span className={`student-gpa ${parseFloat(studentGPA) >= parseFloat(internship.min_gpa) ? 'gpa-sufficient' : 'gpa-insufficient'}`}>
                                    {' '}| Your GPA: {studentGPA}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {internship.gpa_match === false && (
                              <span className="gpa-mismatch-text" title="Your GPA is below the minimum requirement">
                                {' '}(Below Required)
                              </span>
                            )}
                            {internship.gpa_match === true && (
                              <span className="gpa-match-text" title="Your GPA meets the requirement">
                                {' '}✓
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {internship.work_mode && (
                        <div className="detail-item">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <span>{internship.work_mode === 'onsite' ? '🏢 Onsite' : internship.work_mode === 'online' ? '💻 Online' : '🔄 Hybrid'}</span>
                        </div>
                      )}
                      {internship.industry && (
                        <div className="detail-item">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                          </svg>
                          <span>{internship.industry}</span>
                        </div>
                      )}
                      {internship.capacity && (
                        <div className="detail-item">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                          </svg>
                          <span>{internship.capacity} positions</span>
                        </div>
                      )}
                    </div>

                    {internship.description && (
                      <div className="internship-description">
                        <p>{internship.description.length > 150 ? internship.description.substring(0, 150) + '...' : internship.description}</p>
                      </div>
                    )}

                    {/* Match Details Section */}
                    {(internship.matched_skills || internship.matched_categories) && (
                      <div className="match-details-section">
                        <h4 className="match-details-title">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Why this match?
                        </h4>
                        
                        {/* Matched Skills */}
                        {internship.matched_skills && internship.matched_skills.length > 0 && (
                          <div className="match-detail-group">
                            <p className="match-label">Matched Skills:</p>
                            <div className="skills-tags">
                              {internship.matched_skills.map((skill, idx) => (
                                <span key={idx} className="skill-tag skill-matched">
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matched Categories */}
                        {internship.matched_categories && Object.keys(internship.matched_categories).length > 0 && (
                          <div className="match-detail-group">
                            <p className="match-label">Matched Categories:</p>
                            <div className="categories-list">
                              {Object.entries(internship.matched_categories).map(([category, skills]) => (
                                <div key={category} className="category-item">
                                  <span className="category-name">{category}</span>
                                  <div className="category-skills">
                                    {skills.map((skill, idx) => (
                                      <span key={idx} className="category-skill">{skill}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="internship-footer">
                      {/* <span className="status-badge status-open">{internship.internship_status || internship.status}</span> */}
                      <button 
                        className="btn-view-details" 
                        onClick={() => handleViewDetails(internship.internship_id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Saved Internships Section */}
        {activeMenu === 'details' && (
          <div className="content-section">
            <div className="section-header">
              <h2>Saved Internships</h2>
              <p className="section-subtitle">Internships you've saved for later</p>
            </div>

            {savedInternships.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3>No Saved Internships</h3>
                <p>You haven't saved any internships yet. Browse internships and click "Save for Later" to add them here.</p>
              </div>
            ) : (
              <div className="internships-grid">
                {savedInternships.map((internship) => (
                  <div key={internship.id} className="internship-card">
                    <div className="internship-header">
                      <div className="company-logo">
                        {internship.company_logo ? (
                          <img src={`http://localhost:5050${internship.company_logo}`} alt={internship.company_name} />
                        ) : (
                          <div className="logo-placeholder">
                            {internship.company_name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="internship-info">
                        <h3>{internship.internship_title}</h3>
                        <p className="company-name">{internship.company_name}</p>
                      </div>
                    </div>

                    {internship.internship_specialization && (
                      <div className="specialization-badge">
                        {internship.internship_specialization}
                      </div>
                    )}

                    {internship.match_percentage > 0 && (
                      <div className="match-score">
                        <div className="match-percentage">
                          <span className="percentage-value">{internship.match_percentage}%</span>
                          <span className="percentage-label">Match</span>
                        </div>
                      </div>
                    )}

                    <div className="internship-footer">
                      <span className="status-badge status-open">{internship.internship_status || 'open'}</span>
                      <button 
                        className="btn-view-details" 
                        onClick={() => handleViewDetails(internship.internship_id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeMenu !== 'dashboard' && activeMenu !== 'profile' && activeMenu !== 'cv-upload' && activeMenu !== 'internships' && activeMenu !== 'details' && activeMenu !== 'notifications' && (
          <div className="placeholder-content">
            <h2>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)} Page</h2>
            <p>This section is under development</p>
          </div>
        )}

        {/* Internship Details Modal */}
        {showInternshipDetails && selectedInternship && (
          <div className="modal-overlay" onClick={handleCloseDetails}>
            <div className="modal-content internship-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Internship Details</h2>
                <button className="modal-close-btn" onClick={handleCloseDetails}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                {/* Company Header */}
                <div className="detail-company-header">
                  <div className="detail-company-logo">
                    {selectedInternship.company_logo ? (
                      <img src={`http://localhost:5050${selectedInternship.company_logo}`} alt={selectedInternship.company_name} />
                    ) : (
                      <div className="detail-logo-placeholder">
                        {selectedInternship.company_name?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="detail-company-info">
                    <h3>{selectedInternship.title}</h3>
                    <p className="detail-company-name">{selectedInternship.company_name}</p>
                  </div>
                </div>

                {/* Internship Information */}
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Basic Information
                  </h4>
                  <div className="detail-info-grid">
                    {selectedInternship.specialization && (
                      <div className="detail-info-item">
                        <span className="detail-label">Specialization:</span>
                        <span className="detail-value">{selectedInternship.specialization}</span>
                      </div>
                    )}
                    {selectedInternship.min_gpa && (
                      <div className="detail-info-item">
                        <span className="detail-label">Minimum GPA:</span>
                        <span className="detail-value">{selectedInternship.min_gpa}</span>
                      </div>
                    )}
                    {selectedInternship.work_mode && (
                      <div className="detail-info-item">
                        <span className="detail-label">Work Mode:</span>
                        <span className="detail-value">
                          {selectedInternship.work_mode === 'onsite' ? '🏢 Onsite' : 
                           selectedInternship.work_mode === 'online' ? '💻 Online' : '🔄 Hybrid'}
                        </span>
                      </div>
                    )}
                    {selectedInternship.capacity && (
                      <div className="detail-info-item">
                        <span className="detail-label">Available Positions:</span>
                        <span className="detail-value">{selectedInternship.capacity}</span>
                      </div>
                    )}
                    {selectedInternship.status && (
                      <div className="detail-info-item">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-status-badge status-${selectedInternship.status}`}>
                          {selectedInternship.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedInternship.description && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                      Description
                    </h4>
                    <p className="detail-description">{selectedInternship.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {selectedInternship.requirements && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                      </svg>
                      Requirements
                    </h4>
                    <p className="detail-requirements">{selectedInternship.requirements}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="detail-actions">
                  <button className="btn-apply-internship" onClick={handleApplyInternship}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Apply Now
                  </button>
                  <button 
                    className={`btn-save-internship ${selectedInternship.isSaved ? 'saved' : ''}`} 
                    onClick={handleSaveInternship}
                  >
                    {selectedInternship.isSaved ? (
                      <>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Unsave
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save for Later
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeMenu === 'notifications' && (
          <div className="notifications-section">
            <div className="section-header">
              <h2>Notifications</h2>
              <p>Stay updated with your application status and important messages</p>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3>No Notifications Yet</h3>
                <p>You'll see notifications here when companies respond to your applications</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-icon">
                      {notification.type === 'application' ? (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <>
                        <button 
                          className="mark-read-btn"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Read
                        </button>
                        <div className="unread-indicator"></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Training Plans Section */}
        {activeMenu === 'plans' && (
          <div className="plans-section">
            <div className="section-header">
              <h2>Training Plans</h2>
              <p>View training plans published by your trainers</p>
            </div>

            {trainingPlans.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3>No Training Plans Yet</h3>
                <p>No training plans have been published yet for your internships</p>
              </div>
            ) : (
              <div className="plans-grid">
                {trainingPlans.map(plan => (
                  <div key={plan.id} className="plan-card">
                    <div className="plan-header">
                      <div className="plan-company-info">
                        {plan.company_logo ? (
                          <img 
                            src={`http://localhost:5050${plan.company_logo}`} 
                            alt={plan.company_name}
                            className="plan-company-logo"
                          />
                        ) : (
                          <div className="plan-company-placeholder">
                            {plan.company_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3>{plan.title}</h3>
                          <p className="plan-internship-title">{plan.internship_title}</p>
                          <p className="plan-company-name">{plan.company_name}</p>
                        </div>
                      </div>
                      <span className={`plan-status-badge status-${plan.status}`}>
                        {plan.status === 'draft' ? 'Draft' : plan.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>

                    <div className="plan-info">
                      <div className="plan-info-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                        <span>Trainer: {plan.trainer_name}</span>
                      </div>
                      <div className="plan-info-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span>Duration: {plan.duration_weeks} weeks</span>
                      </div>
                      {plan.start_date && (
                        <div className="plan-info-item">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                          <span>Start Date: {new Date(plan.start_date).toLocaleDateString('en-US')}</span>
                        </div>
                      )}
                    </div>

                    {plan.description && (
                      <div className="plan-description">
                        <p>{plan.description}</p>
                      </div>
                    )}

                    {plan.weeks && plan.weeks.length > 0 && (
                      <div className="plan-weeks">
                        <h4>Plan Content ({plan.weeks.length} weeks)</h4>
                        <div className="weeks-list">
                          {plan.weeks.map(week => (
                            <div key={week.id} className="week-item">
                              <div className="week-header">
                                <span className="week-number">Week {week.week_number}</span>
                                <h5>{week.title}</h5>
                              </div>
                              {week.description && (
                                <p className="week-description">{week.description}</p>
                              )}
                              {week.objectives && (
                                <div className="week-detail">
                                  <strong>Objectives:</strong>
                                  <p>{week.objectives}</p>
                                </div>
                              )}
                              {week.tasks && (
                                <div className="week-detail">
                                  <strong>Tasks:</strong>
                                  <p>{week.tasks}</p>
                                </div>
                              )}
                              {week.deliverables && (
                                <div className="week-detail">
                                  <strong>Deliverables:</strong>
                                  <p>{week.deliverables}</p>
                                </div>
                              )}
                              {week.resources && (
                                <div className="week-detail">
                                  <strong>Resources:</strong>
                                  <p>{week.resources}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="plan-footer">
                      <span className="plan-date">
                        Published: {new Date(plan.created_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
