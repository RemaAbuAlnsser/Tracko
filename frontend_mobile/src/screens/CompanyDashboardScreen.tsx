import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import {
  loadChatMessages,
  sendChatMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount,
} from '../utils/chatService';

interface CompanyDashboardScreenProps {
  userData?: any;
  onLogout?: () => void;
}

type TabKey = 'dashboard' | 'profile' | 'post' | 'manage' | 'applicants' | 'details' | 'messages' | 'interviews' | 'meetings';

const CompanyDashboardScreen: React.FC<CompanyDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
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
    description: 'TechCorp is a leading software development company.',
  });
  const [dashboardStats, setDashboardStats] = useState({
    internshipsCount: 0,
    applicantsCount: 0,
    trainersCount: 0,
    activeStudentsCount: 0,
  });
  const [newApplicantsCount, setNewApplicantsCount] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [trainerRequests, setTrainerRequests] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedCompanyData, setEditedCompanyData] = useState(companyData);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [internshipData, setInternshipData] = useState({
    title: '',
    description: '',
    requirements: '',
    specialization: '',
    capacity: '1',
    status: 'open',
    min_gpa: '',
    work_mode: '',
  });
  const [companyTrainers, setCompanyTrainers] = useState<any[]>([]);
  const [selectedTrainers, setSelectedTrainers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [internships, setInternships] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingInternship, setViewingInternship] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInternshipId, setEditingInternshipId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedInternshipFilter, setSelectedInternshipFilter] = useState('all');
  const [matchScoreFilter, setMatchScoreFilter] = useState('all');
  const [showInternshipFilterModal, setShowInternshipFilterModal] = useState(false);
  const [showMatchScoreModal, setShowMatchScoreModal] = useState(false);
  const [acceptedApplicants, setAcceptedApplicants] = useState<any[]>([]);
  const [selectedAcceptedInternshipFilter, setSelectedAcceptedInternshipFilter] = useState('all');
  const [showAcceptedInternshipModal, setShowAcceptedInternshipModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Interviews state
  const [appliedStudents, setAppliedStudents] = useState<any[]>([]);
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
  const [showInterviewTypeModal, setShowInterviewTypeModal] = useState(false);
  const [showInternshipSelectModal, setShowInternshipSelectModal] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

  // Options for select lists
  const specializationOptions = [
    'Software Engineering',
    'Data Science',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'DevOps',
    'Cybersecurity',
    'AI/Machine Learning',
    'Cloud Computing',
    'Other'
  ];

  const workModeOptions = ['remote', 'onsite', 'hybrid'];
  const statusOptions = ['open', 'closed', 'pending'];
  const matchScoreOptions = [
    { label: 'All Scores', value: 'all' },
    { label: 'High (80%+)', value: 'high' },
    { label: 'Medium (60-79%)', value: 'medium' },
    { label: 'Low (<60%)', value: 'low' },
  ];

  // Load company data
  const loadCompanyData = async () => {
    if (!userData?.email) return;

    try {
      console.log('📥 Loading company data for:', userData.email);
      const response = await fetch(`${baseUrl}/api/companies/email/${userData.email}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Company data:', data);
        
        if (data.success && data.company) {
          setCompanyData({
            id: data.company.id,
            name: data.company.name || userData.full_name,
            email: data.company.email || userData.email,
            phone: data.company.phone || '',
            industry: data.company.industry || 'Technology',
            company_size: data.company.company_size || '1000-5000',
            founded_year: data.company.founded_year || '2010',
            headquarters: data.company.headquarters || 'San Francisco, CA',
            website: data.company.website || 'https://www.techcorp.com',
            linkedin_url: data.company.linkedin_url || 'https://linkedin.com/company/techcorp',
            address: data.company.address || '123 Tech Street, Suite 400, San Francisco, CA 94105',
            description: data.company.description || 'TechCorp is a leading software development company.',
          });

          // Load dashboard stats, trainer requests, and company trainers
          loadDashboardStats(data.company.id);
          loadTrainerRequests(data.company.id);
          loadCompanyTrainers(data.company.id);
        }
      }
    } catch (error) {
      console.error('❌ Error loading company data:', error);
    }
  };

  // Load dashboard statistics
  const loadDashboardStats = async (companyId: number) => {
    try {
      console.log('📊 Loading dashboard stats for company:', companyId);
      const url = `${baseUrl}/api/companies/${companyId}/stats`;
      console.log('🔗 Stats URL:', url);
      const response = await fetch(url);
      
      console.log('📡 Stats response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dashboard stats response:', result);
        
        const stats = result.data || result;
        console.log('📈 Stats values:', {
          internships: stats.internshipsCount,
          applicants: stats.applicantsCount,
          trainers: stats.trainersCount,
          students: stats.activeStudentsCount
        });
        
        setDashboardStats({
          internshipsCount: stats.internshipsCount || 0,
          applicantsCount: stats.applicantsCount || 0,
          trainersCount: stats.trainersCount || 0,
          activeStudentsCount: stats.activeStudentsCount || 0,
        });
        setNewApplicantsCount(stats.newApplicantsCount || 0);
      } else {
        console.log('⚠️ Dashboard stats response not OK:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
    }
  };

  // Load pending trainer requests
  const loadTrainerRequests = async (companyId: number) => {
    try {
      console.log('👥 Loading trainer requests for company:', companyId);
      const url = `${baseUrl}/api/companies/${companyId}/trainer-requests`;
      console.log('🔗 Trainer requests URL:', url);
      const response = await fetch(url);
      
      console.log('📡 Trainer requests response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Trainer requests data:', data);
        const requests = data.requests || data || [];
        console.log('📊 Number of requests:', requests.length);
        setTrainerRequests(requests);
      } else {
        console.log('⚠️ Trainer requests response not OK:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading trainer requests:', error);
    }
  };

  // Approve trainer request
  const handleApproveTrainerRequest = async (requestId: number) => {
    if (!companyData.id) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/companies/${companyData.id}/trainer-requests/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Trainer request approved successfully');
        loadTrainerRequests(companyData.id);
        loadDashboardStats(companyData.id);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to approve trainer request');
      }
    } catch (error) {
      console.error('❌ Error approving trainer request:', error);
      Alert.alert('Error', 'Failed to approve trainer request');
    }
  };

  // Reject trainer request
  const handleRejectTrainerRequest = async (requestId: number) => {
    if (!companyData.id) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/companies/${companyData.id}/trainer-requests/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Trainer request rejected');
        loadTrainerRequests(companyData.id);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to reject trainer request');
      }
    } catch (error) {
      console.error('❌ Error rejecting trainer request:', error);
      Alert.alert('Error', 'Failed to reject trainer request');
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!companyData.id) return;

    try {
      const response = await fetch(`${baseUrl}/api/companies/${companyData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCompanyData),
      });

      if (response.ok) {
        setCompanyData(editedCompanyData);
        setIsEditingProfile(false);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        Alert.alert('Success', 'Profile updated successfully!');
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: 'Failed to update profile', type: 'error' });
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setMessage({ text: 'Error updating profile', type: 'error' });
      Alert.alert('Error', 'Error updating profile');
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setEditedCompanyData(prev => ({ ...prev, [field]: value }));
  };

  // Load company trainers
  const loadCompanyTrainers = async (companyId: number) => {
    try {
      console.log('👥 Loading company trainers for company ID:', companyId);
      const url = `${baseUrl}/api/companies/${companyId}/trainers`;
      console.log('🔗 Trainers URL:', url);
      
      const response = await fetch(url);
      console.log('📥 Trainers response status:', response.status);
      
      if (response.ok) {
        const trainers = await response.json();
        console.log('✅ Trainers loaded:', trainers);
        console.log('📊 Number of trainers:', trainers.length);
        setCompanyTrainers(trainers);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load trainers:', response.status, errorText);
      }
    } catch (error) {
      console.error('💥 Error loading trainers:', error);
    }
  };

  // Handle internship input change
  const handleInternshipInputChange = (field: string, value: string) => {
    setInternshipData(prev => ({ ...prev, [field]: value }));
  };

  // Handle trainer selection
  const handleTrainerSelection = (trainerId: number) => {
    setSelectedTrainers(prev => {
      if (prev.includes(trainerId)) {
        return prev.filter(id => id !== trainerId);
      } else {
        return [...prev, trainerId];
      }
    });
  };

  // Handle post internship
  const handlePostInternship = async () => {
    const isEditing = editingInternshipId !== null;
    console.log(isEditing ? '✏️ Updating internship...' : '📝 Posting internship...');
    console.log('Company ID:', companyData.id);
    
    if (!companyData.id) {
      Alert.alert('Error', 'Company ID not found. Please try logging in again.');
      return;
    }

    // Validation
    if (!internshipData.title || !internshipData.description) {
      Alert.alert('Error', 'Please fill in all required fields (Title and Description)');
      return;
    }

    const postData = {
      ...internshipData,
      company_email: companyData.email,
      trainer_ids: selectedTrainers,
    };
    
    console.log('📤 Data:', postData);
    setLoading(true);
    
    try {
      const url = isEditing 
        ? `${baseUrl}/api/internships/${editingInternshipId}`
        : `${baseUrl}/api/internships`;
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log(`🔗 ${method} URL:`, url);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success:', result);
        Alert.alert('Success', isEditing ? 'Internship updated successfully!' : 'Internship posted successfully!');
        setMessage({ 
          text: isEditing ? 'Internship updated successfully!' : 'Internship posted successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setInternshipData({
          title: '',
          description: '',
          requirements: '',
          specialization: '',
          capacity: '1',
          status: 'open',
          min_gpa: '',
          work_mode: '',
        });
        setSelectedTrainers([]);
        setEditingInternshipId(null);
        
        // Reload internships if we were editing
        if (isEditing) {
          loadInternships();
        }
        
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed:', response.status, errorText);
        Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'post'} internship: ${errorText}`);
        setMessage({ text: `Failed to ${isEditing ? 'update' : 'post'} internship`, type: 'error' });
      }
    } catch (error: any) {
      console.error('💥 Error:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'post'} internship: ${error?.message || 'Unknown error'}`);
      setMessage({ text: `Error ${isEditing ? 'updating' : 'posting'} internship`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load company internships
  const loadInternships = async () => {
    if (!companyData.email) return;
    
    try {
      console.log('📋 Loading internships for company email:', companyData.email);
      const response = await fetch(`${baseUrl}/api/internships/by-company/${companyData.email}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Internships loaded:', data.internships?.length || 0);
        setInternships(data.internships || []);
      } else {
        console.error('❌ Failed to load internships');
      }
    } catch (error) {
      console.error('💥 Error loading internships:', error);
    }
  };

  // Handle view internship
  const handleViewInternship = (internship: any) => {
    setViewingInternship(internship);
    setShowViewModal(true);
  };

  // Handle edit internship
  const handleEditInternship = (internship: any) => {
    // Save the internship ID for editing
    setEditingInternshipId(internship.id);
    
    // Fill form with internship data
    setInternshipData({
      title: internship.title,
      description: internship.description || '',
      requirements: internship.requirements || '',
      specialization: internship.specialization || '',
      capacity: String(internship.capacity),
      status: internship.status,
      min_gpa: internship.min_gpa || '',
      work_mode: internship.work_mode || '',
    });
    
    // Set selected trainers if available
    if (internship.trainers && internship.trainers.length > 0) {
      setSelectedTrainers(internship.trainers.map((t: any) => t.id));
    } else {
      setSelectedTrainers([]);
    }
    
    // Switch to post tab for editing
    setActiveTab('post');
    Alert.alert('Edit Mode', 'You are now editing this internship. Make your changes and save.');
  };

  // Handle delete internship
  const handleDeleteInternship = async (internshipId: number) => {
    Alert.alert(
      'Delete Internship',
      'Are you sure you want to delete this internship?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/internships/${internshipId}`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Internship deleted successfully');
                loadInternships();
              } else {
                Alert.alert('Error', 'Failed to delete internship');
              }
            } catch (error) {
              console.error('Error deleting internship:', error);
              Alert.alert('Error', 'Failed to delete internship');
            }
          },
        },
      ]
    );
  };

  // Filter internships
  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || internship.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Load applicants
  const loadApplicants = async () => {
    if (!companyData.id) return;
    
    try {
      console.log('👥 Loading applicants for company ID:', companyData.id);
      const response = await fetch(`${baseUrl}/api/matching/company/${companyData.id}/applicants`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Applicants loaded:', data.data?.length || 0);
        setApplicants(data.data || []);
      } else {
        console.error('❌ Failed to load applicants');
      }
    } catch (error) {
      console.error('💥 Error loading applicants:', error);
    }
  };

  // Handle accept applicant
  const handleAcceptApplicant = async (matchId: number, studentId: number) => {
    Alert.alert(
      'Accept Applicant',
      'Are you sure you want to accept this applicant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              console.log(`✅ Accepting applicant ${matchId}...`);
              const response = await fetch(`${baseUrl}/api/matching/applicant/${matchId}/accept`, {
                method: 'POST',
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'Applicant accepted successfully!\nInternship capacity decreased by 1');
                loadApplicants();
                loadInternships();
              } else {
                Alert.alert('Error', data.message || 'Failed to accept applicant');
              }
            } catch (error) {
              console.error('Error accepting applicant:', error);
              Alert.alert('Error', 'An error occurred while accepting applicant');
            }
          },
        },
      ]
    );
  };

  // Handle reject applicant
  const handleRejectApplicant = async (matchId: number) => {
    Alert.alert(
      'Reject Applicant',
      'Are you sure you want to reject this applicant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`❌ Rejecting applicant ${matchId}...`);
              const response = await fetch(`${baseUrl}/api/matching/applicant/${matchId}/reject`, {
                method: 'POST',
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'Applicant rejected');
                loadApplicants();
              } else {
                Alert.alert('Error', 'Failed to reject applicant');
              }
            } catch (error) {
              console.error('Error rejecting applicant:', error);
              Alert.alert('Error', 'An error occurred while rejecting applicant');
            }
          },
        },
      ]
    );
  };

  // Filter applicants
  const filteredApplicants = applicants.filter(applicant => {
    const matchesInternship = selectedInternshipFilter === 'all' || 
                              applicant.internship_id == selectedInternshipFilter;
    const matchesScore = matchScoreFilter === 'all' || 
      (matchScoreFilter === 'high' && applicant.match_percentage >= 80) ||
      (matchScoreFilter === 'medium' && applicant.match_percentage >= 60 && applicant.match_percentage < 80) ||
      (matchScoreFilter === 'low' && applicant.match_percentage < 60);
    return matchesInternship && matchesScore;
  });

  // Load accepted applicants
  const loadAcceptedApplicants = async () => {
    if (!companyData.id) return;
    
    try {
      console.log('✅ Loading accepted applicants for company ID:', companyData.id);
      const response = await fetch(`${baseUrl}/api/matching/company/${companyData.id}/accepted`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Accepted applicants loaded:', data.data?.length || 0);
        setAcceptedApplicants(data.data || []);
      } else {
        console.log('⚠️ No accepted applicants found');
        setAcceptedApplicants([]);
      }
    } catch (error) {
      console.error('💥 Error loading accepted applicants:', error);
      setAcceptedApplicants([]);
    }
  };

  // Filter accepted applicants
  const filteredAcceptedApplicants = acceptedApplicants.filter(applicant => 
    selectedAcceptedInternshipFilter === 'all' || 
    applicant.internship_id == selectedAcceptedInternshipFilter
  );

  // Load contacts (trainers)
  const loadContacts = async () => {
    if (!companyData.id) return;
    try {
      const trainers = companyTrainers.map(trainer => ({
        id: trainer.id,
        name: trainer.full_name,
        role: 'Trainer',
        unread: 0,
      }));
      setContacts(trainers);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContactId || !companyData.id) {
      Alert.alert('Error', 'Cannot send message. Please try again.');
      return;
    }
    
    try {
      await sendChatMessage(companyData.id, selectedContactId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please check your connection.');
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('CompanyDashboard userData:', userData);
    if (userData?.email) {
      loadCompanyData();
    }
  }, [userData?.email]);

  // Update editedCompanyData when companyData changes
  useEffect(() => {
    setEditedCompanyData(companyData);
  }, [companyData]);

  // Load trainers when company data is available
  useEffect(() => {
    if (companyData.id) {
      loadCompanyTrainers(companyData.id);
    }
  }, [companyData.id]);

  // Load internships when switching to manage tab
  useEffect(() => {
    if (activeTab === 'manage' && companyData.email) {
      loadInternships();
    }
  }, [activeTab, companyData.email]);

  // Load applicants when switching to applicants tab
  useEffect(() => {
    if (activeTab === 'applicants' && companyData.id) {
      loadInternships(); // Load internships for filter
      loadApplicants();
    }
  }, [activeTab, companyData.id]);

  // Load accepted students when switching to details tab
  useEffect(() => {
    if (activeTab === 'details' && companyData.id) {
      loadInternships(); // Load internships for filter
      loadAcceptedApplicants();
    }
  }, [activeTab, companyData.id]);

  // Load contacts when switching to messages tab
  useEffect(() => {
    if (activeTab === 'messages' && companyTrainers.length > 0) {
      loadContacts();
    }
  }, [activeTab, companyTrainers]);

  // Load messages when contact is selected
  useEffect(() => {
    if (!selectedContactId || !companyData.id) return;
    
    const loadMessagesData = async () => {
      try {
        const msgs = await loadChatMessages(companyData.id, selectedContactId);
        setMessages(msgs);
        await markMessagesAsRead(companyData.id, selectedContactId);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessagesData();
    const unsubscribe = subscribeToMessages(companyData.id, selectedContactId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });

    return () => unsubscribe();
  }, [selectedContactId, companyData.id]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'CO';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle tab change
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    
    // Load specific data based on tab
    if (tab === 'dashboard' && companyData.id) {
      loadDashboardStats(companyData.id);
      loadTrainerRequests(companyData.id);
    }
  };

  // Render Dashboard Tab
  const renderDashboard = () => {
    const screenWidth = Dimensions.get('window').width;
    
    // Chart configuration
    const chartConfig = {
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.7,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
    };

    // Line chart data
    const lineChartData = {
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      datasets: [
        {
          data: [
            Math.max(1, Math.floor(dashboardStats.internshipsCount * 0.4)),
            Math.max(1, Math.floor(dashboardStats.internshipsCount * 0.5)),
            Math.max(2, Math.floor(dashboardStats.internshipsCount * 0.65)),
            Math.max(2, Math.floor(dashboardStats.internshipsCount * 0.75)),
            Math.max(3, Math.floor(dashboardStats.internshipsCount * 0.88)),
            dashboardStats.internshipsCount || 1,
          ],
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [
            Math.max(5, Math.floor(dashboardStats.applicantsCount * 0.35)),
            Math.max(8, Math.floor(dashboardStats.applicantsCount * 0.5)),
            Math.max(12, Math.floor(dashboardStats.applicantsCount * 0.65)),
            Math.max(15, Math.floor(dashboardStats.applicantsCount * 0.78)),
            Math.max(18, Math.floor(dashboardStats.applicantsCount * 0.9)),
            dashboardStats.applicantsCount || 1,
          ],
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      legend: ['Internships', 'Applicants'],
    };

    // Bar chart data
    const barChartData = {
      labels: ['Internships', 'Applicants', 'Trainers', 'Students'],
      datasets: [
        {
          data: [
            dashboardStats.internshipsCount || 0,
            dashboardStats.applicantsCount || 0,
            dashboardStats.trainersCount || 0,
            dashboardStats.activeStudentsCount || 0,
          ],
        },
      ],
    };

    // Pie chart data
    const pieChartData = [
      {
        name: 'Internships',
        population: dashboardStats.internshipsCount || 1,
        color: '#3b82f6',
        legendFontColor: '#64748b',
        legendFontSize: 12,
      },
      {
        name: 'Trainers',
        population: dashboardStats.trainersCount || 1,
        color: '#a855f7',
        legendFontColor: '#64748b',
        legendFontSize: 12,
      },
      {
        name: 'Students',
        population: dashboardStats.activeStudentsCount || 1,
        color: '#f59e0b',
        legendFontColor: '#64748b',
        legendFontSize: 12,
      },
    ];

    return (
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.welcomeTitle}>Company Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome back, {companyData.name || userData?.full_name}! Here's your company overview.
          </Text>
        </View>

        {/* KPI Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Key Performance Indicators</Text>
          <Text style={styles.sectionHeaderSubtitle}>Real-time metrics and statistics</Text>
        </View>

        {/* Colored Gradient Cards */}
        <View style={styles.kpiContainer}>
          {/* Open Internships - Blue Gradient */}
          <View style={[styles.gradientCard, styles.blueGradient]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Open Internships</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>POSITIONS</Text>
              </View>
            </View>
            <Text style={styles.cardValue}>{dashboardStats.internshipsCount}</Text>
            <Text style={styles.cardSubtext}>Available positions</Text>
          </View>

          {/* Total Applicants - Green Gradient */}
          <View style={[styles.gradientCard, styles.greenGradient]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total Applicants</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>STUDENTS</Text>
              </View>
            </View>
            <Text style={styles.cardValue}>{dashboardStats.applicantsCount}</Text>
            <View style={styles.cardDetails}>
              <View style={styles.cardDetailRow}>
                <Text style={styles.cardDetailLabel}>New This Week</Text>
                <Text style={styles.cardDetailValue}>
                  {newApplicantsCount || Math.floor(dashboardStats.applicantsCount * 0.15)}
                </Text>
              </View>
              <View style={styles.cardDetailRow}>
                <Text style={styles.cardDetailLabel}>Under Review</Text>
                <Text style={styles.cardDetailValue}>
                  {Math.floor(dashboardStats.applicantsCount * 0.35)}
                </Text>
              </View>
              <View style={styles.cardDetailRow}>
                <Text style={styles.cardDetailLabel}>Accepted</Text>
                <Text style={styles.cardDetailValue}>{dashboardStats.activeStudentsCount}</Text>
              </View>
            </View>
          </View>

          {/* Team Overview - Purple Gradient */}
          <View style={[styles.gradientCard, styles.purpleGradient]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Team Overview</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>TRAINERS</Text>
              </View>
            </View>
            <View style={styles.circularStat}>
              <View style={styles.circularStatInner}>
                <Text style={styles.circularStatValue}>{dashboardStats.trainersCount}</Text>
                <Text style={styles.circularStatLabel}>Trainers</Text>
              </View>
            </View>
            <Text style={styles.cardSubtext}>
              {dashboardStats.trainersCount > 0
                ? `${Math.floor((dashboardStats.activeStudentsCount / dashboardStats.trainersCount) * 10) / 10} students per trainer`
                : 'No trainers yet'}
            </Text>
          </View>

          {/* Active Students - Orange Gradient */}
          <View style={[styles.gradientCard, styles.orangeGradient]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Active Students</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>IN TRAINING</Text>
              </View>
            </View>
            <Text style={styles.cardValue}>{dashboardStats.activeStudentsCount}</Text>
            <Text style={styles.cardSubtext}>Students in training</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterLabel}>Success Rate</Text>
              <Text style={styles.cardFooterValue}>
                {dashboardStats.activeStudentsCount > 0 ? '85%' : '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Analytics & Insights</Text>
        </View>

        {/* Line Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Growth Trends</Text>
            <Text style={styles.chartSubtitle}>Last 6 Months</Text>
          </View>
          <LineChart
            data={lineChartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={true}
          />
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Current Stats</Text>
            <Text style={styles.chartSubtitle}>
              Total:{' '}
              {dashboardStats.internshipsCount +
                dashboardStats.applicantsCount +
                dashboardStats.trainersCount +
                dashboardStats.activeStudentsCount}
            </Text>
          </View>
          <BarChart
            data={barChartData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            withInnerLines={false}
          />
        </View>

        {/* Pie Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Team Distribution</Text>
            <Text style={styles.chartSubtitle}>{dashboardStats.trainersCount} Trainers</Text>
          </View>
          <PieChart
            data={pieChartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            absolute
          />
        </View>

        {/* Pending Trainer Registrations */}
        <View style={styles.trainerRequestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Pending Trainer Registrations</Text>
            {trainerRequests.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{trainerRequests.length}</Text>
              </View>
            )}
          </View>

          {trainerRequests.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No pending trainer requests</Text>
            </View>
          ) : (
            trainerRequests.map((request) => (
              <View key={request.id} style={styles.trainerRequestCard}>
                <View style={styles.trainerRequestHeader}>
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.trainerAvatarText}>
                      {request.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'TR'}
                    </Text>
                  </View>
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>{request.full_name}</Text>
                    <Text style={styles.trainerEmail}>{request.email}</Text>
                    <Text style={styles.trainerDate}>
                      Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.trainerRequestActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveTrainerRequest(request.id)}
                  >
                    <Text style={styles.actionButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectTrainerRequest(request.id)}
                  >
                    <Text style={styles.actionButtonText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  };

  // Render Profile Tab
  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Company Profile & Edit</Text>
      <Text style={styles.sectionSubtitle}>Manage your company information and settings</Text>

      {/* Success/Error Message */}
      {message.text && (
        <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      {/* Company Logo Card */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Company Logo</Text>
        <View style={styles.logoContainer}>
          <View style={styles.logoPreview}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitials}>{getInitials(companyData.name || userData?.full_name)}</Text>
            </View>
          </View>
          <View style={styles.logoBadges}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.profileBadgeText}>Verified Partner</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.profileBadgeText}>Top Company</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.uploadLogoButton}>
          <Text style={styles.uploadLogoButtonText}>Upload / Change Logo</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>Recommended size: 200x200px</Text>
      </View>

      {/* Company Information */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Company Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Company Name</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Company Name"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.name || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Industry</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.industry}
              onChangeText={(text) => handleInputChange('industry', text)}
              placeholder="e.g., Technology"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.industry || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Company Size</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.company_size}
              onChangeText={(text) => handleInputChange('company_size', text)}
              placeholder="e.g., 1000-5000 employees"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.company_size || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Founded Year</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.formInput}
                value={editedCompanyData.founded_year}
                onChangeText={(text) => handleInputChange('founded_year', text)}
                placeholder="2010"
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={companyData.founded_year || 'Not provided'}
                editable={false}
              />
            )}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>Headquarters</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.formInput}
                value={editedCompanyData.headquarters}
                onChangeText={(text) => handleInputChange('headquarters', text)}
                placeholder="City, Country"
              />
            ) : (
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={companyData.headquarters || 'Not provided'}
                editable={false}
              />
            )}
          </View>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Contact Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Company Email</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="company@example.com"
              keyboardType="email-address"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.email || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Phone Number</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.phone || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Website</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.website}
              onChangeText={(text) => handleInputChange('website', text)}
              placeholder="https://www.company.com"
              keyboardType="url"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.website || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>LinkedIn URL</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.linkedin_url}
              onChangeText={(text) => handleInputChange('linkedin_url', text)}
              placeholder="https://linkedin.com/company/..."
              keyboardType="url"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.linkedin_url || 'Not provided'}
              editable={false}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Address</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedCompanyData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Full address"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={companyData.address || 'Not provided'}
              editable={false}
            />
          )}
        </View>
      </View>

      {/* Company Description */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Company Description</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>About Company</Text>
          {isEditingProfile ? (
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={editedCompanyData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Write a detailed description about your company..."
              multiline={true}
              numberOfLines={6}
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.textArea, styles.disabledInput]}
              value={companyData.description || 'Not provided'}
              editable={false}
              multiline={true}
              numberOfLines={6}
            />
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.formActions}>
        {isEditingProfile ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => {
                setIsEditingProfile(false);
                setEditedCompanyData(companyData);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => setIsEditingProfile(true)}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // Render Post Internship Tab
  const renderPost = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>
        {editingInternshipId ? 'Edit Internship' : 'Post New Internship'}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {editingInternshipId 
          ? 'Update the internship details below' 
          : 'Create a new internship opportunity for students'}
      </Text>
      
      {editingInternshipId && (
        <TouchableOpacity
          style={styles.cancelEditButton}
          onPress={() => {
            setEditingInternshipId(null);
            setInternshipData({
              title: '',
              description: '',
              requirements: '',
              specialization: '',
              capacity: '1',
              status: 'open',
              min_gpa: '',
              work_mode: '',
            });
            setSelectedTrainers([]);
          }}
        >
          <Text style={styles.cancelEditButtonText}>✕ Cancel Edit</Text>
        </TouchableOpacity>
      )}

      {/* Success/Error Message */}
      {message.text && (
        <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      {/* Internship Details */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Internship Details</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Internship Title *</Text>
          <TextInput
            style={styles.formInput}
            value={internshipData.title}
            onChangeText={(text) => handleInternshipInputChange('title', text)}
            placeholder="e.g., Software Development Intern"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Specialization</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSpecializationModal(true)}
          >
            <Text style={internshipData.specialization ? styles.selectButtonText : styles.selectButtonPlaceholder}>
              {internshipData.specialization || 'Select Specialization'}
            </Text>
            <Text style={styles.selectButtonArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Capacity *</Text>
            <TextInput
              style={styles.formInput}
              value={internshipData.capacity}
              onChangeText={(text) => handleInternshipInputChange('capacity', text)}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>Status</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {internshipData.status.charAt(0).toUpperCase() + internshipData.status.slice(1)}
              </Text>
              <Text style={styles.selectButtonArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Minimum GPA</Text>
            <TextInput
              style={styles.formInput}
              value={internshipData.min_gpa}
              onChangeText={(text) => handleInternshipInputChange('min_gpa', text)}
              placeholder="e.g., 3.0"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helpText}>Leave empty if no GPA requirement</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>Work Mode</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowWorkModeModal(true)}
            >
              <Text style={internshipData.work_mode ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {internshipData.work_mode ? internshipData.work_mode.charAt(0).toUpperCase() + internshipData.work_mode.slice(1) : 'Select Work Mode'}
              </Text>
              <Text style={styles.selectButtonArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={internshipData.description}
            onChangeText={(text) => handleInternshipInputChange('description', text)}
            placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
            multiline={true}
            numberOfLines={6}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Requirements</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={internshipData.requirements}
            onChangeText={(text) => handleInternshipInputChange('requirements', text)}
            placeholder="List the required skills, qualifications, and experience..."
            multiline={true}
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Trainer Selection */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Assign Trainers (Optional)</Text>
        <Text style={styles.helpText}>Select one or more trainers from your company to supervise this internship</Text>
        
        {companyTrainers.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            {companyTrainers.map((trainer) => (
              <TouchableOpacity
                key={trainer.id}
                style={styles.trainerCheckbox}
                onPress={() => handleTrainerSelection(trainer.id)}
              >
                <View style={[
                  styles.checkbox,
                  selectedTrainers.includes(trainer.id) && styles.checkboxChecked
                ]}>
                  {selectedTrainers.includes(trainer.id) && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.full_name}</Text>
                  {trainer.specialization && (
                    <Text style={styles.trainerSpec}>{trainer.specialization}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {selectedTrainers.length > 0 && (
              <Text style={styles.selectedCount}>
                {selectedTrainers.length} trainer(s) selected
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>No trainers available in your company yet.</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cancelBtn]}
          onPress={() => {
            setInternshipData({
              title: '',
              description: '',
              requirements: '',
              specialization: '',
              capacity: '1',
              status: 'open',
              min_gpa: '',
              work_mode: '',
            });
            setSelectedTrainers([]);
          }}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Clear Form</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.saveBtn]}
          onPress={handlePostInternship}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading 
              ? (editingInternshipId ? 'Updating...' : 'Posting...') 
              : (editingInternshipId ? 'Update Internship' : 'Post Internship')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // Render Manage Internships Tab
  const renderManage = () => (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.manageHeader}>
        <View>
          <Text style={styles.sectionTitle}>Manage Internships</Text>
          <Text style={styles.sectionSubtitle}>View and manage all your internship posts</Text>
        </View>
        <TouchableOpacity
          style={styles.btnPostNew}
          onPress={() => setActiveTab('post')}
        >
          <Text style={styles.btnPostNewText}>+ Post New</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search internships..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const statuses = ['all', 'open', 'pending', 'closed'];
            const currentIndex = statuses.indexOf(filterStatus);
            const nextIndex = (currentIndex + 1) % statuses.length;
            setFilterStatus(statuses[nextIndex]);
          }}
        >
          <Text style={styles.filterButtonText}>
            {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
          </Text>
          <Text style={styles.filterButtonArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Internships Count */}
      <View style={styles.countBanner}>
        <Text style={styles.countText}>{filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Internships List */}
      {filteredInternships.length === 0 ? (
        <View style={styles.manageEmptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No internships found</Text>
          <Text style={styles.emptyStateText}>
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Start by posting your first internship opportunity'}
          </Text>
          {!searchTerm && filterStatus === 'all' && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setActiveTab('post')}
            >
              <Text style={styles.emptyStateButtonText}>Post New Internship</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredInternships.map((internship) => (
          <View key={internship.id} style={styles.internshipCard}>
            {/* Card Header */}
            <View style={styles.internshipCardHeader}>
              <View style={styles.internshipTitleContainer}>
                <Text style={styles.internshipTitle}>{internship.title}</Text>
                <Text style={styles.internshipId}>ID: {internship.id}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                internship.status === 'open' && styles.statusOpen,
                internship.status === 'closed' && styles.statusClosed,
                internship.status === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.statusText}>{internship.status}</Text>
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.internshipCardBody}>
              <View style={styles.internshipDetail}>
                <Text style={styles.internshipDetailLabel}>Specialization:</Text>
                <Text style={styles.internshipDetailValue}>{internship.specialization || 'N/A'}</Text>
              </View>
              <View style={styles.internshipDetail}>
                <Text style={styles.internshipDetailLabel}>Capacity:</Text>
                <Text style={styles.internshipDetailValue}>{internship.capacity}</Text>
              </View>
              <View style={styles.internshipDetail}>
                <Text style={styles.internshipDetailLabel}>Posted:</Text>
                <Text style={styles.internshipDetailValue}>
                  {new Date(internship.created_at).toLocaleDateString('en-GB')}
                </Text>
              </View>
              {internship.trainers && internship.trainers.length > 0 && (
                <View style={styles.internshipDetail}>
                  <Text style={styles.internshipDetailLabel}>Trainers:</Text>
                  <View style={styles.trainersList}>
                    {internship.trainers.map((trainer: any, index: number) => (
                      <Text key={index} style={styles.trainerBadge}>{trainer.full_name}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Card Actions */}
            <View style={styles.internshipCardActions}>
              <TouchableOpacity
                style={[styles.cardActionButton, styles.cardViewButton]}
                onPress={() => handleViewInternship(internship)}
              >
                <Text style={styles.cardActionButtonText}>👁️ View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardActionButton, styles.cardEditButton]}
                onPress={() => handleEditInternship(internship)}
              >
                <Text style={styles.cardActionButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardActionButton, styles.cardDeleteButton]}
                onPress={() => handleDeleteInternship(internship.id)}
              >
                <Text style={styles.cardActionButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // Render Applicants Tab
  const renderApplicants = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Internship Applicants</Text>
      <Text style={styles.sectionSubtitle}>Review and manage student applications</Text>

      {/* Filters */}
      <View style={styles.applicantsFilters}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Internship Position</Text>
          <TouchableOpacity
            style={styles.filterSelectButton}
            onPress={() => setShowInternshipFilterModal(true)}
          >
            <Text style={styles.filterSelectText}>
              {selectedInternshipFilter === 'all' 
                ? 'All Positions' 
                : internships.find(i => i.id == selectedInternshipFilter)?.title || 'Select'}
            </Text>
            <Text style={styles.filterSelectArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Match Score</Text>
          <TouchableOpacity
            style={styles.filterSelectButton}
            onPress={() => setShowMatchScoreModal(true)}
          >
            <Text style={styles.filterSelectText}>
              {matchScoreOptions.find(opt => opt.value === matchScoreFilter)?.label || 'All Scores'}
            </Text>
            <Text style={styles.filterSelectArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Applicants Count */}
      <View style={styles.countBanner}>
        <Text style={styles.countText}>
          {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Applicants List */}
      {filteredApplicants.length === 0 ? (
        <View style={styles.manageEmptyState}>
          <Text style={styles.emptyStateIcon}>👥</Text>
          <Text style={styles.emptyStateTitle}>No Applicants Yet</Text>
          <Text style={styles.emptyStateText}>
            When students apply to your internships, they will appear here.
          </Text>
        </View>
      ) : (
        filteredApplicants.map((applicant, index) => (
          <View key={applicant.id || index} style={styles.applicantCard}>
            {/* Header */}
            <View style={styles.applicantHeader}>
              <View style={styles.applicantAvatar}>
                <Text style={styles.applicantAvatarText}>
                  {applicant.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'ST'}
                </Text>
              </View>
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>{applicant.full_name || 'Student Name'}</Text>
                <Text style={styles.applicantUniversity}>{applicant.university_name || 'University'}</Text>
                <Text style={styles.applicantMajor}>
                  {applicant.major || 'Major'} • {applicant.year_of_study || 'Year'}
                </Text>
              </View>
              <View style={[
                styles.matchBadge,
                applicant.match_percentage >= 90 ? styles.matchHigh :
                applicant.match_percentage >= 75 ? styles.matchGood :
                applicant.match_percentage >= 60 ? styles.matchMedium : styles.matchLow
              ]}>
                <Text style={styles.matchBadgeText}>{applicant.match_percentage}%</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.applicantDetails}>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>GPA:</Text>
                <Text style={styles.applicantDetailValue}>{applicant.gpa || 'N/A'}</Text>
              </View>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>Applied:</Text>
                <Text style={styles.applicantDetailValue}>
                  {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
              </View>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>Position:</Text>
                <Text style={styles.applicantDetailValue}>{applicant.internship_title || 'N/A'}</Text>
              </View>
            </View>

            {/* Skills */}
            {applicant.matched_skills && applicant.matched_skills.length > 0 && (
              <View style={styles.applicantSkills}>
                <Text style={styles.skillsLabel}>Top Skills:</Text>
                <View style={styles.skillsTags}>
                  {applicant.matched_skills.slice(0, 4).map((skill: string, idx: number) => (
                    <Text key={idx} style={styles.skillTag}>{skill}</Text>
                  ))}
                  {applicant.matched_skills.length > 4 && (
                    <Text style={styles.skillTag}>+{applicant.matched_skills.length - 4} more</Text>
                  )}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.applicantActions}>
              <TouchableOpacity
                style={[styles.applicantActionButton, styles.acceptButton]}
                onPress={() => handleAcceptApplicant(applicant.id, applicant.student_id)}
              >
                <Text style={styles.acceptButtonText}>✓ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applicantActionButton, styles.rejectButton]}
                onPress={() => handleRejectApplicant(applicant.id)}
              >
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // Render Accepted Students Tab
  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Accepted Students</Text>
      <Text style={styles.sectionSubtitle}>Students who have been accepted for your internships</Text>

      {/* Internship Filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Filter by Internship</Text>
        <TouchableOpacity
          style={styles.filterSelectButton}
          onPress={() => setShowAcceptedInternshipModal(true)}
        >
          <Text style={styles.filterSelectText}>
            {selectedAcceptedInternshipFilter === 'all' 
              ? `All Internships (${acceptedApplicants.length})` 
              : internships.find(i => i.id == selectedAcceptedInternshipFilter)?.title || 'Select'}
          </Text>
          <Text style={styles.filterSelectArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Accepted Count */}
      <View style={styles.countBanner}>
        <Text style={styles.countText}>
          {filteredAcceptedApplicants.length} accepted student{filteredAcceptedApplicants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Accepted Students List */}
      {filteredAcceptedApplicants.length === 0 ? (
        <View style={styles.manageEmptyState}>
          <Text style={styles.emptyStateIcon}>✓</Text>
          <Text style={styles.emptyStateTitle}>
            {acceptedApplicants.length === 0 ? 'No Accepted Applicants Yet' : 'No Applicants for This Internship'}
          </Text>
          <Text style={styles.emptyStateText}>
            {acceptedApplicants.length === 0 
              ? 'Accepted applicants will appear here' 
              : 'Try selecting a different internship'}
          </Text>
        </View>
      ) : (
        filteredAcceptedApplicants.map((applicant, index) => (
          <View key={applicant.id || index} style={styles.acceptedCard}>
            {/* Accepted Badge */}
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedBadgeText}>✓ Accepted</Text>
            </View>

            {/* Header */}
            <View style={styles.applicantHeader}>
              <View style={styles.applicantAvatar}>
                <Text style={styles.applicantAvatarText}>
                  {applicant.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'ST'}
                </Text>
              </View>
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>{applicant.full_name || 'Student Name'}</Text>
                <Text style={styles.applicantUniversity}>{applicant.university_name || 'University'}</Text>
                <Text style={styles.applicantMajor}>
                  {applicant.major || 'Major'} • {applicant.year_of_study || 'Year'}
                </Text>
              </View>
              <View style={[
                styles.matchBadge,
                applicant.match_percentage >= 90 ? styles.matchHigh :
                applicant.match_percentage >= 75 ? styles.matchGood :
                applicant.match_percentage >= 60 ? styles.matchMedium : styles.matchLow
              ]}>
                <Text style={styles.matchBadgeText}>{applicant.match_percentage}%</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.applicantDetails}>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>GPA:</Text>
                <Text style={styles.applicantDetailValue}>{applicant.gpa || 'N/A'}</Text>
              </View>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>Accepted Date:</Text>
                <Text style={styles.applicantDetailValue}>
                  {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
              </View>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>Position:</Text>
                <Text style={styles.applicantDetailValue}>{applicant.internship_title || 'N/A'}</Text>
              </View>
              <View style={styles.applicantDetailRow}>
                <Text style={styles.applicantDetailLabel}>Email:</Text>
                <Text style={styles.applicantDetailValue}>{applicant.email || 'N/A'}</Text>
              </View>
            </View>

            {/* Skills */}
            {applicant.matched_skills && applicant.matched_skills.length > 0 && (
              <View style={styles.applicantSkills}>
                <Text style={styles.skillsLabel}>Top Skills:</Text>
                <View style={styles.skillsTags}>
                  {applicant.matched_skills.slice(0, 4).map((skill: string, idx: number) => (
                    <Text key={idx} style={styles.skillTag}>{skill}</Text>
                  ))}
                  {applicant.matched_skills.length > 4 && (
                    <Text style={styles.skillTag}>+{applicant.matched_skills.length - 4} more</Text>
                  )}
                </View>
              </View>
            )}

            {/* Upload Certificate Button */}
            {applicant.final_report && (
              <View style={styles.certificateSection}>
                <TouchableOpacity
                  style={[
                    styles.certificateButton,
                    applicant.final_report.certificate_file && styles.certificateButtonUploaded
                  ]}
                  onPress={() => {
                    setSelectedReport({ 
                      ...applicant.final_report, 
                      student_name: applicant.full_name 
                    });
                    setShowReportModal(true);
                  }}
                >
                  <Text style={styles.certificateButtonIcon}>📄</Text>
                  <Text style={styles.certificateButtonText}>
                    {applicant.final_report.certificate_file 
                      ? '✓ Certificate Uploaded' 
                      : 'View Report & Upload Certificate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  // Render Messages Tab
  const renderMessages = () => {
    if (contacts.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>No Trainers Yet</Text>
            <Text style={styles.emptyStateText}>
              Add trainers to your company to start chatting with them
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatSidebar}>
          <Text style={styles.chatSidebarTitle}>Trainers</Text>
          <ScrollView>
            {contacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactItem,
                  selectedContactId === contact.id && styles.contactItemActive,
                ]}
                onPress={() => setSelectedContactId(contact.id)}
              >
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRole}>{contact.role}</Text>
                {contact.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{contact.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.chatMain}>
          {!selectedContactId ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>👈</Text>
              <Text style={styles.emptyStateTitle}>Select a Trainer</Text>
              <Text style={styles.emptyStateText}>
                Choose a trainer from the list to start chatting
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.chatHeaderRow}>
                <Text style={styles.chatHeaderTitle}>
                  {contacts.find(c => c.id === selectedContactId)?.name || 'Chat'}
                </Text>
                <Text style={styles.chatSubtitle}>Real-time messaging with Supabase</Text>
              </View>

              <ScrollView
                style={styles.messagesList}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyMessagesContainer}>
                    <Text style={styles.emptyMessagesText}>No messages yet. Start the conversation!</Text>
                  </View>
                ) : (
                  messages.map(msg => {
                    const isFromMe = msg.sender_id === companyData.id;
                    const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    });
                    return (
                      <View
                        key={msg.id}
                        style={[
                          styles.messageItem,
                          isFromMe ? styles.messageItemSent : styles.messageItemReceived,
                        ]}
                      >
                        {!isFromMe && (
                          <View style={styles.messageAvatar}>
                            <Text style={styles.avatarText}>
                              {contacts.find(c => c.id === msg.sender_id)?.name?.charAt(0)?.toUpperCase() || 'T'}
                            </Text>
                          </View>
                        )}
                        
                        <View
                          style={[
                            styles.messageBubble,
                            isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              isFromMe ? styles.messageTextSent : styles.messageTextReceived,
                            ]}
                          >
                            {msg.message}
                          </Text>
                          <Text 
                            style={[
                              styles.messageTime,
                              isFromMe ? styles.messageTimeSent : styles.messageTimeReceived,
                            ]}
                          >
                            {time}
                          </Text>
                        </View>

                        {isFromMe && (
                          <View style={styles.messageAvatar}>
                            <Text style={styles.avatarText}>
                              {companyData.name?.charAt(0)?.toUpperCase() || 'C'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <TouchableOpacity
                  style={styles.messageSendButton}
                  onPress={handleSendMessage}
                >
                  <Text style={styles.messageSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // Load applied students for interviews
  const loadAppliedStudents = async (internshipId: string) => {
    try {
      console.log('📋 Loading applied students for internship:', internshipId);
      const response = await fetch(`${baseUrl}/api/matching/internship/${internshipId}/applied`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Applied students loaded:', data.applicants?.length || 0);
        setAppliedStudents(data.applicants || []);
      } else {
        console.log('⚠️ No applied students found');
        setAppliedStudents([]);
      }
    } catch (error) {
      console.error('💥 Error loading applied students:', error);
      setAppliedStudents([]);
    }
  };

  // Schedule interview
  const handleScheduleInterview = async () => {
    if (!interviewForm.student_id || !interviewForm.internship_id || !interviewForm.interview_date || !interviewForm.interview_time) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSchedulingInterview(true);
      const response = await fetch(`${baseUrl}/api/interviews`, {
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
        Alert.alert('Success', 'Interview scheduled successfully! Student has been notified.');
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
        setAppliedStudents([]);
      } else {
        Alert.alert('Error', data.message || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      Alert.alert('Error', 'Failed to schedule interview');
    } finally {
      setSchedulingInterview(false);
    }
  };

  // Load internships when switching to interviews tab
  useEffect(() => {
    if (activeTab === 'interviews' && companyData.email) {
      loadInternships();
    }
  }, [activeTab, companyData.email]);

  // Render Interviews Tab
  const renderInterviews = () => {
    const interviewTypeOptions = [
      { label: 'In-Person', value: 'in-person' },
      { label: 'Online', value: 'online' },
      { label: 'Phone', value: 'phone' },
    ];

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Schedule Interviews</Text>
        <Text style={styles.sectionSubtitle}>Schedule interviews with applied students</Text>

        {/* Select Internship */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Select Internship *</Text>
          <TouchableOpacity
            style={styles.filterSelectButton}
            onPress={() => setShowInternshipSelectModal(true)}
          >
            <Text style={styles.filterSelectText}>
              {selectedInternshipForInterview
                ? internships.find(i => String(i.id) === selectedInternshipForInterview)?.title || 'Select an internship'
                : 'Select an internship'}
            </Text>
            <Text style={styles.filterSelectArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Interview Form */}
        {selectedInternshipForInterview && appliedStudents.length > 0 && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Schedule Interview</Text>

            {/* Select Student */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Student *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => {
                  Alert.alert(
                    'Select Student',
                    'Choose a student to schedule interview',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      ...appliedStudents.map(student => ({
                        text: `${student.full_name} - ${student.email}`,
                        onPress: () => setInterviewForm({ ...interviewForm, student_id: String(student.student_id) })
                      }))
                    ]
                  );
                }}
              >
                <Text style={interviewForm.student_id ? styles.formInputText : styles.formInputPlaceholder}>
                  {interviewForm.student_id
                    ? appliedStudents.find(s => String(s.student_id) === interviewForm.student_id)?.full_name || 'Choose a student'
                    : 'Choose a student'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Interview Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Interview Date *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD (e.g., 2024-12-15)"
                placeholderTextColor="#9ca3af"
                value={interviewForm.interview_date}
                onChangeText={(text) => setInterviewForm({ ...interviewForm, interview_date: text })}
              />
            </View>

            {/* Interview Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Interview Time *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="HH:MM (e.g., 14:30)"
                placeholderTextColor="#9ca3af"
                value={interviewForm.interview_time}
                onChangeText={(text) => setInterviewForm({ ...interviewForm, interview_time: text })}
              />
            </View>

            {/* Interview Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Interview Type *</Text>
              <TouchableOpacity
                style={styles.filterSelectButton}
                onPress={() => setShowInterviewTypeModal(true)}
              >
                <Text style={styles.filterSelectText}>
                  {interviewTypeOptions.find(opt => opt.value === interviewForm.interview_type)?.label || 'Select type'}
                </Text>
                <Text style={styles.filterSelectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Interview Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {interviewForm.interview_type === 'online' ? 'Meeting Link' : 'Location'}
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder={interviewForm.interview_type === 'online' ? 'Enter meeting link' : 'Enter location'}
                placeholderTextColor="#9ca3af"
                value={interviewForm.interview_location}
                onChangeText={(text) => setInterviewForm({ ...interviewForm, interview_location: text })}
              />
            </View>

            {/* Additional Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Any additional information for the student..."
                placeholderTextColor="#9ca3af"
                value={interviewForm.notes}
                onChangeText={(text) => setInterviewForm({ ...interviewForm, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, schedulingInterview && styles.submitButtonDisabled]}
              onPress={handleScheduleInterview}
              disabled={schedulingInterview}
            >
              <Text style={styles.submitButtonText}>
                {schedulingInterview ? 'Scheduling...' : 'Schedule Interview'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {selectedInternshipForInterview && appliedStudents.length === 0 && (
          <View style={styles.manageEmptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No Applied Students</Text>
            <Text style={styles.emptyStateText}>
              There are no students who have applied to this internship yet.
            </Text>
          </View>
        )}

        {/* Internship Select Modal */}
        <Modal
          visible={showInternshipSelectModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInternshipSelectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Internship</Text>
              <Text style={styles.modalSubtitle}>Choose an internship to view applied students</Text>
              <ScrollView style={styles.modalScrollView}>
                {internships.length > 0 ? (
                  internships.map((internship) => (
                    <TouchableOpacity
                      key={internship.id}
                      style={[
                        styles.modalOption,
                        selectedInternshipForInterview === String(internship.id) && styles.modalOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedInternshipForInterview(String(internship.id));
                        loadAppliedStudents(String(internship.id));
                        setInterviewForm({ ...interviewForm, internship_id: String(internship.id) });
                        setShowInternshipSelectModal(false);
                      }}
                    >
                      <View style={styles.modalOptionContent}>
                        <Text style={styles.modalOptionText}>{internship.title}</Text>
                        {internship.specialization && (
                          <Text style={styles.modalOptionSubtext}>{internship.specialization}</Text>
                        )}
                      </View>
                      {selectedInternshipForInterview === String(internship.id) && (
                        <Text style={styles.modalOptionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.modalEmptyState}>
                    <Text style={styles.modalEmptyText}>No internships available</Text>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInternshipSelectModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Interview Type Modal */}
        <Modal
          visible={showInterviewTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInterviewTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Interview Type</Text>
              {interviewTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    interviewForm.interview_type === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setInterviewForm({ ...interviewForm, interview_type: option.value });
                    setShowInterviewTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {interviewForm.interview_type === option.value && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInterviewTypeModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render Meetings Tab
  const renderMeetings = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Meetings</Text>
      <Text style={styles.placeholderText}>Video meetings will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'profile':
        return renderProfile();
      case 'post':
        return renderPost();
      case 'manage':
        return renderManage();
      case 'applicants':
        return renderApplicants();
      case 'details':
        return renderDetails();
      case 'messages':
        return renderMessages();
      case 'interviews':
        return renderInterviews();
      case 'meetings':
        return renderMeetings();
      default:
        return renderDashboard();
    }
  };

  return (
    <View style={styles.container}>
      {/* Drawer Menu Modal */}
      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawerContainer} onStartShouldSetResponder={() => true}>
            <DrawerMenu
              userType="company"
              userData={companyData}
              activeMenu={activeTab}
              onMenuSelect={(menu) => {
                handleTabChange(menu as TabKey);
                setDrawerVisible(false);
              }}
              onLogout={() => {
                setDrawerVisible(false);
                onLogout?.();
              }}
              unreadCount={totalUnreadMessages}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Company Dashboard</Text>
            <Text style={styles.headerSubtitle}>{companyData.name || userData?.full_name}</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Specialization Modal */}
      <Modal
        visible={showSpecializationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecializationModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpecializationModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialization</Text>
              <TouchableOpacity onPress={() => setShowSpecializationModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={specializationOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleInternshipInputChange('specialization', item);
                    setShowSpecializationModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    internshipData.specialization === item && styles.modalOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                  {internshipData.specialization === item && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={statusOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleInternshipInputChange('status', item);
                    setShowStatusModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    internshipData.status === item && styles.modalOptionTextSelected
                  ]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                  {internshipData.status === item && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Work Mode Modal */}
      <Modal
        visible={showWorkModeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkModeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWorkModeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Work Mode</Text>
              <TouchableOpacity onPress={() => setShowWorkModeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={workModeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleInternshipInputChange('work_mode', item);
                    setShowWorkModeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    internshipData.work_mode === item && styles.modalOptionTextSelected
                  ]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                  {internshipData.work_mode === item && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Internship Filter Modal */}
      <Modal
        visible={showInternshipFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInternshipFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInternshipFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Internship</Text>
              <TouchableOpacity onPress={() => setShowInternshipFilterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 'all', title: 'All Positions' }, ...internships]}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedInternshipFilter == item.id && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedInternshipFilter(item.id);
                    setShowInternshipFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedInternshipFilter == item.id && styles.modalOptionTextSelected
                  ]}>
                    {item.title}
                  </Text>
                  {selectedInternshipFilter == item.id && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Match Score Filter Modal */}
      <Modal
        visible={showMatchScoreModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMatchScoreModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMatchScoreModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Match Score</Text>
              <TouchableOpacity onPress={() => setShowMatchScoreModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={matchScoreOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    matchScoreFilter === item.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setMatchScoreFilter(item.value);
                    setShowMatchScoreModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    matchScoreFilter === item.value && styles.modalOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {matchScoreFilter === item.value && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Accepted Internship Filter Modal */}
      <Modal
        visible={showAcceptedInternshipModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAcceptedInternshipModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAcceptedInternshipModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Internship</Text>
              <TouchableOpacity onPress={() => setShowAcceptedInternshipModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { id: 'all', title: `All Internships (${acceptedApplicants.length})` },
                ...internships.filter(i => acceptedApplicants.some(a => a.internship_id === i.id))
                  .map(i => ({
                    ...i,
                    title: `${i.title} (${acceptedApplicants.filter(a => a.internship_id === i.id).length})`
                  }))
              ]}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedAcceptedInternshipFilter == item.id && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedAcceptedInternshipFilter(item.id);
                    setShowAcceptedInternshipModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedAcceptedInternshipFilter == item.id && styles.modalOptionTextSelected
                  ]}>
                    {item.title}
                  </Text>
                  {selectedAcceptedInternshipFilter == item.id && (
                    <Text style={styles.modalOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* View Internship Modal */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Internship Details</Text>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewingInternship && (
              <ScrollView style={{ padding: 20 }}>
                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Title</Text>
                  <Text style={styles.viewModalValue}>{viewingInternship.title}</Text>
                </View>
                
                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Specialization</Text>
                  <Text style={styles.viewModalValue}>{viewingInternship.specialization || 'Not specified'}</Text>
                </View>

                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    viewingInternship.status === 'open' && styles.statusOpen,
                    viewingInternship.status === 'closed' && styles.statusClosed,
                    viewingInternship.status === 'pending' && styles.statusPending,
                  ]}>
                    <Text style={styles.statusText}>{viewingInternship.status}</Text>
                  </View>
                </View>

                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Capacity</Text>
                  <Text style={styles.viewModalValue}>{viewingInternship.capacity}</Text>
                </View>

                {viewingInternship.min_gpa && (
                  <View style={styles.viewModalSection}>
                    <Text style={styles.viewModalLabel}>Minimum GPA</Text>
                    <Text style={styles.viewModalValue}>{viewingInternship.min_gpa}</Text>
                  </View>
                )}

                {viewingInternship.work_mode && (
                  <View style={styles.viewModalSection}>
                    <Text style={styles.viewModalLabel}>Work Mode</Text>
                    <Text style={styles.viewModalValue}>
                      {viewingInternship.work_mode.charAt(0).toUpperCase() + viewingInternship.work_mode.slice(1)}
                    </Text>
                  </View>
                )}

                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Description</Text>
                  <Text style={styles.viewModalValue}>{viewingInternship.description}</Text>
                </View>

                {viewingInternship.requirements && (
                  <View style={styles.viewModalSection}>
                    <Text style={styles.viewModalLabel}>Requirements</Text>
                    <Text style={styles.viewModalValue}>{viewingInternship.requirements}</Text>
                  </View>
                )}

                {viewingInternship.trainers && viewingInternship.trainers.length > 0 && (
                  <View style={styles.viewModalSection}>
                    <Text style={styles.viewModalLabel}>Assigned Trainers</Text>
                    <View style={styles.trainersList}>
                      {viewingInternship.trainers.map((trainer: any, index: number) => (
                        <Text key={index} style={styles.trainerBadge}>{trainer.full_name}</Text>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalLabel}>Posted Date</Text>
                  <Text style={styles.viewModalValue}>
                    {new Date(viewingInternship.created_at).toLocaleDateString('en-GB')}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Final Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Final Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedReport && (
              <ScrollView style={{ padding: 20 }}>
                {/* Trainer Info */}
                <View style={styles.trainerInfoSection}>
                  <Text style={styles.trainerInfoText}>
                    <Text style={styles.trainerInfoLabel}>Trainer: </Text>
                    {selectedReport.trainer_name || 'N/A'}
                  </Text>
                  <Text style={styles.trainerInfoText}>
                    <Text style={styles.trainerInfoLabel}>Submitted: </Text>
                    {new Date(selectedReport.created_at || selectedReport.submitted_at).toLocaleDateString('en-GB')}
                  </Text>
                </View>

                {/* Overall Performance */}
                <View style={styles.reportSection}>
                  <Text style={styles.reportSectionTitle}>Overall Performance</Text>
                  <View style={styles.performanceBox}>
                    <Text style={styles.performanceText}>
                      {selectedReport.overall_performance || 'No comments provided'}
                    </Text>
                  </View>
                </View>

                {/* Performance Ratings */}
                <View style={styles.reportSection}>
                  <Text style={styles.reportSectionTitle}>Performance Ratings</Text>
                  <View style={styles.ratingsGrid}>
                    {[
                      { label: 'Technical Skills', value: selectedReport.technical_skills_rating, color: '#3b82f6' },
                      { label: 'Communication', value: selectedReport.communication_rating, color: '#8b5cf6' },
                      { label: 'Teamwork', value: selectedReport.teamwork_rating, color: '#10b981' },
                      { label: 'Problem Solving', value: selectedReport.problem_solving_rating, color: '#f59e0b' },
                      { label: 'Attendance', value: selectedReport.attendance_rating, color: '#ef4444' }
                    ].map((rating, index) => (
                      <View key={index} style={styles.ratingCard}>
                        <Text style={styles.ratingLabel}>{rating.label}</Text>
                        <Text style={[styles.ratingValue, { color: rating.color }]}>
                          {rating.value || 'N/A'}
                        </Text>
                        <Text style={styles.ratingSubtext}>out of 10</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Overall Rating */}
                {selectedReport.overall_rating && (
                  <View style={styles.overallRatingSection}>
                    <Text style={styles.overallRatingLabel}>Overall Rating</Text>
                    <Text style={styles.overallRatingValue}>{selectedReport.overall_rating}</Text>
                    <Text style={styles.overallRatingSubtext}>out of 10</Text>
                  </View>
                )}

                {/* Certificate Section */}
                {selectedReport.certificate_file ? (
                  <View style={styles.certificateUploadedSection}>
                    <Text style={styles.certificateUploadedTitle}>✓ Certificate Uploaded</Text>
                    <Text style={styles.certificateUploadedText}>
                      Uploaded on {new Date(selectedReport.certificate_uploaded_at).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.certificateUploadSection}>
                    <Text style={styles.certificateUploadTitle}>Upload Certificate</Text>
                    <Text style={styles.certificateUploadText}>
                      Upload the training completion certificate for this student
                    </Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => {
                        Alert.alert('Upload', 'Certificate upload feature coming soon in mobile app');
                      }}
                    >
                      <Text style={styles.uploadButtonText}>📎 Choose File</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: '75%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  // Header styles
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    flex: 1,
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
  },
  // Dashboard specific styles
  dashboardHeader: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // KPI Cards
  kpiContainer: {
    gap: 16,
  },
  gradientCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  blueGradient: {
    backgroundColor: '#3b82f6',
  },
  greenGradient: {
    backgroundColor: '#10b981',
  },
  purpleGradient: {
    backgroundColor: '#8b5cf6',
  },
  orangeGradient: {
    backgroundColor: '#f59e0b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.95,
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
  },
  cardDetails: {
    gap: 6,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetailLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  cardDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardFooterLabel: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.85,
  },
  cardFooterValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.85,
  },
  // Circular stat for trainers card
  circularStat: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  circularStatInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(109, 40, 217, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularStatValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  circularStatLabel: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  // Charts
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 220,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  // Trainer Requests Section
  trainerRequestsSection: {
    marginTop: 32,
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  trainerRequestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trainerRequestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trainerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trainerAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  trainerEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  trainerDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  trainerRequestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Profile Styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  messageCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  messageText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPreview: {
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoBadges: {
    flex: 1,
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  uploadLogoButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadLogoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  formRow: {
    flexDirection: 'row',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelBtnText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: '#3b82f6',
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Trainer Selection Styles
  trainerCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  trainerSpec: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  selectedCount: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#1f2937',
  },
  selectButtonPlaceholder: {
    fontSize: 15,
    color: '#9ca3af',
  },
  selectButtonArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalOptionCheck: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
  // Manage Internships Styles
  manageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  btnPostNew: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPostNewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  filterButtonArrow: {
    fontSize: 10,
    color: '#6b7280',
  },
  countBanner: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  internshipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  internshipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  internshipTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  internshipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  internshipId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: '#d1fae5',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  internshipCardBody: {
    gap: 8,
    marginBottom: 12,
  },
  internshipDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  internshipDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    minWidth: 100,
  },
  internshipDetailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  trainersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  trainerBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  internshipCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardViewButton: {
    backgroundColor: '#dbeafe',
  },
  cardEditButton: {
    backgroundColor: '#fef3c7',
  },
  cardDeleteButton: {
    backgroundColor: '#fee2e2',
  },
  cardActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  manageEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  viewModalSection: {
    marginBottom: 20,
  },
  viewModalLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  viewModalValue: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  cancelEditButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  cancelEditButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  // Applicants Styles
  applicantsFilters: {
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  filterSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterSelectText: {
    fontSize: 15,
    color: '#1f2937',
  },
  filterSelectArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  applicantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  applicantAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  applicantUniversity: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  applicantMajor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  matchHigh: {
    backgroundColor: '#d1fae5',
  },
  matchGood: {
    backgroundColor: '#dbeafe',
  },
  matchMedium: {
    backgroundColor: '#fef3c7',
  },
  matchLow: {
    backgroundColor: '#fee2e2',
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  applicantDetails: {
    gap: 8,
    marginBottom: 12,
  },
  applicantDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applicantDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  applicantDetailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  applicantSkills: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  skillsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  applicantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  applicantActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#d1fae5',
  },
  acceptButtonText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
  },
  // Accepted Students Styles
  acceptedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#d1fae5',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  certificateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateButtonUploaded: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  certificateButtonIcon: {
    fontSize: 18,
  },
  certificateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Report Modal Styles
  trainerInfoSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  trainerInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  trainerInfoLabel: {
    fontWeight: '600',
    color: '#111827',
  },
  reportSection: {
    marginBottom: 20,
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  performanceBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 22,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  ratingValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
  },
  ratingSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  overallRatingSection: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  overallRatingLabel: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    marginBottom: 8,
  },
  overallRatingValue: {
    fontSize: 44,
    fontWeight: '700',
    color: '#78350f',
  },
  overallRatingSubtext: {
    fontSize: 14,
    color: '#92400e',
  },
  certificateUploadedSection: {
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  certificateUploadedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  certificateUploadedText: {
    fontSize: 14,
    color: '#047857',
  },
  certificateUploadSection: {
    backgroundColor: '#f3f4f6',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  certificateUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  certificateUploadText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Chat Styles
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatSidebar: {
    width: 120,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  chatSidebarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  contactItemActive: {
    backgroundColor: '#eff6ff',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 10,
    color: '#9ca3af',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  chatMain: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatHeaderRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  chatSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageItem: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageItemSent: {
    justifyContent: 'flex-end',
  },
  messageItemReceived: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleSent: {
    backgroundColor: '#d4f4dd',
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextSent: {
    color: '#1b5e20',
  },
  messageTextReceived: {
    color: '#424242',
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
  },
  messageTimeSent: {
    color: '#2e7d32',
    textAlign: 'right',
  },
  messageTimeReceived: {
    color: '#757575',
    textAlign: 'left',
  },
  messageInputRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  messageSendButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageSendText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyMessagesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Interview Styles
  formInputText: {
    fontSize: 15,
    color: '#1f2937',
  },
  formInputPlaceholder: {
    fontSize: 15,
    color: '#9ca3af',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  // Modal Styles Enhancements
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
    width: '100%',
  },
  modalOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  modalOptionCheck: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '700',
    marginLeft: 8,
  },
  modalEmptyState: {
    padding: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Interview Form Styles
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CompanyDashboardScreen;
