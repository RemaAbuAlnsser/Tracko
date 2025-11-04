import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentDashboard.css';
import '../styles/TrainingPlanTimeline.css';
import { 
  loadChatMessages, 
  sendChatMessage, 
  subscribeToMessages, 
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount 
} from '../utils/chatService';

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
    student_img: '',
    status: ''
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    week_number: 1,
    report_text: '',
    report_file: null
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSolutionFile, setSelectedSolutionFile] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionLink, setSolutionLink] = useState('');
  const [uploadingSubmission, setUploadingSubmission] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState({ type: '', text: '' });
  const [weekStatuses, setWeekStatuses] = useState({});
  const [trainers, setTrainers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messagesChannel, setMessagesChannel] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [hasAcceptedInternship, setHasAcceptedInternship] = useState(false);
  const [acceptedInternshipInfo, setAcceptedInternshipInfo] = useState(null);
  const [matchedInternshipsCount, setMatchedInternshipsCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [certificate, setCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const messagesEndRef = useRef(null);
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

  // Load trainers when user is available to show unread messages badge
  useEffect(() => {
    if (user) {
      loadTrainers();
    }
  }, [user]);

  // Reload trainers when studentData is loaded (to get university)
  useEffect(() => {
    if (user && studentData.university_id) {
      loadTrainers();
    }
  }, [studentData.university_id]);

  // Load training plans when studentId is available
  useEffect(() => {
    if (studentId) {
      loadTrainingPlans();
      loadDashboardStats();
      loadWeeklyReports();
    }
  }, [studentId]);

  // Setup real-time message subscription for student
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time messages
    const channel = subscribeToMessages(user.id, (newMessage) => {
      // Only add message if it's from a trainer (received messages)
      if (selectedTrainer && 
          newMessage.sender_id === selectedTrainer.user_id && 
          newMessage.receiver_id === user.id) {
        // Check if message doesn't already exist
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
      
      // Update unread count for received messages
      if (newMessage.sender_id !== user.id) {
        loadTrainers();
      }
    });

    setMessagesChannel(channel);

    // Cleanup on unmount
    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [user, selectedTrainer]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh notifications every 10 seconds to catch video call invitations
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      loadNotifications();
    }, 10000); // Refresh every 10 seconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [user]);

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
            student_img: data.student.student_img || '',
            status: data.student.status || ''
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

  const handleApplyInternship = () => {
    // Open hours modal instead of applying directly
    setShowHoursModal(true);
  };

  const handleConfirmApplication = async () => {
    if (!selectedInternship || !user) return;
    
    // Validate hours per week
    if (hoursPerWeek < 20) {
      alert('Hours per week must be at least 20 hours');
      return;
    }
    
    try {
      console.log(`📝 Applying to internship ${selectedInternship.id} with ${hoursPerWeek} hours/week...`);
      const response = await fetch(
        `http://localhost:5050/api/matching/student/${user.id}/apply/${selectedInternship.id}`,
        { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hours_per_week: hoursPerWeek })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Application submitted successfully!');
        setShowHoursModal(false);
        setHoursPerWeek(20); // Reset to default
        handleCloseDetails();
      } else {
        alert(`❌ ${data.message || 'Failed to submit application'}`);
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
        
        // Load submission statuses for each plan
        if (data.plans && data.plans.length > 0) {
          for (const plan of data.plans) {
            await loadWeekStatuses(plan.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading training plans:', error);
    }
  };

  const loadWeekStatuses = async (planId) => {
    if (!studentId || !planId) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/task-submissions/student/${studentId}/plan/${planId}/statuses`);
      const data = await response.json();
      
      if (data.success && data.weekStatuses) {
        // Create a map of week_id -> status
        const statusMap = {};
        data.weekStatuses.forEach(ws => {
          statusMap[ws.week_id] = ws.status;
        });
        
        setWeekStatuses(prev => ({
          ...prev,
          [planId]: statusMap
        }));
      }
    } catch (error) {
      console.error('Error loading week statuses:', error);
    }
  };

  // Load weekly reports
  const loadWeeklyReports = async () => {
    if (!studentId) return;
    
    try {
      console.log('📚 Loading weekly reports for student:', studentId);
      const response = await fetch(`http://localhost:5050/api/weekly-reports/student/${studentId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Weekly reports loaded:', data.reports);
        setWeeklyReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading weekly reports:', error);
    }
  };

  // Submit weekly report
  const handleSubmitWeeklyReport = async (e) => {
    e.preventDefault();
    
    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID not found' });
      return;
    }

    if (!newReport.report_text && !newReport.report_file) {
      setMessage({ type: 'error', text: 'Please provide report text or upload a file' });
      return;
    }

    try {
      let reportFileUrl = null;

      // Upload file if provided
      if (newReport.report_file) {
        const formData = new FormData();
        formData.append('file', newReport.report_file);

        const uploadResponse = await fetch('http://localhost:5050/api/upload/file', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadResponse.json();
        
        if (uploadData.success) {
          reportFileUrl = uploadData.filePath;
        } else {
          throw new Error('File upload failed');
        }
      }

      // Get active plan for this student
      let activePlanId = null;
      let trainerId = null;
      let weekId = null;

      if (trainingPlans && trainingPlans.length > 0) {
        // Use the first active plan
        const activePlan = trainingPlans.find(plan => plan.status === 'active') || trainingPlans[0];
        activePlanId = activePlan.id;

        // Get trainer_id from plan
        const planResponse = await fetch(`http://localhost:5050/api/plans/${activePlanId}`);
        const planData = await planResponse.json();
        
        if (planData.success && planData.plan) {
          trainerId = planData.plan.trainer_id;
          
          // Find week_id if matching week number exists in plan
          if (activePlan.weeks && activePlan.weeks.length > 0) {
            const matchingWeek = activePlan.weeks.find(w => w.week_number === newReport.week_number);
            if (matchingWeek) {
              weekId = matchingWeek.id;
            }
          }
        }
      }

      // Submit report
      const reportData = {
        student_id: studentId,
        trainer_id: trainerId,
        plan_id: activePlanId,
        week_number: newReport.week_number,
        report_text: newReport.report_text || '',
        report_file: reportFileUrl
      };

      const response = await fetch('http://localhost:5050/api/weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Weekly report submitted successfully!' });
        setShowReportModal(false);
        setNewReport({
          week_number: 1,
          report_text: '',
          report_file: null
        });
        loadWeeklyReports();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Error submitting weekly report:', error);
      setMessage({ type: 'error', text: 'Server error' });
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
        // Count unread notifications
        const unreadCount = (data.notifications || []).filter(n => !n.is_read).length;
        setUnreadNotificationsCount(unreadCount);
      } else {
        console.log('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };


  // Load certificate
  const loadCertificate = async () => {
    if (!studentId) {
      console.log('⚠️ Cannot load certificate: studentId is missing');
      return;
    }
    
    try {
      console.log('📜 Loading certificate for student:', studentId);
      const certResponse = await fetch(`http://localhost:5050/api/students/${studentId}/certificate`);
      const certData = await certResponse.json();
      console.log('📜 Certificate data:', certData);
      if (certData.success && certData.certificate) {
        console.log('✅ Certificate found:', certData.certificate);
        setCertificate(certData.certificate);
      } else {
        console.log('⚠️ No certificate found for student');
        setCertificate(null);
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      setCertificate(null);
    }
  };

  // Load dashboard stats
  const loadDashboardStats = async () => {
    if (!studentId) {
      console.log('⚠️ Cannot load dashboard stats: studentId is missing');
      return;
    }
    
    console.log('📊 Loading dashboard stats for student:', studentId);
    
    try {
      // Get matched internships count
      const matchesResponse = await fetch(`http://localhost:5050/api/matching/student/${studentId}`);
      const matchesData = await matchesResponse.json();
      if (matchesData.success) {
        setMatchedInternshipsCount(matchesData.data.length);
        // Count interviews (you can adjust this based on your interview status)
        const interviewsScheduled = matchesData.data.filter(m => m.status === 'interview_scheduled').length;
        setInterviewsCount(interviewsScheduled);
      }

      // Load certificate
      await loadCertificate();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  // Load trainers (from accepted internships) and university
  const loadTrainers = async () => {
    if (!user) return;
    try {
      let allContacts = [];
      
      // Get student's accepted internships with trainer info
      const response = await fetch(`http://localhost:5050/api/students/${user.id}/trainers`);
      const data = await response.json();
      if (data.success) {
        const trainersWithUnread = await Promise.all(
          (data.trainers || []).map(async (trainer) => {
            const unreadCount = await getUnreadCount(user.id, trainer.user_id);
            return {
              ...trainer,
              type: 'trainer',
              unread_count: unreadCount
            };
          })
        );
        allContacts = [...trainersWithUnread];
        
        // Check if student has accepted internship
        if (trainersWithUnread.length > 0) {
          setHasAcceptedInternship(true);
          setAcceptedInternshipInfo({
            internship_title: trainersWithUnread[0].internship_title,
            company_name: trainersWithUnread[0].company_name,
            company_logo: trainersWithUnread[0].company_logo
          });
        } else {
          setHasAcceptedInternship(false);
          setAcceptedInternshipInfo(null);
        }
      }
      
      // Get student's university
      if (studentData.university_id) {
        try {
          const universityResponse = await fetch(`http://localhost:5050/api/universities/${studentData.university_id}`);
          const universityData = await universityResponse.json();
          console.log('🎓 University data received:', universityData);
          if (universityData.success && universityData.data) {
            const university = universityData.data;
            console.log('🎓 University details:', {
              id: university.id,
              name: university.name,
              user_id: university.user_id,
              email: university.email
            });
            
            if (!university.user_id) {
              console.error('❌ University user_id is missing!');
            }
            
            const unreadCount = await getUnreadCount(user.id, university.user_id);
            allContacts.unshift({
              ...university,
              type: 'university',
              full_name: university.name,
              unread_count: unreadCount
            });
            console.log('✅ University added to contacts:', allContacts[0]);
          }
        } catch (universityError) {
          console.error('Error loading university:', universityError);
        }
      }
      
      setTrainers(allContacts);
      
      // Calculate total unread messages
      const totalUnread = allContacts.reduce((sum, contact) => sum + (contact.unread_count || 0), 0);
      setTotalUnreadMessages(totalUnread);
      
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  // Load messages for selected trainer
  const loadMessagesWithTrainer = async (trainer) => {
    if (!user || !trainer) return;
    
    console.log('📨 Loading messages with trainer:', {
      trainer_name: trainer.full_name,
      trainer_user_id: trainer.user_id,
      student_user_id: user.id
    });
    
    try {
      const chatMessages = await loadChatMessages(user.id, trainer.user_id);
      console.log('✅ Loaded messages:', chatMessages.length, 'messages');
      console.log('First message sample:', chatMessages[0]);
      setMessages(chatMessages);
      setSelectedTrainer(trainer);
      
      // Mark messages as read
      await markMessagesAsRead(trainer.user_id, user.id);
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message using Supabase
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Send message check:', {
      hasMessage: !!newMessage.trim(),
      hasSelectedTrainer: !!selectedTrainer,
      hasUser: !!user,
      selectedTrainer: selectedTrainer
    });
    
    if (!newMessage.trim() || !selectedTrainer || !user) {
      console.error('❌ Cannot send message - missing required data');
      return;
    }

    const messageText = newMessage.trim();
    
    console.log('📤 Sending message:', {
      sender_id: user.id,
      receiver_id: selectedTrainer.user_id,
      receiver_type: selectedTrainer.type,
      message: messageText
    });
    
    if (!selectedTrainer.user_id) {
      console.error('❌ selectedTrainer.user_id is missing!');
      setMessage({ type: 'error', text: 'Cannot send message: recipient user_id is missing' });
      return;
    }
    
    try {
      // Clear input immediately
      setNewMessage('');
      
      const result = await sendChatMessage(user.id, selectedTrainer.user_id, messageText);
      console.log('📨 Send result:', result);
      
      if (result.success && result.data && result.data[0]) {
        // Add message to state immediately
        const newMsg = result.data[0];
        setMessages(prev => [...prev, newMsg]);
        console.log('✅ Message sent successfully');
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 50);
      } else {
        console.error('❌ Failed to send message:', result);
        setMessage({ type: 'error', text: 'Failed to send message' });
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessage({ type: 'error', text: 'Server error' });
      setNewMessage(messageText);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleSolutionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setSubmissionMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }
      setSelectedSolutionFile(file);
      setSubmissionMessage({ type: '', text: '' });
    }
  };

  const handleSubmitSolution = async () => {
    if (!selectedTask || !studentId) {
      setSubmissionMessage({ type: 'error', text: 'Missing required information' });
      return;
    }

    // Validate at least one submission method
    if (!selectedSolutionFile && !solutionText.trim() && !solutionLink.trim()) {
      setSubmissionMessage({ type: 'error', text: 'Please provide at least one submission method (file, text, or link)' });
      return;
    }

    setUploadingSubmission(true);
    setSubmissionMessage({ type: '', text: '' });

    try {
      let uploadedFilePath = null;

      // Upload file if selected
      if (selectedSolutionFile) {
        const formData = new FormData();
        formData.append('file', selectedSolutionFile);

        const uploadResponse = await fetch('http://localhost:5050/api/upload/file', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          setSubmissionMessage({ type: 'error', text: uploadData.message || 'Failed to upload file' });
          setUploadingSubmission(false);
          return;
        }

        uploadedFilePath = uploadData.filePath;
      }

      // Get trainer_id from the selected plan
      const planResponse = await fetch(`http://localhost:5050/api/plans/${selectedTask.plan_id}`);
      const planData = await planResponse.json();
      
      if (!planData.success || !planData.plan) {
        setSubmissionMessage({ type: 'error', text: 'Failed to get plan information' });
        setUploadingSubmission(false);
        return;
      }

      const trainerId = planData.plan.trainer_id;

      // Submit the solution
      const submitResponse = await fetch('http://localhost:5050/api/task-submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          trainer_id: trainerId,
          week_id: selectedTask.id,
          plan_id: selectedTask.plan_id,
          task_title: selectedTask.tasks || `Week ${selectedTask.week_number}`,
          submission_file: uploadedFilePath,
          submission_text: solutionText.trim() || null,
          submission_link: solutionLink.trim() || null
        }),
      });

      const submitData = await submitResponse.json();

      if (submitResponse.ok && submitData.success) {
        setSubmissionMessage({ 
          type: 'success', 
          text: 'Solution submitted successfully! Your trainer will review it soon.' 
        });
        
        // Reload week statuses to update timeline
        await loadWeekStatuses(selectedTask.plan_id);
        
        // Reset form
        setSelectedSolutionFile(null);
        setSolutionText('');
        setSolutionLink('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowTaskModal(false);
          setSubmissionMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setSubmissionMessage({ 
          type: 'error', 
          text: submitData.message || 'Failed to submit solution' 
        });
      }
    } catch (error) {
      console.error('Submit solution error:', error);
      setSubmissionMessage({ type: 'error', text: 'Failed to submit solution' });
    } finally {
      setUploadingSubmission(false);
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
            onClick={() => { setActiveMenu('messages'); loadTrainers(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Messages/Chat/Meeting
            {totalUnreadMessages > 0 && (
              <span className="notification-badge">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'plans' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('plans'); loadTrainingPlans(); loadWeeklyReports(); }}
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
              <p>Track your internship progress and manage your training activities</p>
            </div>

            {/* Stats Cards */}
            {console.log('Certificate state in render:', certificate)}
            <div style={{ marginTop: '20px' }}>
              <h3>Quick Stats</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '24px',
                marginTop: '20px'
              }}>
                <div style={{ 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                  borderRadius: '16px',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
                onClick={() => setActiveMenu('internships')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#0369a1', fontSize: '16px', fontWeight: '600' }}>Matched Internships</h4>
                  </div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#0c4a6e' }}>
                    {matchedInternshipsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#0369a1', margin: '8px 0 0 0' }}>
                    Internships matching your profile
                  </p>
                </div>
                
                <div style={{ 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                  borderRadius: '16px',
                  border: '1px solid #bbf7d0',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
                onClick={() => setActiveMenu('applications')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#15803d', fontSize: '16px', fontWeight: '600' }}>Interviews Scheduled</h4>
                  </div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>
                    {interviewsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#15803d', margin: '8px 0 0 0' }}>
                    Upcoming interviews
                  </p>
                </div>
                
                <div style={{ 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  borderRadius: '16px',
                  border: '1px solid #fde68a',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
                onClick={() => setActiveMenu('notifications')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#92400e', fontSize: '16px', fontWeight: '600' }}>Unread Notifications</h4>
                  </div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#78350f' }}>
                    {unreadNotificationsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#92400e', margin: '8px 0 0 0' }}>
                    Pending notifications
                  </p>
                </div>

                {studentData.status === 'completed' && (
                  <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
                    borderRadius: '16px',
                    border: '1px solid #fbcfe8',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                  onClick={async () => {
                    setShowCertificateModal(true);
                    await loadCertificate();
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h4 style={{ margin: 0, color: '#9f1239', fontSize: '16px', fontWeight: '600' }}>Certificate</h4>
                    </div>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#881337' }}>
                      Check
                    </p>
                    <p style={{ fontSize: '13px', color: '#9f1239', margin: '8px 0 0 0' }}>
                      View your certificate
                    </p>
                  </div>
                )}
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

            {hasAcceptedInternship ? (
              <div className="empty-state" style={{ 
                background: 'white',
                color: '#1f2937',
                padding: '3rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  width: '80px',
                  height: '80px',
                  background: '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '700' }}>Congratulations!</h2>
                <h3 style={{ color: '#10b981', fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                  You have been accepted to an internship
                </h3>
                {acceptedInternshipInfo && (
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    marginTop: '1.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#4b5563' }}>
                      <strong style={{ color: '#1f2937' }}>Internship:</strong> {acceptedInternshipInfo.internship_title}
                    </p>
                    <p style={{ fontSize: '1rem', color: '#4b5563' }}>
                      <strong style={{ color: '#1f2937' }}>Company:</strong> {acceptedInternshipInfo.company_name}
                    </p>
                  </div>
                )}
                <p style={{ 
                  marginTop: '1.5rem', 
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  lineHeight: '1.6'
                }}>
                  Check the <strong style={{ color: '#10b981' }}>Training Plans</strong> section to view your training schedule and tasks.
                </p>
              </div>
            ) : loadingInternships ? (
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

        {activeMenu !== 'dashboard' && activeMenu !== 'profile' && activeMenu !== 'cv-upload' && activeMenu !== 'internships' && activeMenu !== 'details' && activeMenu !== 'notifications' && activeMenu !== 'messages' && activeMenu !== 'plans' && (
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

        {/* Messages Section */}
        {activeMenu === 'messages' && (
          <>
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Chat with your trainers and university</p>
            </div>

            <div className="chat-container">
              {/* Trainers & University List */}
              <div className="conversations-sidebar">
                <h3>Contacts</h3>
                {trainers.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No contacts yet</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {trainers.map(contact => (
                      <div
                        key={contact.id}
                        className={`conversation-item ${selectedTrainer?.id === contact.id ? 'active' : ''}`}
                        onClick={() => loadMessagesWithTrainer(contact)}
                      >
                        <div className="conversation-avatar" style={contact.type === 'university' ? {background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'} : {}}>
                          {contact.type === 'university' && contact.logo ? (
                            <img 
                              src={`http://localhost:5050${contact.logo}`} 
                              alt={contact.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = contact.name ? contact.name.charAt(0).toUpperCase() : 'U';
                              }}
                            />
                          ) : contact.type === 'trainer' && contact.profile_image ? (
                            <img 
                              src={contact.profile_image.startsWith('http') ? contact.profile_image : `http://localhost:5050${contact.profile_image}`} 
                              alt={contact.full_name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = contact.full_name ? contact.full_name.charAt(0).toUpperCase() : 'T';
                              }}
                            />
                          ) : (
                            contact.full_name ? contact.full_name.charAt(0).toUpperCase() : (contact.type === 'university' ? 'U' : 'T')
                          )}
                        </div>
                        <div className="conversation-info">
                          <h4>{contact.full_name || (contact.type === 'university' ? 'University' : 'Trainer')} {contact.type === 'university' ? '🎓' : ''}</h4>
                          <p className="student-email">{contact.email}</p>
                        </div>
                        {contact.unread_count > 0 && (
                          <span className="unread-count">{contact.unread_count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {!selectedTrainer ? (
                  <div className="empty-state">
                    <h3>Select a Contact</h3>
                    <p>Choose a trainer or university from the list to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="chat-header">
                      <div className="conversation-avatar" style={selectedTrainer.type === 'university' ? {background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'} : {}}>
                        {selectedTrainer.type === 'university' && selectedTrainer.logo ? (
                          <img 
                            src={`http://localhost:5050${selectedTrainer.logo}`} 
                            alt={selectedTrainer.name}
                            style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.textContent = selectedTrainer.name ? selectedTrainer.name.charAt(0).toUpperCase() : 'U';
                            }}
                          />
                        ) : selectedTrainer.type === 'trainer' && selectedTrainer.profile_image ? (
                          <img 
                            src={selectedTrainer.profile_image.startsWith('http') ? selectedTrainer.profile_image : `http://localhost:5050${selectedTrainer.profile_image}`} 
                            alt={selectedTrainer.full_name}
                            style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.textContent = selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : 'T';
                            }}
                          />
                        ) : (
                          selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : (selectedTrainer.type === 'university' ? 'U' : 'T')
                        )}
                      </div>
                      <div>
                        <h3>{selectedTrainer.full_name} {selectedTrainer.type === 'university' ? '🎓' : ''}</h3>
                        <p className="student-info">{selectedTrainer.email}</p>
                      </div>
                    </div>

                    {/* Messages List */}
                    <div className="messages-list">
                      {messages.length === 0 ? (
                        <div className="empty-state-small">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <>
                          {messages.map(msg => {
                            const isSentByStudent = Number(msg.sender_id) === Number(user.id);
                            console.log('📧 Message:', {
                              message: msg.message,
                              sender_id: msg.sender_id,
                              user_id: user.id,
                              isSent: isSentByStudent,
                              types: `sender: ${typeof msg.sender_id}, user: ${typeof user.id}`
                            });
                            return (
                            <div
                              key={msg.id}
                              className={`message-item ${isSentByStudent ? 'sent' : 'received'}`}
                            >
                              {/* Show avatar for receiver (trainer/university) on left */}
                              {!isSentByStudent && selectedTrainer && (
                                <div className="message-avatar" style={selectedTrainer.type === 'university' ? {background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'} : {}}>
                                  {selectedTrainer.type === 'university' && selectedTrainer.logo ? (
                                    <img 
                                      src={`http://localhost:5050${selectedTrainer.logo}`} 
                                      alt={selectedTrainer.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedTrainer.name ? selectedTrainer.name.charAt(0).toUpperCase() : 'U';
                                      }}
                                    />
                                  ) : selectedTrainer.profile_image ? (
                                    <img 
                                      src={selectedTrainer.profile_image.startsWith('http') ? selectedTrainer.profile_image : `http://localhost:5050${selectedTrainer.profile_image}`} 
                                      alt={selectedTrainer.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : 'T';
                                      }}
                                    />
                                  ) : (
                                    selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : (selectedTrainer.type === 'university' ? 'U' : 'T')
                                  )}
                                </div>
                              )}
                              <div className="message-bubble">
                                <p>{msg.message}</p>
                                <span className="message-time">
                                  {new Date(msg.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              {/* Show avatar for sender (student) on right */}
                              {isSentByStudent && (
                                <div className="message-avatar">
                                  {studentData.student_img ? (
                                    <img 
                                      src={`http://localhost:5050${studentData.student_img}`} 
                                      alt={user.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'S';
                                      }}
                                    />
                                  ) : (
                                    user.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'
                                  )}
                                </div>
                              )}
                            </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Message Input */}
                    <form className="message-input-form" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="message-input"
                      />
                      <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
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
                    
                    {/* Video Call Join Button */}
                    {notification.type === 'video_call' && notification.data && (
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          try {
                            const data = JSON.parse(notification.data);
                            if (data.videoCallLink) {
                              window.open(data.videoCallLink, '_blank');
                              markAsRead(notification.id);
                            }
                          } catch (error) {
                            console.error('Error parsing notification data:', error);
                          }
                        }}
                        style={{ 
                          marginRight: '10px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '10px 20px',
                          fontSize: '15px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        📞 Join Call
                      </button>
                    )}
                    
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
                <p>Training plans will appear here once you are accepted to an internship and the company publishes a training plan</p>
              </div>
            ) : (
              <div className="plans-list">
                {trainingPlans.map(plan => (
                  <div key={plan.id} className="training-plan-card">
                    {/* Plan Header */}
                    <div className="plan-card-header">
                      <div className="plan-title-section">
                        <h3>{plan.title}</h3>
                        <p className="plan-company">{plan.company_name}</p>
                        <p className="plan-applied-date">Applied on {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <span className={`plan-status-badge status-${plan.status}`}>
                        {plan.status === 'active' ? 'In Progress' : plan.status === 'completed' ? 'Completed' : 'Draft'}
                      </span>
                    </div>

                    {/* Next Step Section */}
                    {plan.weeks && plan.weeks.length > 0 && (
                      <div className="plan-next-step">
                        <h4>Next Step:</h4>
                        <p>{plan.weeks[0]?.title || 'Start Week 1'} - {plan.weeks[0]?.description || 'Begin your training journey'}</p>
                      </div>
                    )}

                    {/* Application Timeline */}
                    {plan.weeks && plan.weeks.length > 0 && (
                      <div className="application-timeline-section">
                        <h4>Application Timeline:</h4>
                        <div className="timeline-container">
                          {plan.weeks.map((week, index) => {
                            const weekStatus = weekStatuses[plan.id]?.[week.id];
                            const isApproved = weekStatus === 'approved';
                            const isPending = weekStatus === 'pending';
                            const isRejected = weekStatus === 'rejected';
                            
                            return (
                            <div key={week.id} className="timeline-item">
                              <div className={`timeline-dot ${isApproved ? 'approved' : isPending ? 'pending' : ''}`}>
                                {isApproved ? (
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                  </svg>
                                ) : null}
                              </div>
                              {index < plan.weeks.length - 1 && <div className="timeline-line"></div>}
                              <div className="timeline-content">
                                <div className="timeline-task-header">
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    <span className="timeline-task-name">{week.tasks || `Week ${week.week_number}`}</span>
                                    {week.due_date && (() => {
                                      const now = new Date();
                                      const dueDate = new Date(week.due_date);
                                      const diffMs = dueDate - now;
                                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                      const diffDays = Math.floor(diffHours / 24);
                                      const remainingHours = diffHours % 24;
                                      const isOverdue = diffMs < 0;
                                      const isUrgent = diffHours <= 24 && diffHours > 0; // Less than or equal to 1 day
                                      
                                      return (
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          fontSize: '13px',
                                          color: isOverdue ? '#dc2626' : isUrgent ? '#dc2626' : '#6b7280',
                                          fontWeight: '500',
                                          background: isUrgent ? '#fee2e2' : 'transparent',
                                          padding: isUrgent ? '4px 8px' : '0',
                                          borderRadius: isUrgent ? '6px' : '0',
                                          border: isUrgent ? '1px solid #fca5a5' : 'none'
                                        }}>
                                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                          </svg>
                                          Due: {dueDate.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                          {isOverdue ? (
                                            <span style={{ 
                                              color: '#dc2626', 
                                              fontWeight: '700',
                                              fontSize: '12px'
                                            }}>
                                              (Overdue)
                                            </span>
                                          ) : (
                                            <span style={{ 
                                              color: isUrgent ? '#dc2626' : '#059669',
                                              fontWeight: '600',
                                              fontSize: '12px'
                                            }}>
                                              ({diffDays > 0 ? `${diffDays}d ${remainingHours}h` : `${diffHours}h`} left)
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <button 
                                    className="btn-view-task-details"
                                    onClick={() => {
                                      setSelectedTask({ ...week, plan_id: plan.id });
                                      setShowTaskModal(true);
                                    }}
                                  >
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                    </svg>
                                    View Details
                                  </button>
                                </div>
                                <span className="timeline-date">Week {week.week_number}</span>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Weekly Reports Section */}
            <div className="weekly-reports-section" style={{ marginTop: '40px' }}>
              <div className="section-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Weekly Reports</h3>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    Submit your weekly training reports
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Submit Report
                </button>
              </div>

              {/* Reports List */}
              {weeklyReports.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {weeklyReports.map((report) => (
                    <div key={report.id} style={{
                      padding: '20px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>
                          Week {report.week_number}
                        </h4>
                        <span style={{
                          padding: '4px 12px',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Submitted
                        </span>
                      </div>
                      {report.plan_title && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>
                          {report.plan_title}
                        </p>
                      )}
                      {report.report_text && (
                        <p style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: '14px', 
                          color: '#4b5563',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {report.report_text}
                        </p>
                      )}
                      {report.report_file && (
                        <a
                          href={`http://localhost:5050${report.report_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: '#f3f4f6',
                            color: '#667eea',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            textDecoration: 'none',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                          onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                          </svg>
                          View File
                        </a>
                      )}
                      <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        Submitted on {new Date(report.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <svg width="48" height="48" fill="#9ca3af" viewBox="0 0 20 20" style={{ margin: '0 auto 16px' }}>
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                  </svg>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    No weekly reports submitted yet. Click "Submit Report" to add your first report.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Report Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Submit Weekly Report</h2>
                <button className="modal-close" onClick={() => setShowReportModal(false)}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitWeeklyReport}>
                <div className="modal-body">
                  {/* Week Number */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Week Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={newReport.week_number}
                      onChange={(e) => setNewReport({ ...newReport, week_number: parseInt(e.target.value) })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Report Text */}
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Report Text (Optional)
                    </label>
                    <textarea
                      value={newReport.report_text}
                      onChange={(e) => setNewReport({ ...newReport, report_text: e.target.value })}
                      placeholder="Describe your progress and learnings this week..."
                      rows="6"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Upload File (Optional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setNewReport({ ...newReport, report_file: e.target.files[0] })}
                      accept=".pdf,.doc,.docx,.txt"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    />
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                    </p>
                  </div>

                  {message.text && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                      color: message.type === 'success' ? '#166534' : '#991b1b',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {message.text}
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'flex-end',
                  padding: '20px 24px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    style={{
                      padding: '10px 20px',
                      background: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Task Details</h2>
                <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="task-detail-section">
                  <h3>Week {selectedTask.week_number}: {selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="task-week-description">{selectedTask.description}</p>
                  )}
                </div>

                <div className="task-detail-section">
                  <h4>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    Task Name
                  </h4>
                  <p className="task-content">{selectedTask.tasks || 'No task specified'}</p>
                </div>

                {selectedTask.task_description && (
                  <div className="task-detail-section">
                    <h4>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                      </svg>
                      Task Description
                    </h4>
                    <p className="task-content">{selectedTask.task_description}</p>
                  </div>
                )}

                {selectedTask.objectives && (
                  <div className="task-detail-section">
                    <h4>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Learning Objectives
                    </h4>
                    <p className="task-content">{selectedTask.objectives}</p>
                  </div>
                )}

                {selectedTask.deliverables && (
                  <div className="task-detail-section">
                    <h4>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Deliverables
                    </h4>
                    <p className="task-content">{selectedTask.deliverables}</p>
                  </div>
                )}

                {selectedTask.resources && (
                  <div className="task-detail-section">
                    <h4>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd"/>
                        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z"/>
                      </svg>
                      Resources
                    </h4>
                    <p className="task-content">{selectedTask.resources}</p>
                  </div>
                )}

                {selectedTask.due_date && (
                  <div style={{ 
                    background: new Date(selectedTask.due_date) < new Date() 
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: new Date(selectedTask.due_date) < new Date() ? '2px solid #ef4444' : '2px solid #3b82f6',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    marginTop: '16px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: new Date(selectedTask.due_date) < new Date() ? '#ef4444' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ 
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: new Date(selectedTask.due_date) < new Date() ? '#dc2626' : '#1e40af'
                        }}>
                          {new Date(selectedTask.due_date) < new Date() ? '⚠️ Overdue Submission' : '📅 Submission Deadline'}
                        </h4>
                        <p style={{ 
                          margin: '4px 0 0 0',
                          fontSize: '13px',
                          color: new Date(selectedTask.due_date) < new Date() ? '#991b1b' : '#1e3a8a',
                          opacity: 0.8
                        }}>
                          {new Date(selectedTask.due_date) < new Date() ? 'Please submit as soon as possible' : 'Make sure to submit before this date'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <p style={{ 
                        margin: 0,
                        fontWeight: '600',
                        fontSize: '18px',
                        color: new Date(selectedTask.due_date) < new Date() ? '#dc2626' : '#1e40af'
                      }}>
                        {new Date(selectedTask.due_date).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {new Date(selectedTask.due_date) > new Date() && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e40af'
                      }}>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        {(() => {
                          const days = Math.ceil((new Date(selectedTask.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                          const hours = Math.ceil((new Date(selectedTask.due_date) - new Date()) / (1000 * 60 * 60));
                          if (days > 1) return `${days} days remaining`;
                          if (hours > 1) return `${hours} hours remaining`;
                          return 'Less than 1 hour remaining!';
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Solution Section */}
                <div className="task-upload-section">
                  <h4>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    Upload Your Solution
                  </h4>

                  {/* Success/Error Message */}
                  {submissionMessage.text && (
                    <div className={`alert alert-${submissionMessage.type}`} style={{ marginBottom: '1rem' }}>
                      {submissionMessage.text}
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="upload-solution-area">
                    <label htmlFor="solution-upload" className="upload-solution-btn">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>{selectedSolutionFile ? selectedSolutionFile.name : 'Choose File to Upload'}</span>
                    </label>
                    <input 
                      id="solution-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.rar"
                      style={{ display: 'none' }}
                      onChange={handleSolutionFileChange}
                    />
                    <p className="upload-hint">Supported formats: PDF, DOC, DOCX, ZIP, RAR (Max 10MB)</p>
                  </div>

                  {/* Text Solution */}
                  <div className="solution-text-area" style={{ marginTop: '1rem' }}>
                    <label htmlFor="solution-text" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Or write your solution here:
                    </label>
                    <textarea
                      id="solution-text"
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Describe your solution or paste your code here..."
                      rows="6"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Link Solution */}
                  <div className="solution-link-area" style={{ marginTop: '1rem' }}>
                    <label htmlFor="solution-link" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Or provide a link (GitHub, Google Drive, etc.):
                    </label>
                    <input
                      id="solution-link"
                      type="url"
                      value={solutionLink}
                      onChange={(e) => setSolutionLink(e.target.value)}
                      placeholder="https://github.com/username/repo or https://drive.google.com/..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    className="btn-submit-solution"
                    onClick={handleSubmitSolution}
                    disabled={uploadingSubmission}
                    style={{
                      marginTop: '1.5rem',
                      width: '100%',
                      padding: '0.875rem',
                      backgroundColor: '#1e88e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: uploadingSubmission ? 'not-allowed' : 'pointer',
                      opacity: uploadingSubmission ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {uploadingSubmission ? 'Submitting...' : 'Submit Solution'}
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificateModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setShowCertificateModal(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '32px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px 12px 0 0'
              }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    color: 'white', 
                    fontSize: '28px', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    Training Completion Certificate
                  </h2>
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    fontSize: '16px' 
                  }}>
                    Certificate details
                  </p>
                </div>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: '300',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '32px 40px' }}>
                {!certificate ? (
                  <div style={{
                    padding: '16px 20px',
                    background: '#fff7ed',
                    borderRadius: '8px',
                    border: '1px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <svg width="20" height="20" fill="#f59e0b" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p style={{ margin: 0, fontSize: '15px', color: '#c2410c' }}>
                      No certificate is available yet. Please check back later.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      padding: '16px 20px',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      border: '1px solid #86efac',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <svg width="20" height="20" fill="#16a34a" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p style={{ margin: 0, fontSize: '15px', color: '#166534' }}>
                        <strong>Congratulations!</strong> Your certificate was uploaded on {new Date(certificate.certificate_uploaded_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Certificate Preview */}
                    <div style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f9fafb',
                      marginBottom: '24px'
                    }}>
                      {certificate.certificate_file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img 
                          src={`http://localhost:5050${certificate.certificate_file}`}
                          alt="Certificate"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '60px 20px',
                          textAlign: 'center'
                        }}>
                          <svg width="64" height="64" fill="#9ca3af" viewBox="0 0 20 20" style={{ margin: '0 auto 16px' }}>
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>PDF Certificate</p>
                          <p style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '14px' }}>Click download button below to view</p>
                        </div>
                      )}
                    </div>

                    {/* Download Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <a
                        href={`http://localhost:5050${certificate.certificate_file}`}
                        download
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Certificate
                      </a>
                      <a
                        href={`http://localhost:5050${certificate.certificate_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '14px 24px',
                          background: 'white',
                          color: '#667eea',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#667eea';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#667eea';
                        }}
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        Open
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hours Per Week Modal */}
        {showHoursModal && (
          <div className="modal-overlay" onClick={() => setShowHoursModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Weekly Working Hours</h3>
                <button className="close-modal" onClick={() => setShowHoursModal(false)}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '24px' }}>
                <p style={{ marginBottom: '20px', color: '#6b7280', fontSize: '15px' }}>
                  Please enter the number of hours you can dedicate to the internship per week
                </p>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Hours per Week (Minimum: 20 hours)
                  </label>
                  <input
                    type="number"
                    min="20"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 20)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  {hoursPerWeek < 20 && (
                    <p style={{ 
                      marginTop: '8px', 
                      color: '#ef4444', 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Hours per week must be at least 20 hours
                    </p>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={handleConfirmApplication}
                    disabled={hoursPerWeek < 20}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: hoursPerWeek >= 20 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: hoursPerWeek >= 20 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Confirm Application
                  </button>
                  <button
                    onClick={() => {
                      setShowHoursModal(false);
                      setHoursPerWeek(20);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'white',
                      color: '#6b7280',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default StudentDashboard;
