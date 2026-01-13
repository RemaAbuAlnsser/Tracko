import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CompanyDashboard.css';
import { 
  loadChatMessages, 
  sendChatMessage, 
  subscribeToMessages, 
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount 
} from '../utils/chatService';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

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
    training_hours: '',
    status: 'pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [internships, setInternships] = useState([]);
  const [internshipSearchTerm, setInternshipSearchTerm] = useState('');
  const [internshipFilterStatus, setInternshipFilterStatus] = useState('all');
  const [statistics, setStatistics] = useState({
    studentsCount: 0,
    activePartnershipsCount: 0,
    internshipsCount: 0
  });
  const [students, setStudents] = useState([]);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [studentsFilterStatus, setStudentsFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedWeeklyReport, setSelectedWeeklyReport] = useState(null);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [weeklyReportComment, setWeeklyReportComment] = useState('');
  const [showPartnershipViewModal, setShowPartnershipViewModal] = useState(false);
  const [showPartnershipEditModal, setShowPartnershipEditModal] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [editPartnershipData, setEditPartnershipData] = useState({});
  
  // Messages/Chat state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesChannel, setMessagesChannel] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const messagesEndRef = useRef(null);
  
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
          console.log('✅ University data loaded:', university);
          setUniversityData(university);
        } else {
          console.log('⚠️ University not found in database for email:', email);
          // Initialize with user data if university not found
          const userData = JSON.parse(localStorage.getItem('user'));
          setUniversityData(prev => ({
            ...prev,
            name: userData?.full_name || '',
            email: email
          }));
        }
      }
    } catch (error) {
      console.error('Error loading university data:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      console.log('📧 Loading notifications for user:', user.id);
      const response = await fetch(`http://localhost:5050/api/notifications/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Notifications response:', data);
        setNotifications(data.notifications || data.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5050/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (user && activeMenu === 'notifications') {
      loadNotifications();
    }
  }, [user, activeMenu]);

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
      // Use email-based endpoint if id is not available
      const endpoint = universityData.id 
        ? `http://localhost:5050/api/universities/${universityData.id}`
        : `http://localhost:5050/api/universities/email/${user.email}`;
      
      console.log('📤 Updating university via:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(universityData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update universityData with the returned data to ensure we have the id
        if (data.data) {
          setUniversityData(data.data);
        }
        
        // Update localStorage if name or email changed
        if (universityData.name !== user.full_name || universityData.email !== user.email) {
          const updatedUser = {
            ...user,
            full_name: universityData.name,
            email: universityData.email
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('✅ User data updated in localStorage');
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

  // Load internships when internships menu is active
  useEffect(() => {
    if (activeMenu === 'internships' && universityData.id) {
      loadInternships();
    }
  }, [activeMenu, universityData.id]);

  // Load statistics when dashboard is active
  useEffect(() => {
    if (activeMenu === 'dashboard' && universityData.id) {
      loadStatistics();
      loadRegistrationRequests();
    }
  }, [activeMenu, universityData.id]);

  // Load students when university data is loaded (for messages badge and students menu)
  useEffect(() => {
    if (universityData.id) {
      loadStudents();
    }
  }, [universityData.id]);

  // Load conversations when messages menu is active
  useEffect(() => {
    if (activeMenu === 'messages' && universityData.id) {
      // Load students first if not already loaded
      if (students.length === 0) {
        loadStudents().then(() => {
          // Students will be loaded, and the next useEffect will handle conversations
        });
      } else {
        loadConversations();
      }
    }
  }, [activeMenu, universityData.id]);

  // Load weekly reports immediately when university data is available (for badge count)
  useEffect(() => {
    if (universityData.id) {
      loadWeeklyReports();
    }
  }, [universityData.id, activeMenu]);

  // Load conversations when students are loaded
  useEffect(() => {
    if (activeMenu === 'messages' && students.length > 0) {
      loadConversations();
    }
  }, [students, activeMenu]);

  // Load unread messages count on mount and periodically
  useEffect(() => {
    if (user && universityData.id && students.length > 0) {
      loadConversations(); // Load initial unread count
      
      // Update unread count every 30 seconds
      const interval = setInterval(() => {
        loadConversations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, universityData.id, students.length]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user || activeMenu !== 'messages') return;

    const handleNewMessage = (newMsg) => {
      console.log('📨 New message received:', newMsg);
      
      // If message is for current conversation, add it to messages
      if (selectedStudent && 
          (Number(newMsg.sender_id) === Number(selectedStudent.user_id) || 
           Number(newMsg.receiver_id) === Number(selectedStudent.user_id))) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(msg => msg.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Auto-scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
        
        // Mark as read if it's from the selected student
        if (Number(newMsg.sender_id) === Number(selectedStudent.user_id)) {
          markMessagesAsRead(selectedStudent.user_id, user.id);
        }
      }
      
      // Reload conversations to update unread counts
      loadConversations();
    };

    const channel = subscribeToMessages(user.id, handleNewMessage);
    setMessagesChannel(channel);

    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [user, activeMenu, selectedStudent]);

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

  // Auto-populate coordinator names when company is selected
  useEffect(() => {
    if (selectedCompany && companies.length > 0) {
      const company = companies.find(c => c.id === parseInt(selectedCompany));
      if (company) {
        setPartnershipData(prev => ({
          ...prev,
          contact_person_university: universityData.coordinator_name || prev.contact_person_university,
          contact_person_company: company.coordinator_name || prev.contact_person_company
        }));
      }
    }
  }, [selectedCompany, companies, universityData.coordinator_name]);

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
          training_hours: '',
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

  const handleViewPartnership = (partnership) => {
    setSelectedPartnership(partnership);
    setShowPartnershipViewModal(true);
  };

  const handleEditPartnership = (partnership) => {
    console.log('🔍 Partnership data:', partnership);
    console.log('👥 University Coordinator:', partnership.university_coordinator);
    console.log('👥 Company Coordinator:', partnership.company_coordinator);
    
    setSelectedPartnership(partnership);
    setEditPartnershipData({
      agreement_date: partnership.agreement_date ? partnership.agreement_date.split('T')[0] : '',
      agreement_end_date: partnership.agreement_end_date ? partnership.agreement_end_date.split('T')[0] : '',
      agreement_duration: partnership.agreement_duration || '',
      contact_person_university: partnership.university_coordinator || partnership.contact_person_university || '',
      contact_person_company: partnership.company_coordinator || partnership.contact_person_company || '',
      terms_and_conditions: partnership.terms_and_conditions || '',
      training_hours: partnership.training_hours || '',
      status: partnership.status || 'pending'
    });
    setShowPartnershipEditModal(true);
  };

  const handleEditPartnershipInputChange = (e) => {
    const { name, value } = e.target;
    setEditPartnershipData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePartnershipEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/partnerships/${selectedPartnership.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          university_id: universityData.id,
          company_id: selectedPartnership.company_id,
          ...editPartnershipData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Partnership updated successfully!' });
        setShowPartnershipEditModal(false);
        loadPartnerships();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update partnership' });
      }
    } catch (error) {
      console.error('Update partnership error:', error);
      setMessage({ type: 'error', text: 'Failed to update partnership' });
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

  const loadInternships = async () => {
    if (!universityData.id) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/internships/by-university/${universityData.id}`);
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Loaded internships:', data.data);
        setInternships(data.data || []);
      }
    } catch (error) {
      console.error('Error loading internships:', error);
    }
  };

  const loadStatistics = async () => {
    if (!universityData.id) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/universities/${universityData.id}/statistics`);
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Loaded statistics:', data.data);
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadRegistrationRequests = async () => {
    if (!universityData.id) return;
    
    try {
      console.log('📋 Loading registration requests for university:', universityData.id);
      const response = await fetch(`http://localhost:5050/api/universities/${universityData.id}/registration-requests`);
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Loaded registration requests:', data.data);
        setRegistrationRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error loading registration requests:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this student registration?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/universities/registration-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId: universityData.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student registration approved successfully!' });
        loadRegistrationRequests();
        loadStatistics();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to approve request' });
      }
    } catch (error) {
      console.error('Approve error:', error);
      setMessage({ type: 'error', text: 'Failed to approve request' });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this student registration?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/universities/registration-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universityId: universityData.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student registration rejected successfully!' });
        loadRegistrationRequests();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reject request' });
      }
    } catch (error) {
      console.error('Reject error:', error);
      setMessage({ type: 'error', text: 'Failed to reject request' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!universityData.id) {
      console.log('⚠️ Cannot load students: university ID is missing');
      console.log('Current universityData:', universityData);
      return;
    }
    
    try {
      console.log(`📚 Loading students for university ID: ${universityData.id}`);
      const response = await fetch(`http://localhost:5050/api/students/university/${universityData.id}`);
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Loaded students:', data.data);
        setStudents(data.data || []);
      } else {
        console.error('❌ Failed to load students:', data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadWeeklyReports = async () => {
    if (!universityData.id) {
      console.log('⚠️ Cannot load weekly reports: university ID is missing');
      return;
    }
    
    try {
      console.log(`📚 Loading weekly reports for university ID: ${universityData.id}`);
      const response = await fetch(`http://localhost:5050/api/weekly-reports/university/${universityData.id}`);
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Loaded weekly reports:', data.reports);
        setWeeklyReports(data.reports || []);
      } else {
        console.error('❌ Failed to load weekly reports:', data);
      }
    } catch (error) {
      console.error('Error loading weekly reports:', error);
    }
  };

  const handleViewStudentReports = (studentId, studentName) => {
    // Get all reports for this student
    const studentReports = weeklyReports.filter(r => r.student_id === studentId);
    setSelectedWeeklyReport({ 
      student_id: studentId,
      student_name: studentName,
      allReports: studentReports 
    });
    setWeeklyReportComment('');
    setShowWeeklyReportModal(true);
  };

  const handleApproveWeeklyReport = async (reportId) => {
    if (!reportId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/weekly-reports/${reportId}/university-review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: true,
          university_comment: weeklyReportComment
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Weekly report approved successfully!' });
        setWeeklyReportComment('');
        
        // Reload weekly reports and update the modal
        const reportsResponse = await fetch(`http://localhost:5050/api/weekly-reports/university/${universityData.id}`);
        const reportsData = await reportsResponse.json();
        if (reportsResponse.ok) {
          const updatedReports = reportsData.reports || [];
          setWeeklyReports(updatedReports);
          
          // Update the student reports in the modal with fresh data
          const studentReports = updatedReports.filter(r => r.student_id === selectedWeeklyReport.student_id);
          setSelectedWeeklyReport({ 
            ...selectedWeeklyReport,
            allReports: studentReports 
          });
        }
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to approve report' });
      }
    } catch (error) {
      console.error('Approve error:', error);
      setMessage({ type: 'error', text: 'Failed to approve report' });
    } finally {
      setLoading(false);
    }
  };


  // Filter partnerships
  const filteredPartnerships = partnerships.filter(partnership => {
    const matchesSearch = partnership.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.contact_person_company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || partnership.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter internships
  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title?.toLowerCase().includes(internshipSearchTerm.toLowerCase()) ||
                         internship.company_name?.toLowerCase().includes(internshipSearchTerm.toLowerCase()) ||
                         internship.specialization?.toLowerCase().includes(internshipSearchTerm.toLowerCase());
    const matchesStatus = internshipFilterStatus === 'all' || internship.status === internshipFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
                         student.major?.toLowerCase().includes(studentsSearchTerm.toLowerCase());
    
    // Filter by training status
    let matchesStatus = true;
    if (studentsFilterStatus === 'completed') {
      // Show only students who have completed training (have certificate)
      const hasCertificate = student.certificate_file != null && student.certificate_file !== '';
      matchesStatus = hasCertificate;
    } else if (studentsFilterStatus === 'in_training') {
      // Show only students who are in training (have match but no certificate)
      const hasMatch = student.match_id != null;
      const hasCertificate = student.certificate_file != null && student.certificate_file !== '';
      matchesStatus = hasMatch && !hasCertificate;
    }
    // 'all' shows everyone
    
    return matchesSearch && matchesStatus;
  });

  // Approve final report
  const handleApproveFinalReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to approve this final report? This will mark the student\'s training as completed.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/final-reports/${reportId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          university_id: universityData.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Final report approved successfully!' });
        setShowReportModal(false);
        loadStudents(); // Reload students to get updated data
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to approve report' });
      }
    } catch (error) {
      console.error('Approve error:', error);
      setMessage({ type: 'error', text: 'Failed to approve report' });
    } finally {
      setLoading(false);
    }
  };

  // Load students as conversations for chat
  const loadConversations = async () => {
    if (!user || !students || students.length === 0) {
      console.log('⚠️ Cannot load conversations:', { 
        hasUser: !!user, 
        studentsCount: students?.length || 0 
      });
      return;
    }
    
    console.log('🔄 Loading conversations for', students.length, 'students');
    
    try {
      const studentsWithUnread = await Promise.all(
        students.map(async (student) => {
          const unreadCount = await getUnreadCount(user.id, student.user_id);
          return {
            ...student,
            unread_count: unreadCount
          };
        })
      );
      setConversations(studentsWithUnread);
      
      // Calculate total unread messages
      const totalUnread = studentsWithUnread.reduce((sum, student) => sum + (student.unread_count || 0), 0);
      console.log('✅ Total unread messages:', totalUnread);
      setTotalUnreadMessages(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for selected student
  const loadMessages = async (student) => {
    if (!user || !student) return;
    
    console.log('📨 Loading messages for student:', {
      student_name: student.full_name,
      student_user_id: student.user_id,
      university_user_id: user.id
    });
    
    try {
      const chatMessages = await loadChatMessages(user.id, student.user_id);
      console.log('✅ Loaded messages:', chatMessages.length, 'messages');
      setMessages(chatMessages);
      setSelectedStudent(student);
      setSelectedConversation(student.id);
      
      // Mark messages as read
      await markMessagesAsRead(student.user_id, user.id);
      
      // Update conversations to reset unread count for this student
      setConversations(prev => prev.map(conv => 
        conv.id === student.id ? { ...conv, unread_count: 0 } : conv
      ));
      
      // Recalculate total unread messages
      const updatedTotal = conversations.reduce((sum, conv) => {
        if (conv.id === student.id) return sum;
        return sum + (conv.unread_count || 0);
      }, 0);
      setTotalUnreadMessages(updatedTotal);
      
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="company-dashboard">
      {/* Sidebar */}
      <aside className="company-sidebar">
        {/* University Profile Section */}
        <div className="company-profile-section" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              margin: '0 0 4px 0',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {universityData.name || user.full_name}
            </h3>
            <div className="company-badge" style={{ 
              marginTop: '8px',
              padding: '4px 10px',
              fontSize: '12px'
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
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
            style={{ position: 'relative' }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports & Analytics
            {weeklyReports.filter(r => !r.university_approved).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {weeklyReports.filter(r => !r.university_approved).length}
              </span>
            )}
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
            onClick={() => {
              setActiveMenu('messages');
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages/Chat
            {totalUnreadMessages > 0 && (
              <span className="nav-badge">{totalUnreadMessages}</span>
            )}
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
              <h1>University Dashboard</h1>
              <p>Welcome back, {universityData.name || user.full_name}! Monitor your students and partnerships.</p>
            </div>

            {/* Key Performance Indicators */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                University Performance
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Overview of academic partnerships and placements</p>
            </div>

            <div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '24px',
                  marginTop: '20px'
                }}>
                  <div style={{ 
                    padding: '28px', 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                    borderRadius: '20px',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => setActiveMenu('students')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.95 }}>Students</span>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.25)', 
                        padding: '4px 12px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>ENROLLED</span>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
                      {statistics.studentsCount}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Total students enrolled</div>
                    <div style={{ fontSize: '11px', opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Placement Rate</span>
                      <span style={{ fontWeight: '600' }}>{statistics.studentsCount > 0 ? '92%' : '0%'}</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '28px', 
                    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
                    borderRadius: '20px',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => setActiveMenu('partnerships')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.95 }}>Active Partnerships</span>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.25)', 
                        padding: '4px 12px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>COMPANIES</span>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
                      {statistics.activePartnershipsCount}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Active company partnerships</div>
                    <div style={{ fontSize: '11px', opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Partnership Growth</span>
                      <span style={{ fontWeight: '600' }}>+{Math.floor(statistics.activePartnershipsCount * 0.2)} this year</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '28px', 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                    borderRadius: '20px',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => setActiveMenu('internships')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.95 }}>Internship Opportunities</span>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.25)', 
                        padding: '4px 12px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>AVAILABLE</span>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
                      {statistics.internshipsCount}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Available internships</div>
                    <div style={{ fontSize: '11px', opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Match Rate</span>
                      <span style={{ fontWeight: '600' }}>{statistics.internshipsCount > 0 ? '88%' : '0%'}</span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Charts Section for University */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '40px' }}>
              {/* Line Chart - University Growth */}
              <div className="stat-card" style={{ gridColumn: 'span 2', minHeight: '350px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>University Growth Trends</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Last 6 Months</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[
                    { month: 'Jun', students: Math.max(50, Math.floor(statistics.studentsCount * 0.5)), partnerships: Math.max(3, Math.floor(statistics.activePartnershipsCount * 0.5)), internships: Math.max(5, Math.floor(statistics.internshipsCount * 0.35)) },
                    { month: 'Jul', students: Math.max(70, Math.floor(statistics.studentsCount * 0.6)), partnerships: Math.max(4, Math.floor(statistics.activePartnershipsCount * 0.62)), internships: Math.max(8, Math.floor(statistics.internshipsCount * 0.52)) },
                    { month: 'Aug', students: Math.max(90, Math.floor(statistics.studentsCount * 0.7)), partnerships: Math.max(5, Math.floor(statistics.activePartnershipsCount * 0.75)), internships: Math.max(12, Math.floor(statistics.internshipsCount * 0.65)) },
                    { month: 'Sep', students: Math.max(110, Math.floor(statistics.studentsCount * 0.8)), partnerships: Math.max(6, Math.floor(statistics.activePartnershipsCount * 0.87)), internships: Math.max(16, Math.floor(statistics.internshipsCount * 0.82)) },
                    { month: 'Oct', students: Math.max(130, Math.floor(statistics.studentsCount * 0.9)), partnerships: Math.max(7, Math.floor(statistics.activePartnershipsCount * 0.93)), internships: Math.max(20, Math.floor(statistics.internshipsCount * 0.93)) },
                    { month: 'Nov', students: statistics.studentsCount || 0, partnerships: statistics.activePartnershipsCount || 0, internships: statistics.internshipsCount || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#0ea5e9" strokeWidth={3} name="Students" />
                    <Line type="monotone" dataKey="partnerships" stroke="#22c55e" strokeWidth={3} name="Partnerships" />
                    <Line type="monotone" dataKey="internships" stroke="#f59e0b" strokeWidth={3} name="Internships" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Current Overview */}
              <div className="stat-card" style={{ minHeight: '350px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>Current Statistics</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Overview</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { name: 'Students', value: statistics.studentsCount, fill: '#0ea5e9' },
                    { name: 'Partnerships', value: statistics.activePartnershipsCount, fill: '#22c55e' },
                    { name: 'Internships', value: statistics.internshipsCount, fill: '#f59e0b' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Distribution */}
              <div className="stat-card" style={{ minHeight: '350px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>Resource Distribution</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: statistics.studentsCount || 1 },
                        { name: 'Partnerships', value: (statistics.activePartnershipsCount || 1) * 10 },
                        { name: 'Internships', value: (statistics.internshipsCount || 1) * 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

              {/* Student Registration Requests Section */}
              {registrationRequests.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>
                    Pending Student Registration Requests
                  </h3>
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{ 
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          borderBottom: '2px solid #bae6fd'
                        }}>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            fontWeight: '600',
                            color: '#0369a1',
                            fontSize: '14px'
                          }}>Student Name</th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            fontWeight: '600',
                            color: '#0369a1',
                            fontSize: '14px'
                          }}>Email</th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            fontWeight: '600',
                            color: '#0369a1',
                            fontSize: '14px'
                          }}>Requested At</th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            fontWeight: '600',
                            color: '#0369a1',
                            fontSize: '14px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrationRequests.map((request, index) => (
                          <tr key={request.id} style={{ 
                            borderBottom: index < registrationRequests.length - 1 ? '1px solid #e5e7eb' : 'none',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ 
                              padding: '16px',
                              color: '#1f2937',
                              fontSize: '14px'
                            }}>{request.full_name}</td>
                            <td style={{ 
                              padding: '16px',
                              color: '#6b7280',
                              fontSize: '14px'
                            }}>{request.email}</td>
                            <td style={{ 
                              padding: '16px',
                              color: '#6b7280',
                              fontSize: '14px'
                            }}>{new Date(request.created_at).toLocaleString()}</td>
                            <td style={{ 
                              padding: '16px',
                              textAlign: 'center'
                            }}>
                              <button 
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={loading}
                                style={{
                                  padding: '8px 16px',
                                  marginRight: '8px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  transition: 'background-color 0.2s',
                                  opacity: loading ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#059669')}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#10b981')}
                              >
                                ✓ Approve
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={loading}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  transition: 'background-color 0.2s',
                                  opacity: loading ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#dc2626')}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ef4444')}
                              >
                                ✕ Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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

                <div className="form-row">
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

                  <div className="form-group">
                    <label>Required Training Hours *</label>
                    <input 
                      type="number" 
                      name="training_hours"
                      value={partnershipData.training_hours}
                      onChange={handlePartnershipInputChange}
                      min="1"
                      placeholder="e.g., 240"
                      required
                    />
                  </div>
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
                              <button 
                                className="action-btn view-btn" 
                                title="View Details"
                                onClick={() => handleViewPartnership(partnership)}
                                style={{ 
                                  marginRight: '8px', 
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#3b82f6',
                                  padding: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                className="action-btn edit-btn" 
                                title="Edit"
                                onClick={() => handleEditPartnership(partnership)}
                                style={{ 
                                  marginRight: '8px', 
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#f59e0b',
                                  padding: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                title="Delete"
                                onClick={() => handleDeletePartnership(partnership.id)}
                                style={{ 
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  padding: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <>
            <div className="manage-header">
              <div>
                <h1>Students Management</h1>
                <p>View and manage all students from your university</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="manage-filters" style={{ marginTop: '30px' }}>
              <div className="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Search students by name, email, or major..."
                  value={studentsSearchTerm}
                  onChange={(e) => setStudentsSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={studentsFilterStatus}
                onChange={(e) => setStudentsFilterStatus(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="completed">Training Completed</option>
                <option value="in_training">In Training</option>
              </select>
            </div>

            {/* Students Table */}
            <div className="internships-table-container">
              <div className="table-header-section">
                <h3>University Students</h3>
                <span className="posts-count">{filteredStudents.length} students</span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3>No students found</h3>
                  <p>No students are registered from your university yet</p>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Major</th>
                        <th>Academic Year</th>
                        <th>GPA</th>
                        <th>Training Status</th>
                        <th>Current Internship</th>
                        <th>Final Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        // Get the most recent internship (accepted or pending)
                        const currentInternship = student.internships?.find(i => 
                          i.match_status === 'accepted' || i.match_status === 'pending'
                        ) || student.internships?.[0];
                        
                        return (
                          <tr key={student.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {student.student_img ? (
                                  <img 
                                    src={`http://localhost:5050${student.student_img}`}
                                    alt={student.full_name}
                                    style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      borderRadius: '50%', 
                                      objectFit: 'cover' 
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                  }}>
                                    {student.full_name?.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <strong>{student.full_name}</strong>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>{student.major || 'N/A'}</td>
                            <td>{student.academic_year || 'N/A'}</td>
                            <td>
                              {student.gpa ? (
                                <span style={{
                                  padding: '4px 8px',
                                  background: student.gpa >= 3.5 ? '#dcfce7' : student.gpa >= 3.0 ? '#fef3c7' : '#fee2e2',
                                  color: student.gpa >= 3.5 ? '#15803d' : student.gpa >= 3.0 ? '#92400e' : '#991b1b',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}>
                                  {student.gpa}
                                </span>
                              ) : 'N/A'}
                            </td>
                            <td>
                              {student.final_report && student.final_report.university_approved ? (
                                <span style={{
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                  color: '#15803d',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Training Completed
                                </span>
                              ) : currentInternship && currentInternship.match_status === 'accepted' ? (
                                <span style={{
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                  color: '#92400e',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  In Training
                                </span>
                              ) : (
                                <span style={{
                                  padding: '6px 12px',
                                  background: '#f3f4f6',
                                  color: '#6b7280',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}>
                                  Not Started
                                </span>
                              )}
                            </td>
                            <td>
                              {currentInternship ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {currentInternship.company_logo ? (
                                      <img 
                                        src={`http://localhost:5050${currentInternship.company_logo}`}
                                        alt={currentInternship.company_name}
                                        style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                                      />
                                    ) : null}
                                    <strong style={{ fontSize: '13px' }}>{currentInternship.internship_title}</strong>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {currentInternship.company_name}
                                  </div>
                                  <span className={`status-badge status-${currentInternship.match_status}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                                    {currentInternship.match_status}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '13px' }}>No active internship</span>
                              )}
                            </td>
                            <td>
                              {student.final_report ? (
                                <button
                                  onClick={() => {
                                    setSelectedReport({ ...student.final_report, student_name: student.full_name });
                                    setShowReportModal(true);
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: student.final_report.university_approved 
                                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                  </svg>
                                  {student.final_report.university_approved ? 'View Report' : 'Review Report'}
                                </button>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '13px' }}>No report yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu === 'internships' && (
          <>
            <div className="manage-header">
              <div>
                <h1>Internship Opportunities</h1>
                <p>Browse all available internships from companies</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="manage-filters" style={{ marginTop: '30px' }}>
              <div className="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Search internships..."
                  value={internshipSearchTerm}
                  onChange={(e) => setInternshipSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={internshipFilterStatus}
                onChange={(e) => setInternshipFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            {/* Internships Table */}
            <div className="internships-table-container">
              <div className="table-header-section">
                <h3>Available Internships</h3>
                <span className="posts-count">{filteredInternships.length} internships</span>
              </div>

              {filteredInternships.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3>No internships found</h3>
                  <p>No internship opportunities available yet</p>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Internship Title</th>
                        <th>Specialization</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Trainers</th>
                        <th>Posted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInternships.map((internship) => (
                        <tr key={internship.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {internship.company_logo ? (
                                <img 
                                  src={`http://localhost:5050${internship.company_logo}`}
                                  alt={internship.company_name}
                                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {internship.company_name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <strong>{internship.company_name}</strong>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {internship.company_industry}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{internship.title}</strong>
                          </td>
                          <td>{internship.specialization || 'N/A'}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              {internship.capacity} position(s)
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${internship.status}`}>
                              {internship.status}
                            </span>
                          </td>
                          <td>
                            {internship.trainers && internship.trainers.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {internship.trainers.map((trainer, idx) => (
                                  <span key={idx} className="trainer-badge" title={trainer.full_name}>
                                    {trainer.full_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-trainers">No trainers</span>
                            )}
                          </td>
                          <td>
                            {new Date(internship.created_at).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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

        {activeMenu === 'reports' && (
          <>
            <div className="manage-header">
              <div>
                <h1>Reports & Analytics</h1>
                <p>Review and approve weekly reports submitted by students</p>
              </div>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`} style={{ marginTop: '20px' }}>
                {message.text}
              </div>
            )}

            {/* Weekly Reports Table */}
            <div className="internships-table-container" style={{ marginTop: '30px' }}>
              <div className="table-header-section">
                <h3>Student Weekly Reports</h3>
                <span className="posts-count">
                  {(() => {
                    const uniqueStudents = [...new Set(weeklyReports.map(r => r.student_id))];
                    return uniqueStudents.length;
                  })()} students
                </span>
              </div>

              {weeklyReports.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No reports found</h3>
                  <p>No weekly reports have been submitted yet</p>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Latest Week</th>
                        <th>Internship</th>
                        <th>Last Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Group reports by student_id and get the latest report for each student
                        const studentReportsMap = {};
                        weeklyReports.forEach(report => {
                          if (!studentReportsMap[report.student_id] || 
                              new Date(report.submitted_at) > new Date(studentReportsMap[report.student_id].submitted_at)) {
                            studentReportsMap[report.student_id] = report;
                          }
                        });
                        const latestReports = Object.values(studentReportsMap);
                        
                        return latestReports.map((report) => (
                          <tr key={report.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {report.student_img ? (
                                  <img 
                                    src={`http://localhost:5050${report.student_img}`}
                                    alt={report.student_name}
                                    style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      borderRadius: '50%', 
                                      objectFit: 'cover' 
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                  }}>
                                    {report.student_name?.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <strong>{report.student_name}</strong>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {report.student_email}
                                  </div>
                                </div>
                              </div>
                            </td>
                          <td>
                            <span style={{
                              padding: '6px 12px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              Week {report.week_number}
                            </span>
                          </td>
                          <td>
                            {report.internship_title ? (
                              <div>
                                <strong style={{ fontSize: '13px' }}>{report.internship_title}</strong>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {report.company_name}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '13px' }}>No internship</span>
                            )}
                          </td>
                          <td>
                            {new Date(report.submitted_at).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td>
                            {report.university_approved ? (
                              <span style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                color: '#15803d',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Approved
                              </span>
                            ) : (
                              <span style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                color: '#92400e',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Pending Review
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleViewStudentReports(report.student_id, report.student_name)}
                              style={{
                                padding: '8px 16px',
                                background: report.university_approved 
                                  ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {report.university_approved ? 'View Report' : 'Review Report'}
                            </button>
                          </td>
                        </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu === 'notifications' && (
          <div className="dashboard-content">
            <div className="manage-header">
              <h1>Notifications</h1>
              <p>View all your notifications and updates</p>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3>No Notifications Yet</h3>
                <p>You'll see notifications here when you receive them</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-icon">
                      {notification.type === 'training_completion' ? (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : notification.type === 'application' ? (
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

        {activeMenu === 'messages' && (
          <>
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Chat with your students</p>
            </div>

            <div className="chat-container">
              {/* Students List (Conversations) */}
              <div className="conversations-sidebar">
                <h3>My Students</h3>
                {conversations.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No students yet</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {conversations.map(student => (
                      <div
                        key={student.id}
                        className={`conversation-item ${selectedConversation === student.id ? 'active' : ''}`}
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
                    <h3>Select a Student</h3>
                    <p>Choose a student from the list to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    {selectedStudent && (
                      <div className="chat-header">
                        <div className="conversation-avatar">
                          {selectedStudent.student_img ? (
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
                            selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S'
                          )}
                        </div>
                        <div>
                          <h3>{selectedStudent.full_name}</h3>
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
                            const isSentByUniversity = Number(msg.sender_id) === Number(user.id);
                            return (
                            <div
                              key={msg.id}
                              className={`message-item ${isSentByUniversity ? 'sent' : 'received'}`}
                            >
                              {/* Show avatar for receiver (student) on left */}
                              {!isSentByUniversity && selectedStudent && (
                                <div className="message-avatar">
                                  {selectedStudent.student_img ? (
                                    <img 
                                      src={selectedStudent.student_img.startsWith('http') ? selectedStudent.student_img : `http://localhost:5050${selectedStudent.student_img}`} 
                                      alt={selectedStudent.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S';
                                      }}
                                    />
                                  ) : (
                                    selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S'
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
                              {/* Show avatar for sender (university) on right */}
                              {isSentByUniversity && (
                                <div className="message-avatar">
                                  {universityData.logo ? (
                                    <img 
                                      src={`http://localhost:5050${universityData.logo}`} 
                                      alt={user.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
                                      }}
                                    />
                                  ) : (
                                    user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
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
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Final Report Modal */}
        {showReportModal && selectedReport && (
          <div style={{
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
          onClick={() => setShowReportModal(false)}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px 16px 0 0'
              }}>
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700' }}>
                    Final Training Report
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                    Student: {selectedReport.student_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {/* Trainer Info */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    <strong style={{ color: '#111827' }}>Trainer:</strong> {selectedReport.trainer_name}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    <strong style={{ color: '#111827' }}>Submitted:</strong> {new Date(selectedReport.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Overall Performance */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                    Overall Performance
                  </h3>
                  <p style={{
                    padding: '16px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    color: '#0c4a6e',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {selectedReport.overall_performance || 'No comments provided'}
                  </p>
                </div>

                {/* Ratings Grid */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Performance Ratings
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {[
                      { label: 'Technical Skills', value: selectedReport.technical_skills_rating, color: '#3b82f6' },
                      { label: 'Communication', value: selectedReport.communication_rating, color: '#8b5cf6' },
                      { label: 'Teamwork', value: selectedReport.teamwork_rating, color: '#10b981' },
                      { label: 'Problem Solving', value: selectedReport.problem_solving_rating, color: '#f59e0b' },
                      { label: 'Attendance', value: selectedReport.attendance_rating, color: '#ef4444' }
                    ].map((rating, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                          {rating.label}
                        </p>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '700',
                          color: rating.color,
                          marginBottom: '4px'
                        }}>
                          {rating.value || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>out of 10</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Rating */}
                {selectedReport.overall_rating && (
                  <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
                      Overall Rating
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: '#78350f' }}>
                      {selectedReport.overall_rating}
                    </div>
                    <div style={{ fontSize: '14px', color: '#92400e' }}>out of 10</div>
                  </div>
                )}

                {/* Approval Status */}
                {selectedReport.university_approved ? (
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <svg width="24" height="24" fill="#15803d" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
                        Report Approved
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#166534' }}>
                        Approved on {new Date(selectedReport.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApproveFinalReport(selectedReport.id)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {loading ? 'Approving...' : 'Approve Final Report'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Report Modal */}
        {showWeeklyReportModal && selectedWeeklyReport && (
          <div style={{
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
          onClick={() => setShowWeeklyReportModal(false)}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px 16px 0 0'
              }}>
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700' }}>
                    Weekly Reports
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                    Student: {selectedWeeklyReport.student_name} ({selectedWeeklyReport.allReports?.length || 0} reports)
                  </p>
                </div>
                <button
                  onClick={() => setShowWeeklyReportModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {/* All Reports Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Week</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Submitted</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWeeklyReport.allReports?.sort((a, b) => b.week_number - a.week_number).map((report) => (
                        <tr key={report.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              Week {report.week_number}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                            {new Date(report.submitted_at).toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {report.university_approved ? (
                              <span style={{
                                padding: '4px 8px',
                                background: '#dcfce7',
                                color: '#15803d',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                ✓ Approved
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                ⏳ Pending
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedWeeklyReport({ ...selectedWeeklyReport, ...report });
                                setWeeklyReportComment(report.university_comment || '');
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {report.university_approved ? 'View' : 'Review'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected Report Details (shown when a report is clicked) */}
                {selectedWeeklyReport.week_number && (
                  <div style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                      Week {selectedWeeklyReport.week_number} Details
                    </h3>
                    
                    {/* Report Content */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Report Content:</h4>
                      <div style={{
                        padding: '12px',
                        background: 'white',
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#4b5563',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedWeeklyReport.report_text || 'No text content'}
                      </div>
                    </div>

                    {/* Report File */}
                    {selectedWeeklyReport.report_file && (
                      <div style={{ marginBottom: '16px' }}>
                        <a
                          href={`http://localhost:5050${selectedWeeklyReport.report_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '6px',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          📎 Download File
                        </a>
                      </div>
                    )}

                    {/* Comment & Approve Section */}
                    {!selectedWeeklyReport.university_approved ? (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Add Comment (Optional):</h4>
                          <textarea
                            value={weeklyReportComment}
                            onChange={(e) => setWeeklyReportComment(e.target.value)}
                            placeholder="Add feedback..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleApproveWeeklyReport(selectedWeeklyReport.id)}
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          {loading ? 'Approving...' : '✓ Approve Week ' + selectedWeeklyReport.week_number}
                        </button>
                      </>
                    ) : (
                      <div style={{
                        padding: '12px',
                        background: '#dcfce7',
                        borderRadius: '8px',
                        color: '#15803d',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ✓ This report has been approved
                        {selectedWeeklyReport.university_comment && (
                          <div style={{ marginTop: '8px', color: '#166534', fontWeight: 'normal' }}>
                            Comment: {selectedWeeklyReport.university_comment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Partnership Modal */}
        {showPartnershipViewModal && selectedPartnership && (
          <div className="modal-overlay" onClick={() => setShowPartnershipViewModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Partnership Details</h2>
                <button className="modal-close" onClick={() => setShowPartnershipViewModal(false)}>×</button>
              </div>
              <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>Company Name:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px' }}>{selectedPartnership.company_name}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>Company Email:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px' }}>{selectedPartnership.company_email}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <strong style={{ color: '#6b7280', fontSize: '13px' }}>Agreement Date:</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '15px' }}>
                        {selectedPartnership.agreement_date ? new Date(selectedPartnership.agreement_date).toLocaleDateString('en-GB') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280', fontSize: '13px' }}>End Date:</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '15px' }}>
                        {selectedPartnership.agreement_end_date ? new Date(selectedPartnership.agreement_end_date).toLocaleDateString('en-GB') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <strong style={{ color: '#6b7280', fontSize: '13px' }}>Duration:</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '15px' }}>
                        {selectedPartnership.agreement_duration ? `${selectedPartnership.agreement_duration} months` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#6b7280', fontSize: '13px' }}>Training Hours:</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '15px' }}>
                        {selectedPartnership.training_hours ? `${selectedPartnership.training_hours} hours` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>Status:</strong>
                    <p style={{ margin: '4px 0 0' }}>
                      <span className={`status-badge status-${selectedPartnership.status}`}>
                        {selectedPartnership.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>University Contact Person:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px' }}>{selectedPartnership.contact_person_university || 'N/A'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>Company Contact Person:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px' }}>{selectedPartnership.contact_person_company || 'N/A'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '13px' }}>Terms and Conditions:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                      {selectedPartnership.terms_and_conditions || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPartnershipViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Partnership Modal */}
        {showPartnershipEditModal && selectedPartnership && (
          <div className="modal-overlay" onClick={() => setShowPartnershipEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h2>Edit Partnership</h2>
                <button className="modal-close" onClick={() => setShowPartnershipEditModal(false)}>×</button>
              </div>
              <form onSubmit={handleSavePartnershipEdit}>
                <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={selectedPartnership.company_name}
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Agreement Date</label>
                      <input
                        type="date"
                        name="agreement_date"
                        value={editPartnershipData.agreement_date}
                        onChange={handleEditPartnershipInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Agreement End Date</label>
                      <input
                        type="date"
                        name="agreement_end_date"
                        value={editPartnershipData.agreement_end_date}
                        onChange={handleEditPartnershipInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration (months)</label>
                      <input
                        type="number"
                        name="agreement_duration"
                        value={editPartnershipData.agreement_duration}
                        onChange={handleEditPartnershipInputChange}
                        placeholder="e.g., 12"
                      />
                    </div>

                    <div className="form-group">
                      <label>Training Hours</label>
                      <input
                        type="number"
                        name="training_hours"
                        value={editPartnershipData.training_hours}
                        onChange={handleEditPartnershipInputChange}
                        placeholder="e.g., 240"
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={editPartnershipData.status}
                        onChange={handleEditPartnershipInputChange}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>University Contact Person</label>
                      <input
                        type="text"
                        name="contact_person_university"
                        value={editPartnershipData.contact_person_university}
                        onChange={handleEditPartnershipInputChange}
                        placeholder="Name of university representative"
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Contact Person</label>
                      <input
                        type="text"
                        name="contact_person_company"
                        value={editPartnershipData.contact_person_company}
                        onChange={handleEditPartnershipInputChange}
                        placeholder="Name of company representative"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Terms and Conditions</label>
                      <textarea
                        name="terms_and_conditions"
                        value={editPartnershipData.terms_and_conditions}
                        onChange={handleEditPartnershipInputChange}
                        rows="4"
                        placeholder="Enter terms and conditions..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowPartnershipEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default UniversityDashboard;
