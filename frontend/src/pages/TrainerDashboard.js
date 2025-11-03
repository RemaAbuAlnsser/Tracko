import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TrainerDashboard.css';
import { 
  loadChatMessages, 
  sendChatMessage, 
  subscribeToMessages, 
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount 
} from '../utils/chatService';

function TrainerDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [trainerData, setTrainerData] = useState({
    specialization: '',
    experience_years: 0,
    bio: '',
    linkedin_url: '',
    github_url: '',
    hourly_rate: 0,
    max_trainees: 5,
    status: 'active',
    profile_image: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [trainerId, setTrainerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [messages, setMessages] = useState([]);
  const [internships, setInternships] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messagesChannel, setMessagesChannel] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const messagesEndRef = useRef(null);
  const [newReport, setNewReport] = useState({
    student_id: '',
    report_type: 'weekly',
    performance_rating: 5,
    attendance: true,
    technical_skills: 5,
    communication_skills: 5,
    problem_solving: 5,
    teamwork: 5,
    comments: ''
  });
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    event_type: 'training',
    start_time: '',
    end_time: '',
    internship_id: '',
    student_ids: []
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    internship_id: '',
    title: '',
    description: '',
    duration_weeks: 4,
    start_date: '',
    end_date: '',
    status: 'draft'
  });
  const [planWeeks, setPlanWeeks] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  // selectedStudent is already defined above for chat system (line 40)
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Weekly Reports State
  const [showWeeklyReportsModal, setShowWeeklyReportsModal] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedWeeklyReport, setSelectedWeeklyReport] = useState(null);
  const [showReportReviewModal, setShowReportReviewModal] = useState(false);
  const [reportReviewStatus, setReportReviewStatus] = useState('approved');
  const [reportReviewComment, setReportReviewComment] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);
  
  // Video Call State
  const [showVideoCallSetup, setShowVideoCallSetup] = useState(false);
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false);
  const [selectedStudentsForCall, setSelectedStudentsForCall] = useState([]);
  const [videoCallRoomID, setVideoCallRoomID] = useState('');
  const [sendingInvitations, setSendingInvitations] = useState(false);
  
  // Dashboard Statistics State
  const [dashboardStats, setDashboardStats] = useState({
    internshipsCount: 0,
    studentsCount: 0,
    unreadNotificationsCount: 0
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Check if user is a trainer or company (trainer)
    if (parsedUser.user_type !== 'company' && parsedUser.user_type !== 'trainer') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    
    // Load trainer data from database
    loadTrainerData(parsedUser.id);
    
    // Load notifications on login
    loadNotificationsOnLogin(parsedUser);
  }, [navigate]);

  // Load conversations when trainerId is available
  useEffect(() => {
    if (trainerId) {
      loadConversations(); // Load conversations to show unread messages badge
    }
  }, [trainerId]);

  // Load dashboard statistics when trainerId and user are available
  useEffect(() => {
    if (trainerId && user) {
      loadDashboardStats();
    }
  }, [trainerId, user]);

  // Setup real-time message subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time messages
    const channel = subscribeToMessages(user.id, (newMessage) => {
      // Only add message if it's for the current conversation AND from the other person
      // (our own messages are added immediately in handleSendMessage)
      if (selectedStudent && 
          newMessage.sender_id === selectedStudent.user_id && 
          newMessage.receiver_id === user.id) {
        // Check if message doesn't already exist (avoid duplicates)
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
      
      // Update unread count in conversations
      if (newMessage.sender_id !== user.id) {
        loadConversations();
      }
    });

    setMessagesChannel(channel);

    // Cleanup on unmount
    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [user, selectedStudent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            status: data.trainer.status || 'active',
            profile_image: data.trainer.profile_image || ''
          });
          if (data.trainer.profile_image) {
            setImagePreview(`http://localhost:5050${data.trainer.profile_image}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading trainer data:', error);
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
    const { name, value, type } = e.target;
    setTrainerData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const formData = new FormData();
    formData.append('logo', selectedImage);

    try {
      const response = await fetch('http://localhost:5050/api/upload/logo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        return data.logoPath;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const loadStudents = async () => {
    if (!trainerId) return;
    try {
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}/students`);
      const data = await response.json();
      if (data.success) {
        const studentsWithPendingCount = await Promise.all(
          (data.students || []).map(async (student) => {
            try {
              // Get pending tasks count
              const tasksCountResponse = await fetch(
                `http://localhost:5050/api/task-submissions/student/${student.student_id}/trainer/${trainerId}/pending-count`
              );
              const tasksCountData = await tasksCountResponse.json();
              const pendingTasks = tasksCountData.success ? tasksCountData.count : 0;

              // Get pending weekly reports count
              console.log(`🔍 Fetching weekly reports count for student ${student.student_id}`);
              const reportsCountResponse = await fetch(
                `http://localhost:5050/api/weekly-reports/student/${student.student_id}/trainer/${trainerId}/pending-count`
              );
              const reportsCountData = await reportsCountResponse.json();
              console.log(`📊 Weekly reports count for student ${student.student_id}:`, reportsCountData);
              const pendingReports = reportsCountData.success ? reportsCountData.count : 0;

              return {
                ...student,
                pendingSubmissions: pendingTasks + pendingReports // Total pending (tasks + reports)
              };
            } catch (error) {
              console.error(`Error loading pending count for student ${student.student_id}:`, error);
              return {
                ...student,
                pendingSubmissions: 0
              };
            }
          })
        );
        setStudents(studentsWithPendingCount);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5050/api/notifications/user/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
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
        // Update dashboard stats
        setDashboardStats(prev => ({
          ...prev,
          unreadNotificationsCount: unreadCount
        }));
      } else {
        console.log('⚠️ API returned error:', data.message);
      }
    } catch (error) {
      console.error('❌ Error loading notifications on login:', error);
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
        const updatedNotifications = notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        );
        setNotifications(updatedNotifications);
        
        // Update dashboard stats
        const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
        setDashboardStats(prev => ({
          ...prev,
          unreadNotificationsCount: unreadCount
        }));
        
        console.log('Notification marked as read');
      } else {
        console.error('Failed to mark notification as read:', data.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const loadReports = async () => {
    if (!trainerId) return;
    try {
      const response = await fetch(`http://localhost:5050/api/reports/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadSchedules = async () => {
    if (!trainerId) return;
    try {
      console.log('📅 Loading events for trainer:', trainerId);
      const response = await fetch(`http://localhost:5050/api/events/trainer/${trainerId}/upcoming`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ Events loaded:', data.events);
        setSchedules(data.events || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadInternships = async () => {
    if (!trainerId) return;
    try {
      console.log('📋 Loading internships for trainer:', trainerId);
      const response = await fetch(`http://localhost:5050/api/internships/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ Loaded internships:', data.internships);
        setInternships(data.internships || []);
      }
    } catch (error) {
      console.error('Error loading internships:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!trainerId) {
      setMessage({ type: 'error', text: 'Trainer profile not found' });
      return;
    }

    // Validation
    if (trainerData.hourly_rate < 0) {
      setMessage({ type: 'error', text: 'Hourly rate cannot be negative' });
      return;
    }

    if (trainerData.max_trainees < 1) {
      setMessage({ type: 'error', text: 'Maximum trainees must be at least 1' });
      return;
    }

    if (trainerData.experience_years < 0) {
      setMessage({ type: 'error', text: 'Experience years cannot be negative' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('💾 Saving trainer data:', trainerData);
      
      // Upload image if selected
      let imagePath = trainerData.profile_image;
      if (selectedImage) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) {
          imagePath = uploadedPath;
        }
      }
      
      const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...trainerData,
          profile_image: imagePath
        })
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setSelectedImage(null);
        // Reload trainer data
        await loadTrainerData(user.id);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!trainerId || !newReport.student_id) {
      setMessage({ type: 'error', text: 'Please select a student' });
      return;
    }

    try {
      // Prepare final report data
      const finalReportData = {
        trainer_id: trainerId,
        student_id: newReport.student_id,
        overall_performance: newReport.comments || '',
        technical_skills_rating: newReport.technical_skills || 5,
        communication_rating: newReport.communication_skills || 5,
        teamwork_rating: newReport.teamwork || 5,
        problem_solving_rating: newReport.problem_solving || 5,
        attendance_rating: newReport.performance_rating || 5
      };

      const response = await fetch('http://localhost:5050/api/final-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalReportData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Final report submitted successfully!' });
        setNewReport({
          student_id: '',
          performance_rating: 5,
          technical_skills: 5,
          communication_skills: 5,
          problem_solving: 5,
          teamwork: 5,
          comments: ''
        });
        loadReports();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  // Filter students by selected internship
  const handleInternshipChange = (internshipId) => {
    setNewSchedule({ ...newSchedule, internship_id: internshipId, student_ids: [] });
    
    if (internshipId) {
      // Filter students by internship
      const filtered = students.filter(student => student.internship_id === parseInt(internshipId));
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    const currentIds = [...newSchedule.student_ids];
    const index = currentIds.indexOf(studentId);
    
    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(studentId);
    }
    
    setNewSchedule({ ...newSchedule, student_ids: currentIds });
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!trainerId) return;

    try {
      console.log('📅 Creating new event:', newSchedule);
      const response = await fetch('http://localhost:5050/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newSchedule, 
          trainer_id: trainerId,
          internship_id: newSchedule.internship_id ? parseInt(newSchedule.internship_id) : null,
          student_ids: newSchedule.student_ids.map(id => parseInt(id))
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Event created successfully! Notifications sent to students.' });
        setNewSchedule({
          title: '',
          description: '',
          event_type: 'training',
          start_time: '',
          end_time: '',
          internship_id: '',
          student_ids: []
        });
        setFilteredStudents([]);
        loadSchedules();
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create event' });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  // Load students and company as conversations for chat
  const loadConversations = async () => {
    if (!trainerId) {
      console.log('⚠️ No trainerId available');
      return;
    }
    
    console.log('📋 Loading conversations for trainer:', trainerId);
    
    try {
      let allConversations = [];
      
      // Load students
      try {
        console.log('👥 Fetching students...');
        const studentsResponse = await fetch(`http://localhost:5050/api/trainers/${trainerId}/students`);
        const studentsData = await studentsResponse.json();
        console.log('📥 Students data:', studentsData);
        
        if (studentsData.success && studentsData.students && studentsData.students.length > 0) {
          const studentsWithUnread = await Promise.all(
            studentsData.students.map(async (student) => {
              const unreadCount = await getUnreadCount(user.id, student.user_id);
              return {
                ...student,
                type: 'student',
                unread_count: unreadCount
              };
            })
          );
          allConversations = [...studentsWithUnread];
          console.log('✅ Added', studentsWithUnread.length, 'students to conversations');
        } else {
          console.log('ℹ️ No students found');
        }
      } catch (studentError) {
        console.error('❌ Error loading students:', studentError);
      }
      
      // Load company
      try {
        console.log('🏢 Fetching company...');
        const companyResponse = await fetch(`http://localhost:5050/api/trainers/${trainerId}/company`);
        const companyData = await companyResponse.json();
        console.log('📥 Company data:', companyData);
        
        if (companyData.success && companyData.company) {
          const company = companyData.company;
          const unreadCount = await getUnreadCount(user.id, company.user_id);
          allConversations.unshift({
            ...company,
            type: 'company',
            full_name: company.name,
            unread_count: unreadCount
          });
          console.log('✅ Added company to conversations');
        } else {
          console.log('ℹ️ No company found for this trainer');
        }
      } catch (companyError) {
        console.error('❌ Error loading company:', companyError);
      }
      
      console.log('📊 Total conversations:', allConversations.length);
      setConversations(allConversations);
      
      // Calculate total unread messages
      const totalUnread = allConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setTotalUnreadMessages(totalUnread);
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    }
  };

  // Load messages for selected student or company
  const loadMessages = async (contact) => {
    if (!user || !contact) return;
    
    const contactType = contact.type || 'student';
    console.log(`📨 Loading messages for ${contactType}:`, {
      contact_name: contact.full_name,
      contact_user_id: contact.user_id,
      trainer_user_id: user.id
    });
    
    try {
      const chatMessages = await loadChatMessages(user.id, contact.user_id);
      console.log('✅ Loaded messages:', chatMessages.length, 'messages');
      setMessages(chatMessages);
      setSelectedStudent(contact);
      setSelectedConversation(contact.student_id || contact.id);
      
      // Mark messages as read
      await markMessagesAsRead(contact.user_id, user.id);
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message using Supabase
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent || !user) return;

    const messageText = newMessage.trim();
    
    console.log('📤 Sending message:', {
      sender_id: user.id,
      receiver_id: selectedStudent.user_id,
      message: messageText
    });
    
    try {
      // Clear input immediately for better UX
      setNewMessage('');
      
      const result = await sendChatMessage(user.id, selectedStudent.user_id, messageText);
      
      if (result.success && result.data && result.data[0]) {
        // Add message to state immediately
        const newMsg = result.data[0];
        setMessages(prev => [...prev, newMsg]);
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 50);
      } else {
        setMessage({ type: 'error', text: 'Failed to send message' });
        // Restore message text if failed
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage({ type: 'error', text: 'Server error' });
      // Restore message text if failed
      setNewMessage(messageText);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    if (!trainerId || !user) return;
    
    try {
      // Load internships count
      const internshipsResponse = await fetch(`http://localhost:5050/api/internships/trainer/${trainerId}`);
      const internshipsData = await internshipsResponse.json();
      const internshipsCount = internshipsData.success ? (internshipsData.internships || []).length : 0;
      
      // Load students count
      const studentsResponse = await fetch(`http://localhost:5050/api/trainers/${trainerId}/students`);
      const studentsData = await studentsResponse.json();
      const studentsCount = studentsData.success ? (studentsData.students || []).length : 0;
      
      // Load unread notifications count
      const notificationsResponse = await fetch(`http://localhost:5050/api/notifications/user/${user.id}`);
      const notificationsData = await notificationsResponse.json();
      const unreadNotificationsCount = notificationsData.success 
        ? notificationsData.notifications.filter(n => !n.is_read).length 
        : 0;
      
      // Update dashboard stats
      setDashboardStats({
        internshipsCount,
        studentsCount,
        unreadNotificationsCount
      });
      
      console.log('📊 Dashboard stats loaded:', { internshipsCount, studentsCount, unreadNotificationsCount });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadPlans = async () => {
    if (!trainerId) return;
    try {
      console.log('📋 Loading plans for trainer:', trainerId);
      const response = await fetch(`http://localhost:5050/api/plans/trainer/${trainerId}`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ Loaded plans:', data.plans);
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadPlanDetails = async (planId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedPlan(data.plan);
        setPlanWeeks(data.plan.weeks || []);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!trainerId || !newPlan.internship_id || !newPlan.title || !newPlan.duration_weeks) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5050/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          trainer_id: trainerId,
          weeks: planWeeks
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Plan created successfully! Students have been notified.' });
        setNewPlan({
          internship_id: '',
          title: '',
          description: '',
          duration_weeks: 4,
          start_date: '',
          end_date: '',
          status: 'draft'
        });
        setPlanWeeks([]);
        loadPlans();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create plan' });
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleAddWeek = () => {
    const weekNumber = planWeeks.length + 1;
    setPlanWeeks([...planWeeks, {
      week_number: weekNumber,
      title: `Week ${weekNumber}`,
      description: '',
      objectives: '',
      tasks: '',
      task_description: '',
      resources: '',
      deliverables: '',
      due_date: ''
    }]);
  };

  const handleUpdateWeek = (index, field, value) => {
    const updatedWeeks = [...planWeeks];
    updatedWeeks[index][field] = value;
    setPlanWeeks(updatedWeeks);
  };

  const handleRemoveWeek = (index) => {
    const updatedWeeks = planWeeks.filter((_, i) => i !== index);
    // Renumber weeks
    updatedWeeks.forEach((week, i) => {
      week.week_number = i + 1;
    });
    setPlanWeeks(updatedWeeks);
  };

  const handleEditPlan = async (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      internship_id: plan.internship_id,
      title: plan.title,
      description: plan.description,
      duration_weeks: plan.duration_weeks,
      start_date: plan.start_date ? plan.start_date.split('T')[0] : '',
      end_date: plan.end_date ? plan.end_date.split('T')[0] : '',
      status: plan.status
    });
    
    // Load weeks for this plan
    try {
      const response = await fetch(`http://localhost:5050/api/plans/${plan.id}/weeks`);
      const data = await response.json();
      if (data.success) {
        // Format due_date for datetime-local input
        const formattedWeeks = data.weeks.map(week => ({
          ...week,
          due_date: week.due_date ? new Date(week.due_date).toISOString().slice(0, 16) : ''
        }));
        setPlanWeeks(formattedWeeks);
      }
    } catch (error) {
      console.error('Error loading plan weeks:', error);
    }
    
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan || !trainerId) {
      setMessage({ type: 'error', text: 'Missing required information' });
      return;
    }

    try {
      // Update plan basic info
      const planResponse = await fetch(`http://localhost:5050/api/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          trainer_id: trainerId
        })
      });
      const planData = await planResponse.json();
      
      if (!planData.success) {
        setMessage({ type: 'error', text: planData.message || 'Failed to update plan' });
        return;
      }

      // Update each week
      for (const week of planWeeks) {
        if (week.id) {
          // Update existing week
          await fetch(`http://localhost:5050/api/plans/weeks/${week.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: week.title,
              description: week.description,
              objectives: week.objectives,
              tasks: week.tasks,
              task_description: week.task_description,
              resources: week.resources,
              deliverables: week.deliverables,
              due_date: week.due_date || null
            })
          });
        } else {
          // Add new week
          await fetch(`http://localhost:5050/api/plans/${editingPlan.id}/weeks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              week_number: week.week_number,
              title: week.title,
              description: week.description,
              objectives: week.objectives,
              tasks: week.tasks,
              task_description: week.task_description,
              resources: week.resources,
              deliverables: week.deliverables,
              due_date: week.due_date || null
            })
          });
        }
      }

      setMessage({ type: 'success', text: 'Plan updated successfully!' });
      setShowEditPlanModal(false);
      setEditingPlan(null);
      setNewPlan({
        internship_id: '',
        title: '',
        description: '',
        duration_weeks: 4,
        start_date: '',
        end_date: '',
        status: 'draft'
      });
      setPlanWeeks([]);
      loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleViewStudentTasks = async (student) => {
    setSelectedStudent(student);
    setShowSubmissionsModal(true);
    setLoadingSubmissions(true);
    
    try {
      // Get student's current training plan
      const plansResponse = await fetch(`http://localhost:5050/api/plans/student/${student.student_id}`);
      const plansData = await plansResponse.json();
      
      let currentPlanId = null;
      if (plansData.success && plansData.plans && plansData.plans.length > 0) {
        // Get the active or most recent plan
        const activePlan = plansData.plans.find(p => p.status === 'active') || plansData.plans[0];
        currentPlanId = activePlan.id;
      }
      
      // Fetch submissions for current plan only
      let url = `http://localhost:5050/api/task-submissions/student/${student.student_id}/trainer/${trainerId}`;
      if (currentPlanId) {
        url += `?planId=${currentPlanId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewStatus(submission.status === 'pending' ? 'approved' : submission.status);
    setReviewComment(submission.trainer_comment || '');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/task-submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          trainer_comment: reviewComment
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Review submitted successfully! Student has been notified.' 
        });
        
        // Reload submissions
        if (selectedStudent) {
          // Get student's current training plan
          const plansResponse = await fetch(`http://localhost:5050/api/plans/student/${selectedStudent.student_id}`);
          const plansData = await plansResponse.json();
          
          let currentPlanId = null;
          if (plansData.success && plansData.plans && plansData.plans.length > 0) {
            const activePlan = plansData.plans.find(p => p.status === 'active') || plansData.plans[0];
            currentPlanId = activePlan.id;
          }
          
          let url = `http://localhost:5050/api/task-submissions/student/${selectedStudent.student_id}/trainer/${trainerId}`;
          if (currentPlanId) {
            url += `?planId=${currentPlanId}`;
          }
          
          const reloadResponse = await fetch(url);
          const reloadData = await reloadResponse.json();
          if (reloadData.success) {
            setSubmissions(reloadData.submissions || []);
          }

          // Update pending count for this student in the students list (tasks + reports)
          try {
            // Get pending tasks
            const tasksCountResponse = await fetch(
              `http://localhost:5050/api/task-submissions/student/${selectedStudent.student_id}/trainer/${trainerId}/pending-count`
            );
            const tasksCountData = await tasksCountResponse.json();
            const pendingTasks = tasksCountData.success ? tasksCountData.count : 0;

            // Get pending weekly reports
            const reportsCountResponse = await fetch(
              `http://localhost:5050/api/weekly-reports/student/${selectedStudent.student_id}/trainer/${trainerId}/pending-count`
            );
            const reportsCountData = await reportsCountResponse.json();
            const pendingReports = reportsCountData.success ? reportsCountData.count : 0;

            setStudents(prevStudents => 
              prevStudents.map(student => 
                student.student_id === selectedStudent.student_id
                  ? { ...student, pendingSubmissions: pendingTasks + pendingReports }
                  : student
              )
            );
          } catch (error) {
            console.error('Error updating pending count:', error);
          }
        }
        
        setTimeout(() => {
          setShowReviewModal(false);
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to submit review' 
        });
      }
    } catch (error) {
      console.error('Submit review error:', error);
      setMessage({ type: 'error', text: 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending Review', color: '#fb8c00', bgColor: '#fff3e0' },
      approved: { text: 'Approved', color: '#43a047', bgColor: '#e8f5e9' },
      rejected: { text: 'Needs Revision', color: '#e53935', bgColor: '#ffebee' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '12px', 
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: config.bgColor,
        color: config.color
      }}>
        {config.text}
      </span>
    );
  };

  const downloadFile = (filePath) => {
    if (filePath) {
      window.open(`http://localhost:5050${filePath}`, '_blank');
    }
  };

  // Weekly Reports Functions
  const handleViewWeeklyReports = async (student) => {
    setSelectedStudent(student);
    setShowWeeklyReportsModal(true);
    setLoadingReports(true);
    
    try {
      const response = await fetch(`http://localhost:5050/api/weekly-reports/trainer/${trainerId}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter reports for this specific student
        const studentReports = (data.reports || []).filter(
          report => report.student_id === student.student_id
        );
        setWeeklyReports(studentReports);
      }
    } catch (error) {
      console.error('Error loading weekly reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleReviewWeeklyReport = (report) => {
    setSelectedWeeklyReport(report);
    setReportReviewStatus(report.status === 'pending' ? 'approved' : report.status);
    setReportReviewComment(report.trainer_comment || '');
    setShowReportReviewModal(true);
  };

  const handleSubmitReportReview = async () => {
    if (!selectedWeeklyReport) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/weekly-reports/${selectedWeeklyReport.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reportReviewStatus,
          trainer_comment: reportReviewComment
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Review submitted successfully! Student has been notified.' 
        });
        
        // Reload weekly reports
        if (selectedStudent) {
          const reloadResponse = await fetch(`http://localhost:5050/api/weekly-reports/trainer/${trainerId}`);
          const reloadData = await reloadResponse.json();
          if (reloadData.success) {
            const studentReports = (reloadData.reports || []).filter(
              report => report.student_id === selectedStudent.student_id
            );
            setWeeklyReports(studentReports);
          }

          // Update pending count for this student in the students list (tasks + reports)
          try {
            // Get pending tasks
            const tasksCountResponse = await fetch(
              `http://localhost:5050/api/task-submissions/student/${selectedStudent.student_id}/trainer/${trainerId}/pending-count`
            );
            const tasksCountData = await tasksCountResponse.json();
            const pendingTasks = tasksCountData.success ? tasksCountData.count : 0;

            // Get pending weekly reports
            const reportsCountResponse = await fetch(
              `http://localhost:5050/api/weekly-reports/student/${selectedStudent.student_id}/trainer/${trainerId}/pending-count`
            );
            const reportsCountData = await reportsCountResponse.json();
            const pendingReports = reportsCountData.success ? reportsCountData.count : 0;

            setStudents(prevStudents => 
              prevStudents.map(student => 
                student.student_id === selectedStudent.student_id
                  ? { ...student, pendingSubmissions: pendingTasks + pendingReports }
                  : student
              )
            );
          } catch (error) {
            console.error('Error updating pending count:', error);
          }
        }
        
        setTimeout(() => {
          setShowReportReviewModal(false);
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to submit review' 
        });
      }
    } catch (error) {
      console.error('Submit report review error:', error);
      setMessage({ type: 'error', text: 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  // Video Call Functions
  const handleStartVideoCall = async () => {
    // Generate unique room ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const roomID = `tracko-${trainerId}-${timestamp}-${randomStr}`;
    
    console.log('📞 Preparing video call...');
    console.log('   Room ID:', roomID);
    
    // Load students if not already loaded
    if (students.length === 0) {
      await loadStudents();
    }
    
    // Store room ID and show student selection modal
    setVideoCallRoomID(roomID);
    setShowStudentSelectionModal(true);
    setSelectedStudentsForCall([]);
  };

  const toggleStudentForCall = (studentId) => {
    setSelectedStudentsForCall(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSendVideoCallInvitations = async () => {
    if (selectedStudentsForCall.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one student' });
      return;
    }

    setSendingInvitations(true);
    setMessage({ type: '', text: '' });

    // Create video call link
    const videoCallLink = `${window.location.protocol}//${window.location.host}/video-call?roomID=${videoCallRoomID}`;
    
    // Open video call IMMEDIATELY for trainer (before API call to avoid popup blocker)
    const videoCallWindow = window.open(videoCallLink, '_blank');
    
    if (!videoCallWindow) {
      setMessage({ 
        type: 'error', 
        text: 'Please allow popups for this site to start video calls' 
      });
      setSendingInvitations(false);
      return;
    }

    try {
      // Send notifications to selected students
      const response = await fetch('http://localhost:5050/api/notifications/video-call-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainer_id: trainerId,
          trainer_name: user.full_name,
          student_ids: selectedStudentsForCall,
          room_id: videoCallRoomID,
          video_call_link: videoCallLink
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `Video call started! Invitations sent to ${selectedStudentsForCall.length} student(s)` 
        });
        
        // Close modal after short delay
        setTimeout(() => {
          setShowStudentSelectionModal(false);
          setSelectedStudentsForCall([]);
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to send invitations' 
        });
        // Close the video call window if notification sending failed
        if (videoCallWindow && !videoCallWindow.closed) {
          videoCallWindow.close();
        }
      }
    } catch (error) {
      console.error('Error sending video call invitations:', error);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
      // Close the video call window if there was an error
      if (videoCallWindow && !videoCallWindow.closed) {
        videoCallWindow.close();
      }
    } finally {
      setSendingInvitations(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="trainer-dashboard">
      {/* Sidebar */}
      <aside className="trainer-sidebar">
        {/* Trainer Profile Section */}
        <div className="trainer-profile-section">
          <div className="trainer-avatar">
            {imagePreview ? (
              <img src={imagePreview} alt={user.full_name} className="avatar-image" />
            ) : (
              <span className="avatar-initials">{getInitials(user.full_name)}</span>
            )}
          </div>
          <div className="trainer-info">
            <h3>{user.full_name}</h3>
            <p>Trainer</p>
            <div className="trainer-badge">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Trainer
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('dashboard'); loadDashboardStats(); }}
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
            className={`nav-item ${activeMenu === 'internships' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('internships'); loadInternships(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            My Internships
          </button>

          <button 
            className={`nav-item ${activeMenu === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('students'); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            My Students
          </button>

          <button 
            className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('reports'); loadReports(); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </button>

          <button 
            className={`nav-item ${activeMenu === 'schedule' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('schedule'); loadSchedules(); loadStudents(); loadInternships(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
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
            onClick={() => { setActiveMenu('messages'); loadConversations(); loadStudents(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
            {totalUnreadMessages > 0 && (
              <span className="notification-badge">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'videocall' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('videocall'); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Meetings
          </button>

          <button 
            className={`nav-item ${activeMenu === 'plans' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('plans'); loadPlans(); loadInternships(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Training Plans
          </button>
        </nav>

        {/* Logout Section */}
        <div className="logout-section">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="trainer-main-content">
        {activeMenu === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Welcome back, {user.full_name}!</h1>
              <p>Manage your trainer profile and track your trainees</p>
            </div>

            <div style={{ marginTop: '30px' }}>
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
                    <h4 style={{ margin: 0, color: '#0369a1', fontSize: '16px', fontWeight: '600' }}>Internships</h4>
                  </div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#0c4a6e' }}>
                    {dashboardStats.internshipsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#0369a1', margin: '8px 0 0 0' }}>
                    Total internships managed
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
                onClick={() => setActiveMenu('students')}
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
                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 style={{ margin: 0, color: '#15803d', fontSize: '16px', fontWeight: '600' }}>Students</h4>
                  </div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>
                    {dashboardStats.studentsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#15803d', margin: '8px 0 0 0' }}>
                    Students under supervision
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
                    {dashboardStats.unreadNotificationsCount}
                  </p>
                  <p style={{ fontSize: '13px', color: '#92400e', margin: '8px 0 0 0' }}>
                    Pending notifications
                  </p>
                </div>
              </div>
            </div>

            <div className="quick-info-card">
              <h3>Your Specialization</h3>
              <p>{trainerData.specialization || 'Not set yet - Click Profile & Edit to add your specialization'}</p>
              
              {trainerData.bio && (
                <>
                  <h3 style={{ marginTop: '1.5rem' }}>About You</h3>
                  <p>{trainerData.bio}</p>
                </>
              )}
              
              {(trainerData.linkedin_url || trainerData.github_url) && (
                <>
                  <h3 style={{ marginTop: '1.5rem' }}>Social Links</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {trainerData.linkedin_url && (
                      <a 
                        href={trainerData.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1e88e5', textDecoration: 'none', fontWeight: '500' }}
                      >
                        LinkedIn
                      </a>
                    )}
                    {trainerData.github_url && (
                      <a 
                        href={trainerData.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1e88e5', textDecoration: 'none', fontWeight: '500' }}
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {activeMenu === 'profile' && (
          <>
            <div className="dashboard-header">
              <h1>Trainer Profile & Edit</h1>
              <p>Update your professional information</p>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Profile Image Section */}
            <div className="profile-image-section">
              <div className="image-container">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="profile-image" />
                ) : (
                  <div className="no-image">
                    <span>No Profile Image</span>
                  </div>
                )}
              </div>
              <div className="image-upload">
                <label htmlFor="profile-image" className="upload-label">
                  Choose Profile Image
                </label>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {selectedImage && (
                  <span className="file-name">{selectedImage.name}</span>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="profile-forms-container">
              <div className="profile-form-card">
                <h3>Professional Information</h3>
                
                <div className="form-group">
                  <label>Specialization</label>
                  <input 
                    type="text" 
                    name="specialization"
                    value={trainerData.specialization} 
                    onChange={handleInputChange}
                    placeholder="e.g., Full Stack Development, Data Science"
                  />
                </div>

                <div className="form-group">
                  <label>Years of Experience</label>
                  <input 
                    type="number" 
                    name="experience_years"
                    value={trainerData.experience_years} 
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input 
                    type="number" 
                    name="hourly_rate"
                    value={trainerData.hourly_rate} 
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Trainees</label>
                  <input 
                    type="number" 
                    name="max_trainees"
                    value={trainerData.max_trainees} 
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="profile-form-card">
                <h3>Contact & Social Links</h3>
                
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={trainerData.linkedin_url} 
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {trainerData.linkedin_url && (
                    <a 
                      href={trainerData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="preview-link"
                    >
                      View Profile →
                    </a>
                  )}
                </div>

                <div className="form-group">
                  <label>GitHub URL</label>
                  <input 
                    type="url" 
                    name="github_url"
                    value={trainerData.github_url} 
                    onChange={handleInputChange}
                    placeholder="https://github.com/yourusername"
                  />
                  {trainerData.github_url && (
                    <a 
                      href={trainerData.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="preview-link"
                    >
                      View Profile →
                    </a>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    name="status"
                    value={trainerData.status} 
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio Section - Full Width */}
            <div className="profile-form-card full-width">
              <h3>About Me</h3>
              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  rows="6" 
                  name="bio"
                  value={trainerData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself, your experience, and what you can offer to trainees..."
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

        {/* Students Section */}
        {activeMenu === 'students' && (
          <>
            <div className="dashboard-header">
              <h1>My Students</h1>
              <p>View and manage your trainees</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="table-section">
              <h2>Accepted Students ({students.length})</h2>
              {students.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3>No Accepted Students Yet</h3>
                  <p>Students who are accepted in your internships will appear here.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Internship</th>
                      <th>Company</th>
                      <th>University</th>
                      <th>Major</th>
                      <th>GPA</th>
                      <th>Pending Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={`${student.student_id}-${student.internship_id}-${index}`}>
                        <td>
                          <div className="student-cell">
                            {student.student_img ? (
                              <img 
                                src={`http://localhost:5050${student.student_img}`} 
                                alt={student.full_name}
                                className="student-avatar-small"
                              />
                            ) : (
                              <div className="student-avatar-placeholder">
                                {student.full_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <div className="student-name">{student.full_name}</div>
                              <div className="student-email">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="internship-cell">
                            <strong>{student.internship_title}</strong>
                          </div>
                        </td>
                        <td>{student.company_name}</td>
                        <td>{student.university_name || 'N/A'}</td>
                        <td>{student.major || 'N/A'}</td>
                        <td>
                          <span className="gpa-badge">
                            {student.gpa && !isNaN(student.gpa) ? Number(student.gpa).toFixed(2) : 'N/A'}
                          </span>
                        </td>
                        <td>
                          {student.pendingSubmissions > 0 ? (
                            <span className="badge badge-pending" style={{ 
                              backgroundColor: '#f59e0b', 
                              color: 'white',
                              fontWeight: 'bold',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '12px',
                              fontSize: '0.9rem'
                            }}>
                              {student.pendingSubmissions} pending
                            </span>
                          ) : (
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                              All up to date
                            </span>
                          )}
                        </td>
                        <td>
                          <span 
                            className="badge"
                            style={{
                              backgroundColor: student.training_status === 'complete' ? '#22c55e' : '#3b82f6',
                              color: 'white',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}
                          >
                            {student.training_status === 'complete' ? 'Complete' : 'In Training'}
                          </span>
                        </td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.4rem', 
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            flexWrap: 'nowrap'
                          }}>
                            <button 
                              className="btn-view"
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.35rem 0.6rem',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => {
                                setNewReport({ ...newReport, student_id: student.student_id });
                                setActiveMenu('reports');
                              }}
                            >
                              Report
                            </button>
                            <button 
                              className="btn-primary"
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.35rem 0.6rem',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleViewStudentTasks(student)}
                            >
                              📝 Tasks
                            </button>
                            <button 
                              className="btn-primary"
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.35rem 0.6rem',
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleViewWeeklyReports(student)}
                            >
                              Weekly
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Reports Section */}
        {activeMenu === 'reports' && (
          <>
            <div className="dashboard-header">
              <h1>Student Reports</h1>
              <p>Create and manage performance reports</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Create New Report */}
            <div className="profile-form-card full-width">
              <h3>Create New Report</h3>
              <form onSubmit={handleSubmitReport}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Select Student *</label>
                    <select
                      value={newReport.student_id}
                      onChange={(e) => setNewReport({ ...newReport, student_id: parseInt(e.target.value) })}
                      required
                    >
                      <option value="">Choose a student...</option>
                      {students.map(student => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Performance Evaluation</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Technical Skills (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.technical_skills}
                      onChange={(e) => setNewReport({ ...newReport, technical_skills: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Communication Skills (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.communication_skills}
                      onChange={(e) => setNewReport({ ...newReport, communication_skills: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Problem Solving (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.problem_solving}
                      onChange={(e) => setNewReport({ ...newReport, problem_solving: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Teamwork (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newReport.teamwork}
                      onChange={(e) => setNewReport({ ...newReport, teamwork: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Overall Performance Rating (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newReport.performance_rating}
                    onChange={(e) => setNewReport({ ...newReport, performance_rating: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Comments & Feedback</label>
                  <textarea
                    rows="5"
                    value={newReport.comments}
                    onChange={(e) => setNewReport({ ...newReport, comments: e.target.value })}
                    placeholder="Provide detailed feedback about the student's performance..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveMenu('students')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Report
                  </button>
                </div>
              </form>
            </div>

            {/* Previous Reports */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>Previous Reports</h2>
              {reports.length === 0 ? (
                <div className="empty-state">
                  <h3>No Reports Yet</h3>
                  <p>You haven't submitted any reports yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Attendance</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{report.student_name}</td>
                        <td><span className="badge badge-info">{report.report_type}</span></td>
                        <td>{report.performance_rating}/10</td>
                        <td>
                          <span className={`badge ${report.attendance ? 'badge-success' : 'badge-danger'}`}>
                            {report.attendance ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td>{new Date(report.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-view">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Schedule Section */}
        {activeMenu === 'schedule' && (
          <>
            <div className="dashboard-header">
              <h1>Training Schedule</h1>
              <p>Manage your training sessions and meetings</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Add New Schedule */}
            <div className="profile-form-card full-width">
              <h3>Add New Event</h3>
              <form onSubmit={handleAddSchedule}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Title *</label>
                    <input
                      type="text"
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                      placeholder="e.g., Weekly Training Session"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Event Type</label>
                    <select
                      value={newSchedule.event_type}
                      onChange={(e) => setNewSchedule({ ...newSchedule, event_type: e.target.value })}
                    >
                      <option value="training">Training Session</option>
                      <option value="meeting">Meeting</option>
                      <option value="workshop">Workshop</option>
                      <option value="review">Performance Review</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Internship *</label>
                  <select
                    value={newSchedule.internship_id}
                    onChange={(e) => handleInternshipChange(e.target.value)}
                    required
                  >
                    <option value="">Select Internship</option>
                    {internships.map(internship => (
                      <option key={internship.id} value={internship.id}>
                        {internship.title}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredStudents.length > 0 && (
                  <div className="form-group">
                    <label>Select Students *</label>
                    <div style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {filteredStudents.map(student => (
                        <div key={student.student_id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '8px',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          <input
                            type="checkbox"
                            id={`student-${student.student_id}`}
                            checked={newSchedule.student_ids.includes(student.student_id.toString())}
                            onChange={() => toggleStudentSelection(student.student_id.toString())}
                            style={{ cursor: 'pointer' }}
                          />
                          <label 
                            htmlFor={`student-${student.student_id}`}
                            style={{ cursor: 'pointer', margin: 0, flex: 1 }}
                          >
                            {student.full_name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                      {newSchedule.student_ids.length} student(s) selected
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="Add event details..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveMenu('dashboard')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Event
                  </button>
                </div>
              </form>
            </div>

            {/* Calendar View */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>Upcoming Events</h2>
              {schedules.length === 0 ? (
                <div className="empty-state">
                  <h3>No Events Scheduled</h3>
                  <p>You don't have any upcoming events.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Internship</th>
                      <th>Students</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td><strong>{schedule.title}</strong></td>
                        <td><span className="badge badge-info">{schedule.event_type}</span></td>
                        <td>{schedule.internship_title || '-'}</td>
                        <td>
                          {schedule.students && schedule.students.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {schedule.students.map((student, idx) => (
                                <span key={idx} className="badge badge-success" style={{ fontSize: '11px' }}>
                                  {student.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No students</span>
                          )}
                        </td>
                        <td>{new Date(schedule.start_time).toLocaleString()}</td>
                        <td>{new Date(schedule.end_time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Notifications Section */}
        {activeMenu === 'notifications' && (
          <div className="notifications-section">
            <div className="section-header">
              <h2>Notifications</h2>
              <p>Stay updated with student submissions and important messages</p>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3>No Notifications Yet</h3>
                <p>You'll see notifications here when students submit their work</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-icon">
                      {notification.type === 'task_submission' ? (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : notification.type === 'task_review' ? (
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

        {/* My Internships Section */}
        {activeMenu === 'internships' && (
          <>
            <div className="dashboard-header">
              <h1>My Internships</h1>
              <p>Internships you are training</p>
            </div>

            {internships.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3>No Internships Assigned</h3>
                <p>You haven't been assigned to any internships yet</p>
              </div>
            ) : (
              <div className="internships-grid">
                {internships.map(internship => (
                  <div key={internship.id} className="internship-card">
                    <div className="internship-header">
                      <div className="company-info">
                        {internship.company_logo ? (
                          <img 
                            src={`http://localhost:5050${internship.company_logo}`} 
                            alt={internship.company_name}
                            className="company-logo-small"
                          />
                        ) : (
                          <div className="company-logo-placeholder">
                            {internship.company_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3>{internship.title}</h3>
                          <p className="company-name">{internship.company_name}</p>
                        </div>
                      </div>
                      <span className={`status-badge status-${internship.status}`}>
                        {internship.status}
                      </span>
                    </div>

                    <div className="internship-details">
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                        <span>{internship.specialization || 'General'}</span>
                      </div>
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                        </svg>
                        <span>{internship.capacity} positions</span>
                      </div>
                      <div className="detail-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span>{new Date(internship.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="internship-stats">
                      <div className="stat-box">
                        <span className="stat-number">{internship.applicants_count || 0}</span>
                        <span className="stat-label">Applicants</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-number">{internship.accepted_count || 0}</span>
                        <span className="stat-label">Accepted</span>
                      </div>
                    </div>

                    {internship.description && (
                      <div className="internship-description">
                        <p>{internship.description.substring(0, 150)}...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Messages Section */}
        {activeMenu === 'messages' && (
          <>
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Chat with your students and colleagues</p>
            </div>

            <div className="chat-container">
              {/* Conversations List (Students & Company) */}
              <div className="conversations-sidebar">
                <h3>Conversations</h3>
                {conversations.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {/* Company Section */}
                    {conversations.filter(c => c.type === 'company').map(company => (
                      <div
                        key={`company-${company.id}`}
                        className={`conversation-item ${selectedConversation === company.id ? 'active' : ''}`}
                        onClick={() => loadMessages(company)}
                      >
                        <div className="conversation-avatar" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
                          {company.logo ? (
                            <img 
                              src={`http://localhost:5050${company.logo}`} 
                              alt={company.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = company.name ? company.name.charAt(0).toUpperCase() : 'C';
                              }}
                            />
                          ) : (
                            company.name ? company.name.charAt(0).toUpperCase() : 'C'
                          )}
                        </div>
                        <div className="conversation-info">
                          <h4>{company.name || 'Company'} 🏢</h4>
                          <p className="student-email">{company.email}</p>
                        </div>
                        {company.unread_count > 0 && (
                          <span className="unread-count">{company.unread_count}</span>
                        )}
                      </div>
                    ))}
                    
                    {/* Students Section */}
                    {conversations.filter(c => c.type === 'student').map(student => (
                      <div
                        key={`student-${student.student_id}`}
                        className={`conversation-item ${selectedConversation === student.student_id ? 'active' : ''}`}
                        onClick={() => loadMessages(student)}
                      >
                        <div className="conversation-avatar">
                          {student.student_img ? (
                            <img 
                              src={student.student_img.startsWith('http') ? student.student_img : `http://localhost:5050${student.student_img}`} 
                              alt={student.full_name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S';
                              }}
                            />
                          ) : (
                            student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'
                          )}
                        </div>
                        <div className="conversation-info">
                          <h4>{student.full_name || 'Student'}</h4>
                          <p className="student-email">{student.email}</p>
                        </div>
                        {student.unread_count > 0 && (
                          <span className="unread-count">{student.unread_count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {!selectedConversation ? (
                  <div className="empty-state">
                    <h3>Select a Contact</h3>
                    <p>Choose a student or company from the list to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    {selectedStudent && (
                      <div className="chat-header">
                        <div className="conversation-avatar" style={selectedStudent.type === 'company' ? {background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'} : {}}>
                          {selectedStudent.type === 'company' && selectedStudent.logo ? (
                            <img 
                              src={`http://localhost:5050${selectedStudent.logo}`} 
                              alt={selectedStudent.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'C';
                              }}
                            />
                          ) : selectedStudent.type === 'student' && selectedStudent.student_img ? (
                            <img 
                              src={selectedStudent.student_img.startsWith('http') ? selectedStudent.student_img : `http://localhost:5050${selectedStudent.student_img}`} 
                              alt={selectedStudent.full_name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S';
                              }}
                            />
                          ) : (
                            selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : (selectedStudent.type === 'company' ? 'C' : 'S')
                          )}
                        </div>
                        <div>
                          <h3>{selectedStudent.full_name} {selectedStudent.type === 'company' ? '🏢' : ''}</h3>
                          <p className="student-info">{selectedStudent.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Messages List */}
                    <div className="messages-list">
                      {messages.length === 0 ? (
                        <div className="empty-state-small">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <>
                          {messages.map(msg => {
                            const isSentByTrainer = Number(msg.sender_id) === Number(user.id);
                            console.log('📧 Message:', {
                              message: msg.message,
                              sender_id: msg.sender_id,
                              user_id: user.id,
                              isSent: isSentByTrainer,
                              types: `sender: ${typeof msg.sender_id}, user: ${typeof user.id}`
                            });
                            return (
                            <div
                              key={msg.id}
                              className={`message-item ${isSentByTrainer ? 'sent' : 'received'}`}
                            >
                              {/* Show avatar for receiver (student/company) on left */}
                              {!isSentByTrainer && selectedStudent && (
                                <div className="message-avatar" style={selectedStudent.type === 'company' ? {background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'} : {}}>
                                  {selectedStudent.type === 'company' && selectedStudent.logo ? (
                                    <img 
                                      src={`http://localhost:5050${selectedStudent.logo}`} 
                                      alt={selectedStudent.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'C';
                                      }}
                                    />
                                  ) : selectedStudent.student_img ? (
                                    <img 
                                      src={selectedStudent.student_img.startsWith('http') ? selectedStudent.student_img : `http://localhost:5050${selectedStudent.student_img}`} 
                                      alt={selectedStudent.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S';
                                      }}
                                    />
                                  ) : (
                                    selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : (selectedStudent.type === 'company' ? 'C' : 'S')
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
                              {/* Show avatar for sender (trainer) on right */}
                              {isSentByTrainer && (
                                <div className="message-avatar">
                                  {trainerData.profile_image ? (
                                    <img 
                                      src={`http://localhost:5050${trainerData.profile_image}`} 
                                      alt={user.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'T';
                                      }}
                                    />
                                  ) : (
                                    user.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'
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

        {/* Training Plans Section */}
        {activeMenu === 'plans' && (
          <>
            <div className="dashboard-header">
              <h1>Training Plans</h1>
              <p>Create and manage internship training plans</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Create New Plan */}
            <div className="profile-form-card">
              <h3>Create New Training Plan</h3>
              <form onSubmit={handleCreatePlan}>
                <div className="form-group">
                  <label>Select Internship *</label>
                  <select
                    value={newPlan.internship_id}
                    onChange={(e) => setNewPlan({...newPlan, internship_id: e.target.value})}
                    required
                  >
                    <option value="">-- Select Internship --</option>
                    {internships.map(internship => (
                      <option key={internship.id} value={internship.id}>
                        {internship.title} - {internship.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plan Title *</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                    placeholder="e.g., Full Stack Development Training Plan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="Brief description of the training plan..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (Weeks) *</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={newPlan.duration_weeks}
                      onChange={(e) => setNewPlan({...newPlan, duration_weeks: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={newPlan.start_date}
                      onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={newPlan.end_date}
                      onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newPlan.status}
                      onChange={(e) => setNewPlan({...newPlan, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Weekly Plan */}
                <div className="weeks-section">
                  <div className="weeks-header">
                    <h4>Weekly Plan</h4>
                    <button type="button" className="btn-secondary" onClick={handleAddWeek}>
                      + Add Week
                    </button>
                  </div>

                  {planWeeks.length === 0 ? (
                    <div className="empty-state-small">
                      <p>No weeks added yet. Click "Add Week" to start planning.</p>
                    </div>
                  ) : (
                    <div className="weeks-list">
                      {planWeeks.map((week, index) => (
                        <div key={index} className="week-card">
                          <div className="week-header">
                            <h5>Week {week.week_number}</h5>
                            <button
                              type="button"
                              className="btn-danger-small"
                              onClick={() => handleRemoveWeek(index)}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Week Title</label>
                            <input
                              type="text"
                              value={week.title}
                              onChange={(e) => handleUpdateWeek(index, 'title', e.target.value)}
                              placeholder={`Week ${week.week_number} title`}
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              rows="2"
                              value={week.description}
                              onChange={(e) => handleUpdateWeek(index, 'description', e.target.value)}
                              placeholder="What will students learn this week?"
                            />
                          </div>

                          <div className="form-group">
                            <label>Learning Objectives</label>
                            <textarea
                              rows="2"
                              value={week.objectives}
                              onChange={(e) => handleUpdateWeek(index, 'objectives', e.target.value)}
                              placeholder="Key learning objectives for this week..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Tasks</label>
                            <textarea
                              rows="2"
                              value={week.tasks}
                              onChange={(e) => handleUpdateWeek(index, 'tasks', e.target.value)}
                              placeholder="Tasks and activities for students..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Task Description</label>
                            <textarea
                              rows="3"
                              value={week.task_description}
                              onChange={(e) => handleUpdateWeek(index, 'task_description', e.target.value)}
                              placeholder="Detailed description of the tasks..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Resources</label>
                            <textarea
                              rows="2"
                              value={week.resources}
                              onChange={(e) => handleUpdateWeek(index, 'resources', e.target.value)}
                              placeholder="Learning resources, links, materials..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Deliverables</label>
                            <textarea
                              rows="2"
                              value={week.deliverables}
                              onChange={(e) => handleUpdateWeek(index, 'deliverables', e.target.value)}
                              placeholder="Expected deliverables from students..."
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: '16px' }}>
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#374151',
                              marginBottom: '8px'
                            }}>
                              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#ef4444' }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              Submission Deadline
                            </label>
                            <input
                              type="datetime-local"
                              value={week.due_date}
                              onChange={(e) => handleUpdateWeek(index, 'due_date', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                backgroundColor: '#f9fafb'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.backgroundColor = '#ffffff';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.backgroundColor = '#f9fafb';
                              }}
                            />
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '8px',
                              padding: '8px 12px',
                              backgroundColor: '#dbeafe',
                              borderRadius: '6px',
                              fontSize: '13px',
                              color: '#1e40af'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                              </svg>
                              Students will be notified 24 hours before the deadline
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setNewPlan({
                      internship_id: '',
                      title: '',
                      description: '',
                      duration_weeks: 4,
                      start_date: '',
                      end_date: '',
                      status: 'draft'
                    });
                    setPlanWeeks([]);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Plans */}
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h2>My Training Plans ({plans.length})</h2>
              {plans.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3>No Training Plans Yet</h3>
                  <p>Create your first training plan above to get started.</p>
                </div>
              ) : (
                <div className="plans-grid">
                  {plans.map(plan => (
                    <div key={plan.id} className="plan-card">
                      <div className="plan-header">
                        <h3>{plan.title}</h3>
                        <span className={`status-badge status-${plan.status}`}>
                          {plan.status}
                        </span>
                      </div>

                      <div className="plan-info">
                        <p className="internship-title">
                          <strong>Internship:</strong> {plan.internship_title}
                        </p>
                        <p className="company-name">
                          <strong>Company:</strong> {plan.company_name}
                        </p>
                      </div>

                      {plan.description && (
                        <p className="plan-description">{plan.description}</p>
                      )}

                      <div className="plan-stats">
                        <div className="stat-item">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span>{plan.duration_weeks} weeks</span>
                        </div>
                        <div className="stat-item">
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                          </svg>
                          <span>{plan.weeks_count || 0} weeks planned</span>
                        </div>
                      </div>

                      {(plan.start_date || plan.end_date) && (
                        <div className="plan-dates">
                          {plan.start_date && (
                            <span>Start: {new Date(plan.start_date).toLocaleDateString()}</span>
                          )}
                          {plan.end_date && (
                            <span>End: {new Date(plan.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}

                      <div className="plan-actions" style={{ 
                        display: 'flex', 
                        gap: '10px',
                        marginTop: '16px'
                      }}>
                        <button
                          className="btn-secondary-small"
                          onClick={() => loadPlanDetails(plan.id)}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: '2px solid #e5e7eb',
                            background: 'white',
                            color: '#374151',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = '#9ca3af';
                            e.target.style.background = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.background = 'white';
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: '2px solid #3b82f6',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Details Modal */}
            {selectedPlan && (
              <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{selectedPlan.title}</h2>
                    <button className="close-btn" onClick={() => setSelectedPlan(null)}>×</button>
                  </div>

                  <div className="modal-body">
                    <div className="plan-detail-info">
                      <p><strong>Internship:</strong> {selectedPlan.internship_title}</p>
                      <p><strong>Company:</strong> {selectedPlan.company_name}</p>
                      <p><strong>Duration:</strong> {selectedPlan.duration_weeks} weeks</p>
                      <p><strong>Status:</strong> <span className={`status-badge status-${selectedPlan.status}`}>{selectedPlan.status}</span></p>
                      {selectedPlan.description && (
                        <p><strong>Description:</strong> {selectedPlan.description}</p>
                      )}
                    </div>

                    <div className="weeks-timeline">
                      <h3>Weekly Breakdown</h3>
                      {selectedPlan.weeks && selectedPlan.weeks.length > 0 ? (
                        selectedPlan.weeks.map(week => (
                          <div key={week.id} className="week-detail-card">
                            <h4>Week {week.week_number}: {week.title}</h4>
                            {week.description && <p className="week-desc">{week.description}</p>}
                            
                            {week.objectives && (
                              <div className="week-section">
                                <strong>Objectives:</strong>
                                <p>{week.objectives}</p>
                              </div>
                            )}
                            
                            {week.tasks && (
                              <div className="week-section">
                                <strong>Tasks:</strong>
                                <p>{week.tasks}</p>
                              </div>
                            )}
                            
                            {week.task_description && (
                              <div className="week-section">
                                <strong>Task Description:</strong>
                                <p>{week.task_description}</p>
                              </div>
                            )}
                            
                            {week.resources && (
                              <div className="week-section">
                                <strong>Resources:</strong>
                                <p>{week.resources}</p>
                              </div>
                            )}
                            
                            {week.deliverables && (
                              <div className="week-section">
                                <strong>Deliverables:</strong>
                                <p>{week.deliverables}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No weekly breakdown available for this plan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Video Call Section */}
        {activeMenu === 'videocall' && (
          <>
            <div className="dashboard-header">
              <h1>Video Call/Meetings</h1>
              <p>Start a video call session</p>
            </div>

            <div className="profile-form-card" style={{ textAlign: 'center', padding: '60px 40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg 
                    width="64" 
                    height="64" 
                    fill="none" 
                    stroke="white" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <h2 style={{ fontSize: '32px', marginBottom: '15px', color: '#1e293b', fontWeight: '700' }}>
                Ready to Start a Video Call?
              </h2>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                Click the button below to create a new video call room. You can share the room link with your students.
              </p>

              <button
                onClick={handleStartVideoCall}
                className="btn-primary"
                style={{
                  padding: '18px 50px',
                  fontSize: '18px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Video Call
              </button>

              <div style={{ 
                marginTop: '40px', 
                padding: '20px 24px', 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '12px', 
                fontSize: '14px', 
                color: '#1e40af',
                borderLeft: '4px solid #3b82f6'
              }}>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                  <strong>Tip:</strong> Once you start the call, you can copy the room link and share it with your students via messages or other communication channels.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowSubmissionsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Submissions - {selectedStudent.full_name}</h2>
              <button className="modal-close" onClick={() => setShowSubmissionsModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {loadingSubmissions ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No Submissions Yet</h3>
                  <p>This student hasn't submitted any tasks yet.</p>
                </div>
              ) : (
                <div className="table-section">
                  <h3>All Submissions ({submissions.length})</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Plan</th>
                        <th>Week</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td><strong>{submission.task_title}</strong></td>
                          <td>{submission.plan_title}</td>
                          <td>Week {submission.week_number}</td>
                          <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                          <td>{getStatusBadge(submission.status)}</td>
                          <td>
                            <button 
                              className="btn-primary"
                              onClick={() => handleReviewSubmission(submission)}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              {submission.status === 'pending' ? 'Review' : 'View Review'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSubmissionsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Submission</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="task-detail-section">
                <h3>{selectedSubmission.task_title}</h3>
                <p><strong>Student:</strong> {selectedSubmission.student_name}</p>
                <p><strong>Plan:</strong> {selectedSubmission.plan_title}</p>
                <p><strong>Week:</strong> {selectedSubmission.week_number} - {selectedSubmission.week_title}</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>

              <div className="task-detail-section">
                <h4>Submission Content</h4>
                
                {selectedSubmission.submission_file && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>File:</strong>
                    <button 
                      onClick={() => downloadFile(selectedSubmission.submission_file)}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#1e88e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Download File
                    </button>
                  </div>
                )}

                {selectedSubmission.submission_text && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Text Submission:</strong>
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedSubmission.submission_text}
                    </div>
                  </div>
                )}

                {selectedSubmission.submission_link && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Link:</strong>
                    <a 
                      href={selectedSubmission.submission_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginLeft: '0.5rem', color: '#1e88e5', textDecoration: 'underline' }}
                    >
                      {selectedSubmission.submission_link}
                    </a>
                  </div>
                )}
              </div>

              {selectedSubmission.status !== 'pending' && (
                <div className="task-detail-section">
                  <h4>Previous Review</h4>
                  <p><strong>Status:</strong> {getStatusBadge(selectedSubmission.status)}</p>
                  {selectedSubmission.trainer_comment && (
                    <p><strong>Comment:</strong> {selectedSubmission.trainer_comment}</p>
                  )}
                  {selectedSubmission.reviewed_at && (
                    <p><strong>Reviewed:</strong> {new Date(selectedSubmission.reviewed_at).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="task-detail-section">
                <h4>Your Review</h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="approved">✅ Approve</option>
                    <option value="rejected">📝 Request Revision</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Comment for Student
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows="5"
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
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    💡 This comment will be sent as a notification to the student
                  </p>
                </div>

                {message.text && (
                  <div className={`alert alert-${message.type}`} style={{ marginTop: '1rem' }}>
                    {message.text}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowReviewModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmitReview}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#1e88e5',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Submitting...' : '📤 Submit Review & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Reports Modal */}
      {showWeeklyReportsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowWeeklyReportsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Weekly Reports - {selectedStudent.full_name}</h2>
              <button className="modal-close" onClick={() => setShowWeeklyReportsModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {loadingReports ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading weekly reports...</p>
                </div>
              ) : weeklyReports.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No Weekly Reports Yet</h3>
                  <p>This student hasn't submitted any weekly reports yet.</p>
                </div>
              ) : (
                <div className="table-section">
                  <h3>All Weekly Reports ({weeklyReports.length})</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>Plan</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyReports.map((report) => (
                        <tr key={report.id}>
                          <td><strong>Week {report.week_number}</strong></td>
                          <td>{report.plan_title || 'N/A'}</td>
                          <td>{new Date(report.submitted_at).toLocaleString()}</td>
                          <td>{getStatusBadge(report.status)}</td>
                          <td>
                            <button 
                              className="btn-primary"
                              onClick={() => handleReviewWeeklyReport(report)}
                              style={{ 
                                fontSize: '0.85rem', 
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#10b981',
                                borderColor: '#10b981'
                              }}
                            >
                              {report.status === 'pending' ? 'Review' : 'View Review'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowWeeklyReportsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report Review Modal */}
      {showReportReviewModal && selectedWeeklyReport && (
        <div className="modal-overlay" onClick={() => setShowReportReviewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Review Weekly Report</h2>
              <button className="modal-close" onClick={() => setShowReportReviewModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="task-detail-section">
                <h3>Week {selectedWeeklyReport.week_number} Report</h3>
                <p><strong>Student:</strong> {selectedWeeklyReport.student_name}</p>
                {selectedWeeklyReport.plan_title && (
                  <p><strong>Plan:</strong> {selectedWeeklyReport.plan_title}</p>
                )}
                <p><strong>Submitted:</strong> {new Date(selectedWeeklyReport.submitted_at).toLocaleString()}</p>
              </div>

              <div className="task-detail-section">
                <h4>Report Content</h4>
                
                {selectedWeeklyReport.report_file && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>File:</strong>
                    <button 
                      onClick={() => downloadFile(selectedWeeklyReport.report_file)}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Download File
                    </button>
                  </div>
                )}

                {selectedWeeklyReport.report_text && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Report Text:</strong>
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedWeeklyReport.report_text}
                    </div>
                  </div>
                )}
              </div>

              {selectedWeeklyReport.status !== 'pending' && (
                <div className="task-detail-section">
                  <h4>Previous Review</h4>
                  <p><strong>Status:</strong> {getStatusBadge(selectedWeeklyReport.status)}</p>
                  {selectedWeeklyReport.trainer_comment && (
                    <p><strong>Comment:</strong> {selectedWeeklyReport.trainer_comment}</p>
                  )}
                  {selectedWeeklyReport.reviewed_at && (
                    <p><strong>Reviewed:</strong> {new Date(selectedWeeklyReport.reviewed_at).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="task-detail-section">
                <h4>Your Review</h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={reportReviewStatus}
                    onChange={(e) => setReportReviewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="approved">✅ Approve</option>
                    <option value="rejected">📝 Request Revision</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Comment for Student
                  </label>
                  <textarea
                    value={reportReviewComment}
                    onChange={(e) => setReportReviewComment(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows="5"
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
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    💡 This comment will be sent as a notification to the student
                  </p>
                </div>

                {message.text && (
                  <div className={`alert alert-${message.type}`} style={{ marginTop: '1rem' }}>
                    {message.text}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowReportReviewModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmitReportReview}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  borderColor: loading ? '#9ca3af' : '#10b981',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Submitting...' : '📤 Submit Review & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Student Selection Modal for Video Call */}
      {showStudentSelectionModal && (
        <div className="modal-overlay" onClick={() => setShowStudentSelectionModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Students for Video Call</h2>
              <button className="modal-close" onClick={() => setShowStudentSelectionModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>
                  {message.text}
                </div>
              )}

              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Select the students you want to invite to the video call:
              </p>

              {students.length === 0 ? (
                <div className="empty-state">
                  <p>No students available</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {students.map((student) => (
                    <div 
                      key={student.student_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        backgroundColor: selectedStudentsForCall.includes(student.student_id) ? '#eff6ff' : '#f9fafb',
                        border: selectedStudentsForCall.includes(student.student_id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => toggleStudentForCall(student.student_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentsForCall.includes(student.student_id)}
                        onChange={() => toggleStudentForCall(student.student_id)}
                        style={{ marginRight: '1rem', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {student.full_name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {student.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem 1rem', 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af', fontWeight: '600' }}>
                  Selected: {selectedStudentsForCall.length} student(s)
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowStudentSelectionModal(false)}
                disabled={sendingInvitations}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSendVideoCallInvitations}
                disabled={sendingInvitations || selectedStudentsForCall.length === 0}
                style={{
                  backgroundColor: sendingInvitations || selectedStudentsForCall.length === 0 ? '#9ca3af' : '#3b82f6',
                  cursor: sendingInvitations || selectedStudentsForCall.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {sendingInvitations ? 'Sending...' : 'Send Invitations & Start Call'}
              </button>
            </div>
          </div>
        </div>
      )}

=======
      {/* Edit Plan Modal */}
      {showEditPlanModal && editingPlan && (
        <div className="modal-overlay" onClick={() => setShowEditPlanModal(false)} style={{
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
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 28px',
              borderBottom: '2px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px 16px 0 0'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Training Plan
              </h2>
              <button 
                onClick={() => setShowEditPlanModal(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{
              padding: '28px',
              maxHeight: 'calc(90vh - 180px)',
              overflowY: 'auto'
            }}>
              <form onSubmit={handleUpdatePlan}>
                <div className="form-group">
                  <label>Plan Title *</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (Weeks) *</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={newPlan.duration_weeks}
                      onChange={(e) => setNewPlan({...newPlan, duration_weeks: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={newPlan.start_date}
                      onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={newPlan.end_date}
                      onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newPlan.status}
                      onChange={(e) => setNewPlan({...newPlan, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Weekly Plan */}
                <div className="weeks-section">
                  <div className="weeks-header">
                    <h4>Weekly Plan</h4>
                    <button type="button" className="btn-add-week" onClick={handleAddWeek}>
                      + Add Week
                    </button>
                  </div>

                  {planWeeks.length > 0 && (
                    <div className="weeks-list">
                      {planWeeks.map((week, index) => (
                        <div key={index} className="week-item">
                          <div className="week-header">
                            <h5>Week {week.week_number}</h5>
                            <button 
                              type="button" 
                              className="btn-remove-week"
                              onClick={() => handleRemoveWeek(index)}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Week Title</label>
                            <input
                              type="text"
                              value={week.title}
                              onChange={(e) => handleUpdateWeek(index, 'title', e.target.value)}
                              placeholder="e.g., Introduction to React"
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              rows="2"
                              value={week.description}
                              onChange={(e) => handleUpdateWeek(index, 'description', e.target.value)}
                              placeholder="Brief description of this week..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Learning Objectives</label>
                            <textarea
                              rows="2"
                              value={week.objectives}
                              onChange={(e) => handleUpdateWeek(index, 'objectives', e.target.value)}
                              placeholder="What students should learn..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Tasks Title</label>
                            <input
                              type="text"
                              value={week.tasks}
                              onChange={(e) => handleUpdateWeek(index, 'tasks', e.target.value)}
                              placeholder="e.g., Build a Todo App"
                            />
                          </div>

                          <div className="form-group">
                            <label>Task Description</label>
                            <textarea
                              rows="3"
                              value={week.task_description}
                              onChange={(e) => handleUpdateWeek(index, 'task_description', e.target.value)}
                              placeholder="Detailed description of the task..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Resources</label>
                            <textarea
                              rows="2"
                              value={week.resources}
                              onChange={(e) => handleUpdateWeek(index, 'resources', e.target.value)}
                              placeholder="Links, documentation, tutorials..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Deliverables</label>
                            <textarea
                              rows="2"
                              value={week.deliverables}
                              onChange={(e) => handleUpdateWeek(index, 'deliverables', e.target.value)}
                              placeholder="Expected deliverables from students..."
                            />
                          </div>

                          <div className="form-group" style={{ marginTop: '16px' }}>
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#374151',
                              marginBottom: '8px'
                            }}>
                              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#ef4444' }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              Submission Deadline
                            </label>
                            <input
                              type="datetime-local"
                              value={week.due_date}
                              onChange={(e) => handleUpdateWeek(index, 'due_date', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                backgroundColor: '#f9fafb'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.backgroundColor = '#ffffff';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.backgroundColor = '#f9fafb';
                              }}
                            />
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '8px',
                              padding: '8px 12px',
                              backgroundColor: '#dbeafe',
                              borderRadius: '6px',
                              fontSize: '13px',
                              color: '#1e40af'
                            }}>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                              </svg>
                              Students will be notified 24 hours before the deadline
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '24px 28px',
                  borderTop: '2px solid #e5e7eb',
                  background: '#f9fafb',
                  marginTop: '24px',
                  borderRadius: '0 0 16px 16px'
                }}>
                  <button 
                    type="button" 
                    onClick={() => setShowEditPlanModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      color: '#374151',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'white';
                    }}
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      border: '2px solid #10b981',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 10px -1px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                    </svg>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
>>>>>>> origin/mergevideocall
    </div>
  );
}

export default TrainerDashboard;
