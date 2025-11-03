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

function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [companyData, setCompanyData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    industry: 'Technology',
    company_size: '1000-5000',
    founded_year: '2010',
    headquarters: 'San Francisco, CA',
    website: 'https://www.techcorp.com',
    linkedin_url: 'https://linkedin.com/company/techcorp',
    address: '123 Tech Street, Suite 400, San Francisco, CA 94105',
    description: 'TechCorp is a leading software development company specializing in cloud computing solutions and enterprise applications.'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [internshipData, setInternshipData] = useState({
    title: '',
    description: '',
    requirements: '',
    specialization: '',
    capacity: 1,
    status: 'open',
    min_gpa: '',
    work_mode: ''
  });
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [companyTrainers, setCompanyTrainers] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [editingInternshipId, setEditingInternshipId] = useState(null);
  const [viewingInternship, setViewingInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState([]);
  const [selectedInternshipFilter, setSelectedInternshipFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchScoreFilter, setMatchScoreFilter] = useState('all');
  const [newApplicantsCount, setNewApplicantsCount] = useState(0);
  const [lastViewedTime, setLastViewedTime] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesChannel, setMessagesChannel] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const messagesEndRef = useRef(null);
  
  // Interviews state
  const [appliedStudents, setAppliedStudents] = useState([]);
  const [selectedInternshipForInterview, setSelectedInternshipForInterview] = useState('');
  const [interviewForm, setInterviewForm] = useState({
    student_id: '',
    internship_id: '',
    interview_date: '',
    interview_time: '',
    interview_location: '',
    interview_type: 'in-person',
    notes: ''
  });
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  
  // Video Call / Meetings state
  const [videoCallRoomID, setVideoCallRoomID] = useState('');
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false);
  const [selectedStudentsForCall, setSelectedStudentsForCall] = useState([]);
  const [applicantsForMeeting, setApplicantsForMeeting] = useState([]);
  
  // Dashboard Statistics State
  const [dashboardStats, setDashboardStats] = useState({
    internshipsCount: 0,
    applicantsCount: 0,
    trainersCount: 0,
    activeStudentsCount: 0
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
    
    // Check if user is a company
    if (parsedUser.user_type !== 'company') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        const response = await fetch(`http://localhost:5050/api/companies/email/${parsedUser.email}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Loaded company data:', data);
          if (data.success && data.company) {
            const companyInfo = {
              id: data.company.id,
              name: data.company.name || parsedUser.full_name,
              email: data.company.email || parsedUser.email,
              phone: data.company.phone || '',
              industry: data.company.industry || 'Technology',
              company_size: data.company.company_size || '1000-5000',
              founded_year: data.company.founded_year || '2010',
              headquarters: data.company.headquarters || 'San Francisco, CA',
              website: data.company.website || 'https://www.techcorp.com',
              linkedin_url: data.company.linkedin_url || 'https://linkedin.com/company/techcorp',
              address: data.company.address || '123 Tech Street, Suite 400, San Francisco, CA 94105',
              description: data.company.description || 'TechCorp is a leading software development company.',
              logo: data.company.logo || ''
            };
            setCompanyData(companyInfo);
            
            // Load dashboard stats after company data is loaded
            loadDashboardStatsForCompany(data.company.id, parsedUser.email);
          } else {
            // Company not found in database, use user data
            console.log('⚠️ Company not found, using default values');
            setCompanyData(prev => ({
              ...prev,
              name: parsedUser.full_name,
              email: parsedUser.email
            }));
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        // Initialize with default values
        setCompanyData(prev => ({
          ...prev,
          name: parsedUser.full_name,
          email: parsedUser.email
        }));
      }
    };
    
    loadCompanyData();
    loadCompanyTrainers();
    loadNewApplicantsCount(parsedUser);
    loadInternships(parsedUser.email);
  }, [navigate]);

  // Load new applicants count on login
  const loadNewApplicantsCount = async (userData) => {
    if (!userData) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/companies/email/${userData.email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.company) {
          const companyId = data.company.id;
          
          // Get applicants
          const applicantsResponse = await fetch(`http://localhost:5050/api/matching/company/${companyId}/applicants`);
          if (applicantsResponse.ok) {
            const applicantsData = await applicantsResponse.json();
            if (applicantsData.success && applicantsData.data) {
              const storedTime = localStorage.getItem(`company_${companyId}_lastViewedApplicants`);
              if (storedTime) {
                const lastViewed = new Date(storedTime);
                const newCount = applicantsData.data.filter(app => {
                  const appliedDate = new Date(app.applied_at);
                  return appliedDate > lastViewed;
                }).length;
                setNewApplicantsCount(newCount);
                console.log(`🔔 ${newCount} new applicants since last view`);
              } else {
                setNewApplicantsCount(applicantsData.data.length);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading new applicants count:', error);
    }
  };

  const loadCompanyTrainers = async () => {
    try {
      // First get company data to get company_id
      const companyResponse = await fetch(`http://localhost:5050/api/companies/email/${user?.email || JSON.parse(localStorage.getItem('user')).email}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.success && companyData.company) {
          // Now get trainers for this company
          const trainersResponse = await fetch(`http://localhost:5050/api/trainers/company/${companyData.company.id}`);
          if (trainersResponse.ok) {
            const trainersData = await trainersResponse.json();
            if (trainersData.success) {
              setCompanyTrainers(trainersData.trainers || []);
              console.log('📥 Loaded company trainers:', trainersData.trainers);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading company trainers:', error);
    }
  };

  // Load conversations when company trainers are loaded
  useEffect(() => {
    if (companyTrainers.length > 0 && user) {
      loadConversations();
    }
  }, [companyTrainers, user]);

  // Setup real-time message subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time messages
    const channel = subscribeToMessages(user.id, (newMessage) => {
      // Only add message if it's for the current conversation AND from the other person
      if (selectedTrainer && 
          newMessage.sender_id === selectedTrainer.user_id && 
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
  }, [user, selectedTrainer]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Upload file to server
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
          // Save the logo path
          setCompanyData(prev => ({
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
      const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // If email was changed, update localStorage and user state
        if (data.newEmail && data.newEmail !== user.email) {
          const updatedUser = {
            ...user,
            email: data.newEmail,
            full_name: companyData.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('✅ Email updated in localStorage:', data.newEmail);
        } else if (companyData.name !== user.full_name) {
          // If only name was changed
          const updatedUser = {
            ...user,
            full_name: companyData.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('✅ Name updated in localStorage');
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

  const handleInternshipInputChange = (e) => {
    const { name, value } = e.target;
    setInternshipData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrainerSelection = (trainerId) => {
    setSelectedTrainers(prev => {
      if (prev.includes(trainerId)) {
        return prev.filter(id => id !== trainerId);
      } else {
        return [...prev, trainerId];
      }
    });
  };

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingInternshipId 
        ? `http://localhost:5050/api/internships/${editingInternshipId}`
        : 'http://localhost:5050/api/internships';
      
      const method = editingInternshipId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_email: user.email,
          ...internshipData,
          trainer_ids: selectedTrainers
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingInternshipId ? 'Internship updated successfully!' : 'Internship posted successfully!' 
        });
        // Reset form
        setInternshipData({
          title: '',
          description: '',
          requirements: '',
          specialization: '',
          capacity: 1,
          status: 'open'
        });
        setSelectedTrainers([]);
        setEditingInternshipId(null);
        // Reload internships
        loadInternships(user.email);
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || `Failed to ${editingInternshipId ? 'update' : 'post'} internship` });
      }
    } catch (error) {
      console.error('Post/Update internship error:', error);
      setMessage({ type: 'error', text: `Failed to ${editingInternshipId ? 'update' : 'post'} internship` });
    } finally {
      setLoading(false);
    }
  };

  const loadInternships = async (email) => {
    if (!email) return;
    
    try {
      const response = await fetch(`http://localhost:5050/api/internships/by-company/${email}`);
      const data = await response.json();

      if (response.ok) {
        setInternships(data.internships || []);
        console.log('✅ Loaded internships:', data.internships?.length || 0);
      }
    } catch (error) {
      console.error('Load internships error:', error);
    }
  };

  const loadDashboardStatsForCompany = async (companyId, companyEmail) => {
    if (!companyId) return;

    try {
      console.log('📊 Loading dashboard stats for company:', companyId);
      
      // Load all stats from single endpoint
      const response = await fetch(`http://localhost:5050/api/companies/${companyId}/stats`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Stats loaded:', data.data);
        setDashboardStats({
          internshipsCount: data.data.internshipsCount || 0,
          applicantsCount: data.data.applicantsCount || 0,
          trainersCount: data.data.trainersCount || 0,
          activeStudentsCount: data.data.activeStudentsCount || 0
        });
      } else {
        console.error('❌ Failed to load stats:', data.message);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
    }
  };

  const handleViewInternship = (internship) => {
    setViewingInternship(internship);
  };

  const handleCloseViewModal = () => {
    setViewingInternship(null);
  };

  const handleEditInternship = async (internship) => {
    // Load internship data into form
    setInternshipData({
      title: internship.title,
      description: internship.description || '',
      requirements: internship.requirements || '',
      specialization: internship.specialization || '',
      capacity: internship.capacity,
      status: internship.status
    });
    
    // Load assigned trainers
    if (internship.trainers && internship.trainers.length > 0) {
      setSelectedTrainers(internship.trainers.map(t => t.id));
    } else {
      setSelectedTrainers([]);
    }
    
    setEditingInternshipId(internship.id);
    setActiveMenu('post');
  };

  const handleDeleteInternship = async (id) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5050/api/internships/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Internship deleted successfully!' });
        loadInternships(user.email);
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete internship' });
    }
  };

  // Load applicants
  const loadApplicants = async () => {
    if (!user) {
      console.log('⚠️ No user found');
      return;
    }
    
    try {
      console.log('🔍 Loading company data for:', user.email);
      const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Company data:', data);
        
        if (data.success && data.company) {
          const companyId = data.company.id;
          console.log('🏢 Company ID:', companyId);
          
          console.log('📋 Fetching applicants for company:', companyId);
          const applicantsResponse = await fetch(`http://localhost:5050/api/matching/company/${companyId}/applicants`);
          
          if (applicantsResponse.ok) {
            const applicantsData = await applicantsResponse.json();
            console.log('✅ Applicants data:', applicantsData);
            
            if (applicantsData.success) {
              console.log(`📋 Loaded ${applicantsData.data.length} applicants`);
              setApplicants(applicantsData.data);
              
              // Calculate new applicants count
              const storedTime = localStorage.getItem(`company_${companyId}_lastViewedApplicants`);
              if (storedTime) {
                const lastViewed = new Date(storedTime);
                const newCount = applicantsData.data.filter(app => {
                  const appliedDate = new Date(app.applied_at);
                  return appliedDate > lastViewed;
                }).length;
                setNewApplicantsCount(newCount);
                console.log(`🆕 ${newCount} new applicants since last view`);
              } else {
                // First time viewing, all are new
                setNewApplicantsCount(applicantsData.data.length);
              }
            } else {
              console.log('⚠️ No applicants found');
              setApplicants([]);
              setNewApplicantsCount(0);
            }
          } else {
            console.error('❌ Failed to fetch applicants:', applicantsResponse.status);
          }
        } else {
          console.error('❌ Company not found in response');
        }
      } else {
        console.error('❌ Failed to fetch company:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading applicants:', error);
    }
  };

  // Load internships when switching to manage tab
  useEffect(() => {
    if (activeMenu === 'manage' && user) {
      loadInternships(user.email);
    }
  }, [activeMenu, user]);

  // Handle accept applicant
  const handleAcceptApplicant = async (matchId, studentId) => {
    try {
      console.log(`✅ Accepting applicant ${matchId}...`);
      
      const response = await fetch(`http://localhost:5050/api/matching/applicant/${matchId}/accept`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Applicant accepted successfully!\n📉 Internship capacity decreased by 1');
        // Reload applicants and internships to update capacity
        loadApplicants();
        loadInternships(user.email);
      } else {
        alert(`❌ ${data.message || 'Failed to accept applicant'}`);
      }
    } catch (error) {
      console.error('Error accepting applicant:', error);
      alert('❌ An error occurred while accepting applicant');
    }
  };

  // Handle reject applicant
  const handleRejectApplicant = async (matchId, studentId) => {
    if (!window.confirm('Are you sure you want to reject this applicant?')) {
      return;
    }
    
    try {
      console.log(`❌ Rejecting applicant ${matchId}...`);
      
      const response = await fetch(`http://localhost:5050/api/matching/applicant/${matchId}/reject`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('❌ Applicant rejected');
        // Reload applicants
        loadApplicants();
      } else {
        alert('❌ Failed to reject applicant');
      }
    } catch (error) {
      console.error('Error rejecting applicant:', error);
      alert('❌ An error occurred while rejecting applicant');
    }
  };

  // Load accepted applicants
  const loadAcceptedApplicants = async () => {
    if (!user) {
      console.log('⚠️ No user found');
      return;
    }
    
    try {
      console.log('🔍 Loading accepted applicants for:', user.email);
      const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Company data:', data);
        
        if (data.success && data.company) {
          const companyId = data.company.id;
          console.log('🏢 Company ID:', companyId);
          
          console.log('✅ Fetching accepted applicants for company:', companyId);
          const acceptedResponse = await fetch(`http://localhost:5050/api/matching/company/${companyId}/accepted`);
          
          if (acceptedResponse.ok) {
            const acceptedData = await acceptedResponse.json();
            console.log('✅ Accepted applicants data:', acceptedData);
            
            if (acceptedData.success) {
              console.log(`✅ Loaded ${acceptedData.data.length} accepted applicants`);
              setAcceptedApplicants(acceptedData.data);
            } else {
              console.log('⚠️ No accepted applicants found');
              setAcceptedApplicants([]);
            }
          } else {
            console.error('❌ Failed to fetch accepted applicants:', acceptedResponse.status);
          }
        } else {
          console.error('❌ Company not found in response');
        }
      } else {
        console.error('❌ Failed to fetch company:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading accepted applicants:', error);
    }
  };

  // Handle certificate upload
  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Certificate file size should be less than 10MB' });
      return;
    }

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      setUploadingCertificate(true);
      const response = await fetch('http://localhost:5050/api/upload/certificate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCertificateFile(data.certificatePath);
        setMessage({ type: 'success', text: 'Certificate uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload certificate' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload certificate' });
    } finally {
      setUploadingCertificate(false);
    }
  };

  // Load trainers as conversations for chat
  const loadConversations = async () => {
    if (!companyTrainers || companyTrainers.length === 0) return;
    try {
      const trainersWithUnread = await Promise.all(
        companyTrainers.map(async (trainer) => {
          const unreadCount = await getUnreadCount(user.id, trainer.user_id);
          return {
            ...trainer,
            unread_count: unreadCount
          };
        })
      );
      setConversations(trainersWithUnread);
      
      // Calculate total unread messages
      const totalUnread = trainersWithUnread.reduce((sum, trainer) => sum + (trainer.unread_count || 0), 0);
      setTotalUnreadMessages(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for selected trainer
  const loadMessages = async (trainer) => {
    if (!user || !trainer) return;
    
    console.log('📨 Loading messages for trainer:', {
      trainer_name: trainer.full_name,
      trainer_user_id: trainer.user_id,
      company_user_id: user.id
    });
    
    try {
      const chatMessages = await loadChatMessages(user.id, trainer.user_id);
      console.log('✅ Loaded messages:', chatMessages.length, 'messages');
      setMessages(chatMessages);
      setSelectedTrainer(trainer);
      setSelectedConversation(trainer.id);
      
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
    if (!newMessage.trim() || !selectedTrainer || !user) return;

    const messageText = newMessage.trim();
    
    console.log('📤 Sending message:', {
      sender_id: user.id,
      receiver_id: selectedTrainer.user_id,
      message: messageText
    });
    
    try {
      // Clear input immediately for better UX
      setNewMessage('');
      
      const result = await sendChatMessage(user.id, selectedTrainer.user_id, messageText);
      
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

  // Load applied students for interviews
  const loadAppliedStudents = async (internshipId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/matching/internship/${internshipId}/applied`);
      const data = await response.json();
      if (data.success) {
        setAppliedStudents(data.applicants || []);
      }
    } catch (error) {
      console.error('Error loading applied students:', error);
    }
  };

  // Schedule interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    
    if (!interviewForm.student_id || !interviewForm.internship_id || !interviewForm.interview_date || !interviewForm.interview_time) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      setSchedulingInterview(true);
      const response = await fetch('http://localhost:5050/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interviewForm,
          company_id: companyData.id
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Interview scheduled successfully! Student has been notified.' });
        // Reset form
        setInterviewForm({
          student_id: '',
          internship_id: '',
          interview_date: '',
          interview_time: '',
          interview_location: '',
          interview_type: 'in-person',
          notes: ''
        });
        setSelectedInternshipForInterview('');
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to schedule interview' });
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setMessage({ type: 'error', text: 'Server error' });
    } finally {
      setSchedulingInterview(false);
    }
  };

  // Video Call / Meetings Functions
  const handleStartMeeting = async () => {
    // Generate unique room ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const roomID = `tracko-company-${companyData.id}-${timestamp}-${randomStr}`;
    
    console.log('📞 Preparing meeting...');
    console.log('   Room ID:', roomID);
    
    try {
      // Get company ID
      const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`);
      if (!response.ok) {
        alert('Failed to load company data');
        return;
      }
      
      const data = await response.json();
      if (!data.success || !data.company) {
        alert('Company not found');
        return;
      }
      
      const companyId = data.company.id;
      
      // Load all applicants for this company
      const applicantsResponse = await fetch(`http://localhost:5050/api/matching/company/${companyId}/applicants`);
      if (!applicantsResponse.ok) {
        alert('Failed to load applicants');
        return;
      }
      
      const applicantsData = await applicantsResponse.json();
      console.log('📊 Loaded applicants:', applicantsData);
      
      // API returns data in 'data' field, not 'applicants'
      const allApplicants = applicantsData.data || applicantsData.applicants || [];
      
      if (applicantsData.success && allApplicants.length > 0) {
        // Get all applied students (applied = 1 or true)
        const appliedStudents = allApplicants.filter(app => {
          console.log(`Student ${app.full_name}: applied = ${app.applied} (type: ${typeof app.applied})`);
          return app.applied === 1 || app.applied === true || app.applied === '1';
        });
        
        console.log('✅ Applied students:', appliedStudents.length, 'out of', allApplicants.length);
        
        if (appliedStudents.length === 0) {
          alert('No students have applied yet. Students need to click "Apply" on the internship first.');
          return;
        }
        
        setApplicantsForMeeting(appliedStudents);
        
        // Store room ID and show student selection modal
        setVideoCallRoomID(roomID);
        setShowStudentSelectionModal(true);
        setSelectedStudentsForCall([]);
      } else {
        alert('No applicants found for your company');
      }
    } catch (error) {
      console.error('Error loading applicants:', error);
      alert('Failed to load applicants');
    }
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

  const handleConfirmMeeting = async () => {
    if (selectedStudentsForCall.length === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      console.log('📤 Sending meeting notifications...');
      
      // Send notifications to selected students
      const response = await fetch('http://localhost:5050/api/video-call/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomID: videoCallRoomID,
          studentIds: selectedStudentsForCall,
          senderName: companyData.name,
          senderType: 'company'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Notifications sent successfully');
        console.log('🔗 Room ID:', videoCallRoomID);
        
        // Close modal
        setShowStudentSelectionModal(false);
        
        // Open video call in new window
        const videoCallUrl = `http://localhost:3000/video-call/${videoCallRoomID}`;
        console.log('🚀 Opening video call:', videoCallUrl);
        
        const newWindow = window.open(videoCallUrl, '_blank', 'width=1200,height=800');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup blocked
          alert(`Meeting started! Notifications sent to ${selectedStudentsForCall.length} student(s).\n\nPlease allow popups and click this link to join:\n${videoCallUrl}`);
          // Try to open in same tab as fallback
          window.location.href = videoCallUrl;
        } else {
          alert(`Meeting started! Notifications sent to ${selectedStudentsForCall.length} student(s)`);
        }
      } else {
        alert('Failed to send notifications: ' + data.message);
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Failed to start meeting');
    }
  };

  // Submit certificate to final report
  const handleSubmitCertificate = async () => {
    if (!certificateFile) {
      setMessage({ type: 'error', text: 'Please upload a certificate first' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/final-reports/${selectedReport.id}/certificate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificate_file: certificateFile
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Certificate uploaded successfully! Student has been notified.' });
        setShowReportModal(false);
        setCertificateFile(null);
        loadAcceptedApplicants(); // Reload to get updated data
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit certificate' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: 'Failed to submit certificate' });
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on Applicants List - mark as viewed
  const handleApplicantsMenuClick = async () => {
    setActiveMenu('applicants');
    
    // Get company ID and save current time as last viewed
    if (user) {
      try {
        const response = await fetch(`http://localhost:5050/api/companies/email/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.company) {
            const companyId = data.company.id;
            localStorage.setItem(`company_${companyId}_lastViewedApplicants`, new Date().toISOString());
            setNewApplicantsCount(0); // Reset counter
            console.log('✅ Marked applicants as viewed');
          }
        }
      } catch (error) {
        console.error('Error updating last viewed time:', error);
      }
    }
  };

  // Load applicants when switching to applicants tab
  useEffect(() => {
    if (activeMenu === 'applicants' && user) {
      loadInternships(user.email); // Load internships first for the filter
      loadApplicants();
    }
  }, [activeMenu, user]);

  // Load accepted applicants when switching to details tab
  useEffect(() => {
    if (activeMenu === 'details' && user) {
      loadInternships(user.email); // Load internships for the filter
      loadAcceptedApplicants();
    }
  }, [activeMenu, user]);

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || internship.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="company-dashboard">
      {/* Sidebar */}
      <aside className="company-sidebar">
        {/* Company Profile Section */}
        <div className="company-profile-section">
          <div className="company-avatar">
            {companyData.logo ? (
              <img 
                src={`http://localhost:5050${companyData.logo}`} 
                alt="Company Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <div className="company-info">
            <h3>{user.full_name}</h3>
            <p>Software Company</p>
            <div className="company-badge">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="company-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('dashboard');
              if (companyData.id && user) {
                loadDashboardStatsForCompany(companyData.id, user.email);
              }
            }}
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
            className={`nav-item ${activeMenu === 'post' ? 'active' : ''}`}
            onClick={() => setActiveMenu('post')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Internship
          </button>

          <button 
            className={`nav-item ${activeMenu === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveMenu('manage')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Manage Internships
          </button>

          <button 
            className={`nav-item ${activeMenu === 'applicants' ? 'active' : ''}`}
            onClick={handleApplicantsMenuClick}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Applicants List
            {newApplicantsCount > 0 && (
              <span className="notification-badge">
                {newApplicantsCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'details' ? 'active' : ''}`}
            onClick={() => setActiveMenu('details')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Accepted Students
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
            onClick={() => { setActiveMenu('messages'); loadConversations(); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages/Chat
            {totalUnreadMessages > 0 && (
              <span className="notification-badge">{totalUnreadMessages}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'interviews' ? 'active' : ''}`}
            onClick={() => setActiveMenu('interviews')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Interviews
          </button>

          <button 
            className={`nav-item ${activeMenu === 'meetings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('meetings')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Meetings
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
              <h2>Company Overview</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Company:</strong> {companyData.name || user.full_name}</p>
              
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
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
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
                      Total internship opportunities
                    </p>
                  </div>
                  
                  <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                    borderRadius: '16px',
                    border: '1px solid #bbf7d0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
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
                      <h4 style={{ margin: 0, color: '#15803d', fontSize: '16px', fontWeight: '600' }}>Applicants</h4>
                    </div>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>
                      {dashboardStats.applicantsCount}
                    </p>
                    <p style={{ fontSize: '13px', color: '#15803d', margin: '8px 0 0 0' }}>
                      Total applicants
                    </p>
                  </div>
                  
                  <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                    borderRadius: '16px',
                    border: '1px solid #fde68a',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
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
                          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 style={{ margin: 0, color: '#92400e', fontSize: '16px', fontWeight: '600' }}>Trainers</h4>
                    </div>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#78350f' }}>
                      {dashboardStats.trainersCount}
                    </p>
                    <p style={{ fontSize: '13px', color: '#92400e', margin: '8px 0 0 0' }}>
                      Available trainers
                    </p>
                  </div>
                  
                  <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
                    borderRadius: '16px',
                    border: '1px solid #fbcfe8',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
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
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                      </div>
                      <h4 style={{ margin: 0, color: '#9f1239', fontSize: '16px', fontWeight: '600' }}>Active Students</h4>
                    </div>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#881337' }}>
                      {dashboardStats.activeStudentsCount}
                    </p>
                    <p style={{ fontSize: '13px', color: '#9f1239', margin: '8px 0 0 0' }}>
                      Students in training
                    </p>
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
                  {companyData.logo ? (
                    <img 
                      src={`http://localhost:5050${companyData.logo}`} 
                      alt="Company Logo" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="profile-header-info">
                  <h2>{user.full_name}</h2>
                  <p>Software Development Company</p>
                  <div className="profile-badges">
                    <span className="verified-badge">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Company
                    </span>
                    <span className="rating-badge">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      4.8 ⭐ (127 reviews)
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
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Logo
              </button>
            </div>

            {/* Company Information Forms */}
            <div className="profile-forms-container">
              <div className="profile-form-card">
                <h3>Company Information</h3>
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={companyData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select 
                    name="industry"
                    value={companyData.industry}
                    onChange={handleInputChange}
                  >
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>Education</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Company Size</label>
                  <select 
                    name="company_size"
                    value={companyData.company_size}
                    onChange={handleInputChange}
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>501-1000 employees</option>
                    <option>1000-5000 employees</option>
                    <option>5000+ employees</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Founded Year</label>
                  <input 
                    type="number" 
                    name="founded_year"
                    value={companyData.founded_year} 
                    onChange={handleInputChange}
                    placeholder="2010" 
                  />
                </div>
                <div className="form-group">
                  <label>Headquarters</label>
                  <input 
                    type="text" 
                    name="headquarters"
                    value={companyData.headquarters} 
                    onChange={handleInputChange}
                    placeholder="City, State/Country" 
                  />
                </div>
              </div>

              <div className="profile-form-card">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>Company Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={companyData.email} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={companyData.phone} 
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567" 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <div className="input-with-button">
                    <input 
                      type="url" 
                      name="website"
                      value={companyData.website} 
                      onChange={handleInputChange}
                      placeholder="https://" 
                    />
                    <button className="preview-btn">Preview</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={companyData.linkedin_url} 
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/company/" 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={companyData.address} 
                    onChange={handleInputChange}
                    placeholder="Full address" 
                  />
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="profile-form-card full-width">
              <h3>Company Description</h3>
              <div className="form-group">
                <label>About Company</label>
                <textarea 
                  rows="6" 
                  name="description"
                  value={companyData.description}
                  onChange={handleInputChange}
                  placeholder="Write a detailed description about your company..."
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

        {activeMenu === 'post' && (
          <>
            <div className="dashboard-header">
              <h1>{editingInternshipId ? 'Edit Internship' : 'Post New Internship'}</h1>
              <p>{editingInternshipId ? 'Update internship details' : 'Create a new internship opportunity for students'}</p>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePostInternship} className="internship-form">
              <div className="profile-form-card">
                <h3>Internship Details</h3>
                
                <div className="form-group">
                  <label>Internship Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={internshipData.title} 
                    onChange={handleInternshipInputChange}
                    placeholder="e.g., Software Development Intern"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Specialization</label>
                  <select 
                    name="specialization"
                    value={internshipData.specialization} 
                    onChange={handleInternshipInputChange}
                  >
                    <option value="">Select Specialization</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="AI/Machine Learning">AI/Machine Learning</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input 
                      type="number" 
                      name="capacity"
                      value={internshipData.capacity} 
                      onChange={handleInternshipInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      name="status"
                      value={internshipData.status} 
                      onChange={handleInternshipInputChange}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum GPA</label>
                    <input 
                      type="number" 
                      name="min_gpa"
                      value={internshipData.min_gpa} 
                      onChange={handleInternshipInputChange}
                      min="0"
                      max="4"
                      step="0.01"
                      placeholder="e.g., 3.0"
                    />
                    <small style={{color: '#6b7280', fontSize: '12px'}}>Leave empty if no GPA requirement</small>
                  </div>

                  <div className="form-group">
                    <label>Work Mode</label>
                    <select 
                      name="work_mode"
                      value={internshipData.work_mode} 
                      onChange={handleInternshipInputChange}
                    >
                      <option value="">Not Specified</option>
                      <option value="onsite">Onsite</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    rows="6" 
                    name="description"
                    value={internshipData.description}
                    onChange={handleInternshipInputChange}
                    placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Requirements</label>
                  <textarea 
                    rows="4" 
                    name="requirements"
                    value={internshipData.requirements}
                    onChange={handleInternshipInputChange}
                    placeholder="List the required skills, qualifications, and experience..."
                  />
                </div>

                {/* Trainer Selection */}
                <div className="form-group">
                  <label>Assign Trainers (Optional)</label>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Select one or more trainers from your company to supervise this internship
                  </p>
                  {companyTrainers.length > 0 ? (
                    <div className="trainers-selection">
                      {companyTrainers.map(trainer => (
                        <div key={trainer.id} className="trainer-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedTrainers.includes(trainer.id)}
                              onChange={() => handleTrainerSelection(trainer.id)}
                            />
                            <span className="trainer-info">
                              <strong>{trainer.full_name}</strong>
                              {trainer.specialization && (
                                <span className="trainer-spec"> - {trainer.specialization}</span>
                              )}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-trainers-message">
                      <p>No trainers available in your company yet.</p>
                    </div>
                  )}
                  {selectedTrainers.length > 0 && (
                    <div className="selected-count">
                      {selectedTrainers.length} trainer(s) selected
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="btn-secondary" 
                    onClick={() => {
                      setActiveMenu('manage');
                      setEditingInternshipId(null);
                      setInternshipData({
                        title: '',
                        description: '',
                        requirements: '',
                        specialization: '',
                        capacity: 1,
                        status: 'open'
                      });
                      setSelectedTrainers([]);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? (editingInternshipId ? 'Updating...' : 'Posting...') : (editingInternshipId ? 'Update Internship' : 'Post Internship')}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {activeMenu === 'manage' && (
          <>
            <div className="manage-header">
              <div>
                <h1>Manage Internships</h1>
                <p>View and manage all your internship posts</p>
              </div>
              <button 
                className="btn-post-new"
                onClick={() => setActiveMenu('post')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Internship
              </button>
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Search and Filters */}
            <div className="manage-filters">
              <div className="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Search internships..."
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
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Internships Table */}
            <div className="internships-table-container">
              <div className="table-header-section">
                <h3>Your Internship Posts</h3>
                <span className="posts-count">{filteredInternships.length} posts</span>
              </div>

              {filteredInternships.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No internships found</h3>
                  <p>Start by posting your first internship opportunity</p>
                  <button className="btn-primary" onClick={() => setActiveMenu('post')}>
                    Post New Internship
                  </button>
                </div>
              ) : (
                <div className="internships-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Specialization</th>
                        <th>Capacity</th>
                        <th>Trainers</th>
                        <th>Status</th>
                        <th>Posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInternships.map((internship) => (
                        <tr key={internship.id}>
                          <td>
                            <div className="position-cell">
                              <strong>{internship.title}</strong>
                              <span className="position-id">ID: {internship.id}</span>
                            </div>
                          </td>
                          <td>{internship.specialization || 'N/A'}</td>
                          <td>{internship.capacity}</td>
                          <td>
                            <div className="trainers-cell">
                              {internship.trainers && internship.trainers.length > 0 ? (
                                <div className="trainers-list">
                                  {internship.trainers.map((trainer, index) => (
                                    <span key={index} className="trainer-badge" title={trainer.full_name}>
                                      {trainer.full_name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-trainers">No trainers assigned</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge status-${internship.status}`}>
                              {internship.status}
                            </span>
                          </td>
                          <td>
                            <div className="date-cell">
                              {new Date(internship.created_at).toLocaleDateString('en-GB')}
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button 
                                className="action-btn view-btn" 
                                title="View"
                                onClick={() => handleViewInternship(internship)}
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                className="action-btn edit-btn" 
                                title="Edit"
                                onClick={() => handleEditInternship(internship)}
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                title="Delete"
                                onClick={() => handleDeleteInternship(internship.id)}
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

            {/* View Internship Modal */}
            {viewingInternship && (
              <div className="modal-overlay" onClick={handleCloseViewModal}>
                <div className="modal-content view-internship-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Internship Details</h2>
                    <button className="modal-close-btn" onClick={handleCloseViewModal}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="internship-detail-section">
                      <div className="detail-header">
                        <h3>{viewingInternship.title}</h3>
                        <span className={`status-badge status-${viewingInternship.status}`}>
                          {viewingInternship.status}
                        </span>
                      </div>
                      <p className="internship-id">ID: {viewingInternship.id}</p>
                    </div>

                    <div className="internship-detail-grid">
                      <div className="detail-item">
                        <label>Specialization</label>
                        <p>{viewingInternship.specialization || 'Not specified'}</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Capacity</label>
                        <p>{viewingInternship.capacity} position(s)</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Posted Date</label>
                        <p>{new Date(viewingInternship.created_at).toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Last Updated</label>
                        <p>{new Date(viewingInternship.updated_at).toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                    </div>

                    <div className="detail-item full-width">
                      <label>Description</label>
                      <div className="detail-text-content">
                        {viewingInternship.description || 'No description provided'}
                      </div>
                    </div>

                    <div className="detail-item full-width">
                      <label>Requirements</label>
                      <div className="detail-text-content">
                        {viewingInternship.requirements || 'No requirements specified'}
                      </div>
                    </div>

                    <div className="detail-item full-width">
                      <label>Assigned Trainers</label>
                      {viewingInternship.trainers && viewingInternship.trainers.length > 0 ? (
                        <div className="trainers-list-view">
                          {viewingInternship.trainers.map((trainer, index) => (
                            <div key={index} className="trainer-card">
                              <div className="trainer-avatar">
                                {trainer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div className="trainer-info">
                                <strong>{trainer.full_name}</strong>
                                {trainer.specialization && (
                                  <span className="trainer-spec">{trainer.specialization}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">No trainers assigned</p>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-secondary" 
                      onClick={handleCloseViewModal}
                    >
                      Close
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        handleCloseViewModal();
                        handleEditInternship(viewingInternship);
                      }}
                    >
                      Edit Internship
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Applicants List Section */}
        {activeMenu === 'applicants' && (
          <>
            <div className="dashboard-header">
              <h1>Internship Applicants</h1>
              <div className="header-actions">
                <button className="btn-secondary">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Export
                </button>
                <button className="btn-secondary">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                  </svg>
                  Filters
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="applicants-filters">
              <select 
                value={selectedInternshipFilter} 
                onChange={(e) => setSelectedInternshipFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Select internship position</option>
                {internships.map(internship => (
                  <option key={internship.id} value={internship.id}>
                    {internship.title}
                  </option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
              </select>

              <select 
                value={matchScoreFilter} 
                onChange={(e) => setMatchScoreFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Match Score</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
            </div>

            {/* Applicants Grid */}
            {applicants.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3>No Applicants Yet</h3>
                <p>When students apply to your internships, they will appear here.</p>
              </div>
            ) : (
              <div className="applicants-grid">
                {applicants
                  .filter(applicant => {
                    const matchesInternship = selectedInternshipFilter === 'all' || applicant.internship_id == selectedInternshipFilter;
                    const matchesScore = matchScoreFilter === 'all' || 
                      (matchScoreFilter === 'high' && applicant.match_percentage >= 80) ||
                      (matchScoreFilter === 'medium' && applicant.match_percentage >= 60 && applicant.match_percentage < 80) ||
                      (matchScoreFilter === 'low' && applicant.match_percentage < 60);
                    return matchesInternship && matchesScore;
                  })
                  .map((applicant, index) => (
                  <div key={applicant.id || index} className="applicant-card">
                    <div className="applicant-header">
                      <div className="applicant-avatar">
                        {applicant.student_img ? (
                          <img 
                            src={`http://localhost:5050${applicant.student_img}`} 
                            alt={applicant.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          applicant.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST'
                        )}
                      </div>
                      <div className="applicant-info">
                        <h3>{applicant.full_name || 'Student Name'}</h3>
                        <p className="university-name">{applicant.university_name || 'University'}</p>
                        <p className="major-year">{applicant.major || 'Major'} • {applicant.year_of_study || 'Year'}</p>
                      </div>
                      <div className={`match-badge ${
                        applicant.match_percentage >= 90 ? 'match-high' : 
                        applicant.match_percentage >= 75 ? 'match-good' : 
                        applicant.match_percentage >= 60 ? 'match-medium' : 'match-low'
                      }`}>
                        {applicant.match_percentage}% match
                      </div>
                    </div>

                    <div className="applicant-details">
                      <div className="detail-row">
                        <span className="detail-label">GPA:</span>
                        <span className="detail-value">{applicant.gpa || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Applied:</span>
                        <span className="detail-value">
                          {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Position:</span>
                        <span className="detail-value">{applicant.internship_title || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`status-badge status-new`}>New</span>
                      </div>
                    </div>

                    {applicant.matched_skills && applicant.matched_skills.length > 0 && (
                      <div className="applicant-skills">
                        <span className="skills-label">Top Skills:</span>
                        <div className="skills-tags">
                          {applicant.matched_skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                          {applicant.matched_skills.length > 4 && (
                            <span className="skill-tag">+{applicant.matched_skills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="applicant-actions">
                      <button 
                        className="btn-accept"
                        onClick={() => handleAcceptApplicant(applicant.id, applicant.student_id)}
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Accept
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleRejectApplicant(applicant.id, applicant.student_id)}
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Accepted Students Section */}
        {activeMenu === 'details' && (
          <>
            <div className="dashboard-header">
              <h1>Accepted Students</h1>
              <p>Students who have been accepted for your internships</p>
            </div>

            {/* Internship Filter Dropdown */}
            <div className="internship-filter-section">
              <label htmlFor="internship-filter" className="filter-label">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                </svg>
                Filter by Internship:
              </label>
              <select 
                id="internship-filter"
                value={selectedInternshipFilter}
                onChange={(e) => setSelectedInternshipFilter(e.target.value)}
                className="internship-filter-select"
              >
                <option value="all">All Internships ({acceptedApplicants.length})</option>
                {internships.map(internship => {
                  const count = acceptedApplicants.filter(a => a.internship_id === internship.id).length;
                  return count > 0 ? (
                    <option key={internship.id} value={internship.id}>
                      {internship.title} ({count})
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            {acceptedApplicants.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>No Accepted Applicants Yet</h3>
                <p>Accepted applicants will appear here</p>
              </div>
            ) : (
              <>
                {acceptedApplicants
                  .filter(applicant => 
                    selectedInternshipFilter === 'all' || 
                    applicant.internship_id === parseInt(selectedInternshipFilter)
                  ).length === 0 ? (
                  <div className="empty-state">
                    <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3>No Applicants for This Internship</h3>
                    <p>Try selecting a different internship</p>
                  </div>
                ) : (
                  <div className="applicants-grid">
                    {acceptedApplicants
                      .filter(applicant => 
                        selectedInternshipFilter === 'all' || 
                        applicant.internship_id === parseInt(selectedInternshipFilter)
                      )
                      .map((applicant, index) => (
                  <div key={applicant.id || index} className="applicant-card accepted-card">
                    <div className="accepted-badge">Accepted</div>
                    <div className="applicant-header">
                      <div className="applicant-avatar">
                        {applicant.student_img ? (
                          <img 
                            src={`http://localhost:5050${applicant.student_img}`} 
                            alt={applicant.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          applicant.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST'
                        )}
                      </div>
                      <div className="applicant-info">
                        <h3>{applicant.full_name || 'Student Name'}</h3>
                        <p className="university-name">{applicant.university_name || 'University'}</p>
                        <p className="major-year">{applicant.major || 'Major'} • {applicant.year_of_study || 'Year'}</p>
                      </div>
                      <div className={`match-badge ${
                        applicant.match_percentage >= 90 ? 'match-high' : 
                        applicant.match_percentage >= 75 ? 'match-good' : 
                        applicant.match_percentage >= 60 ? 'match-medium' : 'match-low'
                      }`}>
                        {applicant.match_percentage}% match
                      </div>
                    </div>

                    <div className="applicant-details">
                      <div className="detail-row">
                        <span className="detail-label">GPA</span>
                        <span className="detail-value">{applicant.gpa || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Accepted Date</span>
                        <span className="detail-value">
                          {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Position</span>
                        <span className="detail-value">{applicant.internship_title || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{applicant.email || 'N/A'}</span>
                      </div>
                    </div>

                    {applicant.matched_skills && applicant.matched_skills.length > 0 && (
                      <div className="applicant-skills">
                        <span className="skills-label">Top Skills:</span>
                        <div className="skills-tags">
                          {applicant.matched_skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                          {applicant.matched_skills.length > 4 && (
                            <span className="skill-tag">+{applicant.matched_skills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Final Report Button */}
                    {applicant.final_report && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <button
                          onClick={() => {
                            setSelectedReport({ ...applicant.final_report, student_name: applicant.full_name });
                            setShowReportModal(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: applicant.final_report.certificate_file 
                              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
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
                          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          {applicant.final_report.certificate_file ? 'Certificate Uploaded' : 'View Final Report & Upload Certificate'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Messages Section */}
        {activeMenu === 'messages' && (
          <>
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Chat with your trainers</p>
            </div>

            <div className="chat-container">
              {/* Trainers List (Conversations) */}
              <div className="conversations-sidebar">
                <h3>My Trainers</h3>
                {conversations.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No trainers yet</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {conversations.map(trainer => (
                      <div
                        key={trainer.id}
                        className={`conversation-item ${selectedConversation === trainer.id ? 'active' : ''}`}
                        onClick={() => loadMessages(trainer)}
                      >
                        <div className="conversation-avatar">
                          {trainer.profile_image ? (
                            <img 
                              src={trainer.profile_image.startsWith('http') ? trainer.profile_image : `http://localhost:5050${trainer.profile_image}`} 
                              alt={trainer.full_name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = trainer.full_name ? trainer.full_name.charAt(0).toUpperCase() : 'T';
                              }}
                            />
                          ) : (
                            trainer.full_name ? trainer.full_name.charAt(0).toUpperCase() : 'T'
                          )}
                        </div>
                        <div className="conversation-info">
                          <h4>{trainer.full_name || 'Trainer'}</h4>
                          <p className="student-email">{trainer.email}</p>
                        </div>
                        {trainer.unread_count > 0 && (
                          <span className="unread-count">{trainer.unread_count}</span>
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
                    <h3>Select a Trainer</h3>
                    <p>Choose a trainer from the list to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    {selectedTrainer && (
                      <div className="chat-header">
                        <div className="conversation-avatar">
                          {selectedTrainer.profile_image ? (
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
                            selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : 'T'
                          )}
                        </div>
                        <div>
                          <h3>{selectedTrainer.full_name}</h3>
                          <p className="student-info">{selectedTrainer.email}</p>
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
                            const isSentByCompany = Number(msg.sender_id) === Number(user.id);
                            return (
                            <div
                              key={msg.id}
                              className={`message-item ${isSentByCompany ? 'sent' : 'received'}`}
                            >
                              {/* Show avatar for receiver (trainer) on left */}
                              {!isSentByCompany && selectedTrainer && (
                                <div className="message-avatar">
                                  {selectedTrainer.profile_image ? (
                                    <img 
                                      src={selectedTrainer.profile_image.startsWith('http') ? selectedTrainer.profile_image : `http://localhost:5050${selectedTrainer.profile_image}`} 
                                      alt={selectedTrainer.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : 'T';
                                      }}
                                    />
                                  ) : (
                                    selectedTrainer.full_name ? selectedTrainer.full_name.charAt(0).toUpperCase() : 'T'
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
                              {/* Show avatar for sender (company) on right */}
                              {isSentByCompany && (
                                <div className="message-avatar">
                                  {companyData.logo ? (
                                    <img 
                                      src={`http://localhost:5050${companyData.logo}`} 
                                      alt={user.full_name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C';
                                      }}
                                    />
                                  ) : (
                                    user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C'
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

        {/* Interviews Section */}
        {activeMenu === 'interviews' && (
          <>
            <div className="dashboard-header">
              <h1>Schedule Interviews</h1>
              <p>Schedule interviews with applied students</p>
            </div>

            <div className="interviews-container" style={{padding: '32px'}}>
              {/* Select Internship */}
              <div className="internship-filter-section">
                <label className="filter-label">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Select Internship:
                </label>
                <select
                  className="internship-filter-select"
                  value={selectedInternshipForInterview}
                  onChange={(e) => {
                    setSelectedInternshipForInterview(e.target.value);
                    if (e.target.value) {
                      loadAppliedStudents(e.target.value);
                      setInterviewForm({...interviewForm, internship_id: e.target.value});
                    }
                  }}
                >
                  <option value="">Select an internship</option>
                  {internships.map(internship => (
                    <option key={internship.id} value={internship.id}>
                      {internship.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInternshipForInterview && appliedStudents.length > 0 && (
                <div className="interview-form-container" style={{marginTop: '24px'}}>
                  <div className="profile-form-card">
                    <h3 style={{marginBottom: '20px', color: '#1f2937'}}>Schedule Interview</h3>
                    
                    <form onSubmit={handleScheduleInterview}>
                      {/* Select Student */}
                      <div className="form-group">
                        <label>Select Student *</label>
                        <select
                          value={interviewForm.student_id}
                          onChange={(e) => setInterviewForm({...interviewForm, student_id: e.target.value})}
                          required
                        >
                          <option value="">Choose a student</option>
                          {appliedStudents.map(student => (
                            <option key={student.student_id} value={student.student_id}>
                              {student.full_name} - {student.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Interview Date */}
                      <div className="form-group">
                        <label>Interview Date *</label>
                        <input
                          type="date"
                          value={interviewForm.interview_date}
                          onChange={(e) => setInterviewForm({...interviewForm, interview_date: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      {/* Interview Time */}
                      <div className="form-group">
                        <label>Interview Time *</label>
                        <input
                          type="time"
                          value={interviewForm.interview_time}
                          onChange={(e) => setInterviewForm({...interviewForm, interview_time: e.target.value})}
                          required
                        />
                      </div>

                      {/* Interview Type */}
                      <div className="form-group">
                        <label>Interview Type *</label>
                        <select
                          value={interviewForm.interview_type}
                          onChange={(e) => setInterviewForm({...interviewForm, interview_type: e.target.value})}
                          required
                        >
                          <option value="in-person">In-Person</option>
                          <option value="online">Online</option>
                          <option value="phone">Phone</option>
                        </select>
                      </div>

                      {/* Interview Location */}
                      <div className="form-group">
                        <label>Location / Meeting Link</label>
                        <input
                          type="text"
                          value={interviewForm.interview_location}
                          onChange={(e) => setInterviewForm({...interviewForm, interview_location: e.target.value})}
                          placeholder={interviewForm.interview_type === 'online' ? 'Enter meeting link' : 'Enter location'}
                        />
                      </div>

                      {/* Notes */}
                      <div className="form-group">
                        <label>Additional Notes</label>
                        <textarea
                          value={interviewForm.notes}
                          onChange={(e) => setInterviewForm({...interviewForm, notes: e.target.value})}
                          placeholder="Any additional information for the student..."
                          rows="4"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="form-actions" style={{marginTop: '24px'}}>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={schedulingInterview}
                        >
                          {schedulingInterview ? 'Scheduling...' : 'Schedule Interview'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {selectedInternshipForInterview && appliedStudents.length === 0 && (
                <div className="empty-state" style={{marginTop: '40px'}}>
                  <h3>No Applied Students</h3>
                  <p>There are no students who have applied to this internship yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Meetings Section */}
        {activeMenu === 'meetings' && (
          <>
            <div className="dashboard-header">
              <h1>Meetings</h1>
              <p>Start a video call meeting with students</p>
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
                Ready to Start a Meeting?
              </h2>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                Click the button below to create a new meeting room. You can invite students who have applied to your internships.
              </p>

              <button
                onClick={handleStartMeeting}
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
                Start Meeting
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
                  <strong>Tip:</strong> Once you start the meeting, you can select which students to invite. Only students who have applied to your internships will be notified.
                </p>
              </div>
            </div>
          </>
        )}

        {activeMenu !== 'dashboard' && activeMenu !== 'profile' && activeMenu !== 'post' && activeMenu !== 'manage' && activeMenu !== 'applicants' && activeMenu !== 'details' && activeMenu !== 'messages' && activeMenu !== 'interviews' && activeMenu !== 'meetings' && (
          <div className="dashboard-header">
            <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</h1>
            <p>This section is under development</p>
          </div>
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
          onClick={() => {
            setShowReportModal(false);
            setCertificateFile(null);
          }}
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
                  onClick={() => {
                    setShowReportModal(false);
                    setCertificateFile(null);
                  }}
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    {[
                      { label: 'Technical Skills', value: selectedReport.technical_skills_rating, color: '#3b82f6' },
                      { label: 'Communication', value: selectedReport.communication_rating, color: '#8b5cf6' },
                      { label: 'Teamwork', value: selectedReport.teamwork_rating, color: '#10b981' },
                      { label: 'Problem Solving', value: selectedReport.problem_solving_rating, color: '#f59e0b' },
                      { label: 'Attendance', value: selectedReport.attendance_rating, color: '#ef4444' }
                    ].map((rating, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                          {rating.label}
                        </p>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: rating.color,
                          marginBottom: '2px'
                        }}>
                          {rating.value || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>out of 10</div>
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

                {/* Certificate Section */}
                {selectedReport.certificate_file ? (
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
                        Certificate Uploaded
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#166534' }}>
                        Uploaded on {new Date(selectedReport.certificate_uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                      Upload Certificate
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                      Upload the training completion certificate for this student
                    </p>
                    
                    <input 
                      type="file" 
                      id="certificate-upload" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={handleCertificateUpload}
                      style={{ display: 'none' }}
                    />
                    
                    {certificateFile ? (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          padding: '12px',
                          background: '#e0f2fe',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '14px', color: '#0c4a6e' }}>Certificate ready to upload</span>
                          <button
                            onClick={() => setCertificateFile(null)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0c4a6e',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => document.getElementById('certificate-upload').click()}
                        disabled={uploadingCertificate}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'white',
                          color: '#3b82f6',
                          border: '2px solid #3b82f6',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: uploadingCertificate ? 'not-allowed' : 'pointer',
                          opacity: uploadingCertificate ? 0.6 : 1
                        }}
                      >
                        {uploadingCertificate ? 'Uploading...' : 'Choose File'}
                      </button>
                      
                      {certificateFile && (
                        <button
                          onClick={handleSubmitCertificate}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          {loading ? 'Submitting...' : 'Submit Certificate'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Selection Modal for Meeting */}
        {showStudentSelectionModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Select Students to Invite</h2>
                <button
                  onClick={() => setShowStudentSelectionModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                Select students who have applied to your internships to invite them to the meeting.
              </p>

              {applicantsForMeeting.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: '#64748b', fontSize: '16px' }}>
                    No students have applied to your internships yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '24px', maxHeight: '400px', overflow: 'auto' }}>
                    {applicantsForMeeting.map(student => (
                      <div
                        key={student.student_id}
                        onClick={() => toggleStudentForCall(student.student_id)}
                        style={{
                          padding: '16px',
                          border: '2px solid',
                          borderColor: selectedStudentsForCall.includes(student.student_id) ? '#3b82f6' : '#e2e8f0',
                          borderRadius: '12px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          backgroundColor: selectedStudentsForCall.includes(student.student_id) ? '#eff6ff' : 'white',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: '2px solid',
                          borderColor: selectedStudentsForCall.includes(student.student_id) ? '#3b82f6' : '#cbd5e1',
                          backgroundColor: selectedStudentsForCall.includes(student.student_id) ? '#3b82f6' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {selectedStudentsForCall.includes(student.student_id) && (
                            <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                            {student.full_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {student.email} • {student.internship_title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowStudentSelectionModal(false)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        color: '#64748b',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmMeeting}
                      disabled={selectedStudentsForCall.length === 0}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedStudentsForCall.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: selectedStudentsForCall.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: selectedStudentsForCall.length === 0 ? 0.6 : 1
                      }}
                    >
                      Start Meeting ({selectedStudentsForCall.length} selected)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CompanyDashboard;
