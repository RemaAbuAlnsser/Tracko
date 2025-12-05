import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  RefreshControl,
  FlatList,
  Button
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DrawerMenu from '../components/DrawerMenu';
import {
  loadChatMessages,
  sendChatMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount,
} from '../utils/chatService';


type TrainerDashboardScreenProps = {
  userData?: any;
  onLogout?: () => void;
  route?: any;
};

type TabKey = 'dashboard' | 'profile' | 'internships' | 'students' | 'reports' | 'schedule' | 'notifications' | 'messages' | 'plans';

const TrainerDashboardScreen: React.FC<TrainerDashboardScreenProps> = ({ userData, onLogout, route }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [trainerData, setTrainerData] = useState<{
    id: number | null;
    specialization: string;
    experience_years: number;
    bio: string;
    linkedin_url: string;
    github_url: string;
    hourly_rate: number;
    max_trainees: number;
    status: string;
    profile_image: string;
    user: {
      name: string;
      email: string;
    };
  
  }>({
    id: null,
    specialization: '',
    experience_years: 0,
    bio: '',
    linkedin_url: '',
    github_url: '',
    hourly_rate: 0,
    max_trainees: 5,
    status: 'active',
    profile_image: '',
    user: {
      name: '',
      email: ''
    }
  });
  
  const [dashboardStats, setDashboardStats] = useState({
    internshipsCount: 0,
    studentsCount: 0,
    unreadNotificationsCount: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedTrainerData, setEditedTrainerData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [internshipSearch, setInternshipSearch] = useState('');
  const [internshipStatus, setInternshipStatus] = useState<'all' | 'open' | 'active' | 'closed'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatus, setStudentStatus] = useState<'all' | 'in_training' | 'complete'>('all');
  
  // Task submissions states
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [preselectedStudentId, setPreselectedStudentId] = useState<number | null>(null);
  
  // Reports states
  const [newReport, setNewReport] = useState({
    student_id: 0,
    technical_skills: 5,
    communication_skills: 5,
    problem_solving: 5,
    teamwork: 5,
    performance_rating: 5,
    comments: ''
  });
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  
  // Schedule states
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    event_type: 'training',
    start_time: new Date(),
    end_time: new Date(),
    internship_id: '',
    student_ids: [] as string[]
  });
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [showInternshipDropdown, setShowInternshipDropdown] = useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  
  // Training Plans states
  const [newPlan, setNewPlan] = useState({
    internship_id: '',
    title: '',
    description: '',
    duration_weeks: 4,
    start_date: '',
    end_date: '',
    status: 'draft'
  });
  const [planWeeks, setPlanWeeks] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPlanWeeksModal, setShowPlanWeeksModal] = useState(false);
  
  // Chat/Messages state
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [showContactsList, setShowContactsList] = useState(true);
  
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';
  
  // Check for deep link navigation
  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params]);

  // Load reports and students when reports tab is active
  useEffect(() => {
    if (activeTab === 'reports' && trainerData.id) {
      loadReports();
      if (students.length === 0) {
        loadStudents();
      }
      // Auto-select preselected student
      if (preselectedStudentId !== null) {
        setNewReport(prev => ({ ...prev, student_id: preselectedStudentId }));
        setPreselectedStudentId(null); // Clear after using
      }
    }
  }, [activeTab, trainerData.id, preselectedStudentId]);

  // Load plans and internships when plans tab is active
  useEffect(() => {
    if (activeTab === 'plans' && trainerData.id) {
      console.log('Plans tab active, loading plans...');
      loadPlans();
      if (internships.length === 0) {
        loadInternships();
      }
    }
  }, [activeTab, trainerData.id]);

  // Chat useEffect hooks
  useEffect(() => {
    if (activeTab === 'messages' && trainerData.id) {
      loadContacts();
    }
  }, [activeTab, trainerData.id]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!userData?.id || activeTab !== 'messages') return;

    const handleNewMessage = (newMsg: any) => {
      console.log('📨 New message received:', newMsg);
      
      // If message is for current conversation, add it to messages
      if (selectedContactId && 
          (Number(newMsg.sender_id) === Number(selectedContactId) || 
           Number(newMsg.receiver_id) === Number(selectedContactId))) {
        setMessages(prev => {
          // Check if message already exists by id and created_at
          if (prev.some(msg => msg.id === newMsg.id && msg.created_at === newMsg.created_at)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Mark as read if it's from the selected contact
        if (Number(newMsg.sender_id) === Number(selectedContactId)) {
          markMessagesAsRead(selectedContactId, userData.id);
        }
      }
      
      // Reload contacts to update unread counts
      loadContacts();
    };

    const channel = subscribeToMessages(userData.id, handleNewMessage);
    setMessagesChannel(channel);

    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [userData, activeTab, selectedContactId]);

  // Load trainer data
  const loadTrainerData = async () => {
    if (!userData?.id) {
      console.log('❌ No userData.id found');
      return;
    }

    console.log('🔄 Loading trainer data for user ID:', userData.id);
    console.log('🌐 API URL:', `${baseUrl}/api/trainers/user/${userData.id}`);

    try {
      setRefreshing(true);
      const response = await fetch(`${baseUrl}/api/trainers/user/${userData.id}`);
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('📦 Response data:', data);
          
          if (data.success && data.trainer) {
            console.log('✅ Trainer data loaded successfully!');
            console.log('👤 Trainer:', data.trainer);
            setTrainerData(prev => ({
              ...data.trainer,
              user: data.trainer.user || { name: '', email: userData.email }
            }));
            
            // Load all dashboard data
            console.log('📥 Loading dashboard data for trainer ID:', data.trainer.id);
            await Promise.all([
              loadDashboardStats(data.trainer.id),
              loadUpcomingSessions(data.trainer.id),
              loadRecentActivity(data.trainer.id)
            ]);
          } else {
            console.log('⚠️ Trainer API returned success: false');
            console.log('📄 Full response:', JSON.stringify(data, null, 2));
            // Use demo trainer data
            console.log('📝 Creating demo trainer data');
            const demoTrainer = {
              id: 1,
              specialization: 'Software Development',
              experience_years: 5,
              bio: 'Experienced trainer in software development',
              linkedin_url: '',
              github_url: '',
              hourly_rate: 50,
              max_trainees: 10,
              status: 'active',
              profile_image: '',
              user: { name: userData?.full_name || 'Trainer', email: userData?.email || '' }
            };
            setTrainerData(demoTrainer);
            // Load demo stats
            await loadDashboardStats(1);
          }
        } catch (e) {
          console.error('Error parsing trainer data response:', e);
          setMessage({ text: 'Failed to parse trainer data', type: 'error' });
        }
      } else {
        console.error('Failed to load trainer data - Status:', response.status);
        // Use demo trainer data
        console.log('📝 Creating demo trainer data due to API failure');
        const demoTrainer = {
          id: 1,
          specialization: 'Software Development',
          experience_years: 5,
          bio: 'Experienced trainer in software development',
          linkedin_url: '',
          github_url: '',
          hourly_rate: 50,
          max_trainees: 10,
          status: 'active',
          profile_image: '',
          user: { name: userData?.full_name || 'Trainer', email: userData?.email || '' }
        };
        setTrainerData(demoTrainer);
        await loadDashboardStats(1);
      }
    } catch (error) {
      console.error('❌ Error loading trainer data:', error);
      // Use demo trainer data on error
      console.log('📝 Creating demo trainer data due to error');
      const demoTrainer = {
        id: 1,
        specialization: 'Software Development',
        experience_years: 5,
        bio: 'Experienced trainer in software development',
        linkedin_url: '',
        github_url: '',
        hourly_rate: 50,
        max_trainees: 10,
        status: 'active',
        profile_image: '',
        user: { name: userData?.full_name || 'Trainer', email: userData?.email || '' }
      };
      setTrainerData(demoTrainer);
      await loadDashboardStats(1);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  // Load dashboard statistics
  const loadDashboardStats = async (trainerId: number) => {
    try {
      const [statsRes, reportsRes, plansRes] = await Promise.all([
        fetch(`${baseUrl}/api/trainers/${trainerId}/stats`),
        fetch(`${baseUrl}/api/trainers/${trainerId}/reports?status=pending`),
        fetch(`${baseUrl}/api/trainers/${trainerId}/plans?status=active`)
      ]);
      
      // Check if responses are OK before parsing JSON
      let statsData = { success: false, data: {} };
      let reportsData = { success: false, reports: [] };
      let plansData = { success: false, plans: [] };
      
      if (statsRes.ok) {
        try {
          statsData = await statsRes.json();
        } catch (e) {
          console.error('Error parsing stats response:', e);
        }
      } else {
        console.log('⚠️ Stats API failed with status:', statsRes.status);
      }
      
      if (reportsRes.ok) {
        try {
          reportsData = await reportsRes.json();
        } catch (e) {
          console.error('Error parsing reports response:', e);
        }
      } else {
        console.log('⚠️ Reports API failed with status:', reportsRes.status);
      }
      
      if (plansRes.ok) {
        try {
          plansData = await plansRes.json();
        } catch (e) {
          console.error('Error parsing plans response:', e);
        }
      } else {
        console.log('⚠️ Plans API failed with status:', plansRes.status);
      }
      
      if (statsData.success) {
        const newStats = {
          ...statsData.data,
          pendingReports: reportsData.success ? reportsData.reports?.length || 0 : 0,
          activePlans: plansData.success ? plansData.plans?.length || 0 : 0
        };
        console.log('📊 Dashboard Stats loaded:', newStats);
        setDashboardStats(prev => ({
          ...prev,
          ...newStats
        }));
      } else {
        // Use demo data if API fails
        console.log('⚠️ Stats API returned success: false - Using demo data');
        const demoStats = {
          internshipsCount: 3,
          studentsCount: 8,
          unreadNotificationsCount: 5
        };
        console.log('📊 Using demo stats:', demoStats);
        setDashboardStats(prev => ({
          ...prev,
          ...demoStats
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Use demo data on error
      console.log('📊 Error occurred - Using demo data');
      setDashboardStats(prev => ({
        ...prev,
        internshipsCount: 3,
        studentsCount: 8,
        unreadNotificationsCount: 5
      }));
    }
  };
  
  // Load upcoming sessions
  const loadUpcomingSessions = async (trainerId: number) => {
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `${baseUrl}/api/trainers/${trainerId}/sessions?start_date=${now}&limit=3`
      );
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            setUpcomingSessions(data.sessions || []);
            setDashboardStats(prev => ({
              ...prev,
              upcomingSessions: data.sessions?.length || 0
            }));
          }
        } catch (e) {
          console.error('Error parsing sessions response:', e);
        }
      }
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
    }
  };
  
  // Load recent activity
  const loadRecentActivity = async (trainerId: number) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/trainers/${trainerId}/activity?limit=5`
      );
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            setRecentActivity(data.activities || []);
          }
        } catch (e) {
          console.error('Error parsing activity response:', e);
        }
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };
  
  // Handle refresh
  const onRefresh = async () => {
    await loadTrainerData();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Navigate to different sections (using internal tabs only)
  const navigateTo = useCallback((tab: TabKey) => {
    handleTabChange(tab);
  }, []);

  // Load students
  const loadStudents = async () => {
    if (!trainerData.id) return;

    try {
      const response = await fetch(`${baseUrl}/api/trainers/${trainerData.id}/students`);
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            setStudents(data.students || []);
          }
        } catch (e) {
          console.error('Error parsing students response:', e);
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load internships
  const loadInternships = async () => {
    if (!trainerData.id) {
      console.log('❌ No trainer ID for loading internships');
      return;
    }

    console.log('🔄 Loading internships for trainer:', trainerData.id);

    try {
      const response = await fetch(`${baseUrl}/api/internships/trainer/${trainerData.id}`);
      
      console.log('📡 Internships response status:', response.status);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('📦 Internships data:', data);
          
          if (data.success) {
            console.log('✅ Loaded', data.internships?.length || 0, 'internships');
            setInternships(data.internships || []);
          } else {
            console.log('⚠️ Internships API returned success: false');
            setInternships([]);
          }
        } catch (e) {
          console.error('Error parsing internships response:', e);
        }
      } else {
        console.error('Failed to load internships - Status:', response.status);
        // Graceful fallback so UI still renders
        setInternships([]);
      }
    } catch (error) {
      console.error('Error loading internships:', error);
      setInternships([]);
    }
  };

  // Load reports
  const loadReports = async () => {
    if (!trainerData.id) {
      console.log('⚠️ Cannot load reports: trainerData.id is missing');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/reports/trainer/${trainerData.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports(data.reports || []);
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  // Load schedules
  const loadSchedules = async () => {
    if (!trainerData.id) return;

    try {
      const response = await fetch(`${baseUrl}/api/trainers/${trainerData.id}/schedules`);
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            setSchedules(data.schedules || []);
          }
        } catch (e) {
          console.error('Error parsing schedules response:', e);
        }
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    if (!userData?.id) return;

    try {
      const response = await fetch(`${baseUrl}/api/notifications/user/${userData.id}`);
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications || []);
          }
        } catch (e) {
          console.error('Error parsing notifications response:', e);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Load plans
  const loadPlans = async () => {
    if (!trainerData.id) {
      console.log('Cannot load plans: trainerData.id is missing');
      return;
    }

    try {
      console.log('Loading plans for trainer:', trainerData.id);
      const response = await fetch(`${baseUrl}/api/plans/trainer/${trainerData.id}`);
      console.log('Plans response status:', response.status);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('Plans data:', data);
          if (data.success) {
            setPlans(data.plans || []);
            console.log('Plans loaded:', data.plans?.length || 0);
          } else {
            console.log('Plans load failed:', data.message);
          }
        } catch (e) {
          console.error('Error parsing plans response:', e);
        }
      } else {
        console.log('Plans response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  // Chat/Messages functions
  const loadContacts = async () => {
    if (!trainerData.id) {
      console.log('⚠️ No trainerId available');
      return;
    }
    
    console.log('📋 Loading conversations for trainer:', trainerData.id);
    
    try {
      let allConversations: any[] = [];
      
      // Load students
      try {
        console.log('👥 Fetching students...');
        const studentsResponse = await fetch(`${baseUrl}/api/trainers/${trainerData.id}/students`);
        const studentsData = await studentsResponse.json();
        console.log('📥 Students data:', studentsData);
        
        if (studentsData.success && studentsData.students && studentsData.students.length > 0) {
          const studentsWithUnread = await Promise.all(
            studentsData.students.map(async (student: any) => {
              const unreadCount = await getUnreadCount(userData.id, student.user_id);
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
        const companyResponse = await fetch(`${baseUrl}/api/trainers/${trainerData.id}/company`);
        const companyData = await companyResponse.json();
        console.log('📥 Company data:', companyData);
        
        if (companyData.success && companyData.company) {
          const company = companyData.company;
          const unreadCount = await getUnreadCount(userData.id, company.user_id);
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
      setContacts(allConversations);
      
      // Calculate total unread messages
      const totalUnread = allConversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
      setTotalUnreadMessages(totalUnread);
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    }
  };

  const loadMessages = async (contactId: number) => {
    if (!userData?.id || !contactId) return;
    
    try {
      console.log('💬 Loading messages between:', userData.id, 'and:', contactId);
      const chatMessages = await loadChatMessages(userData.id, contactId);
      
      // Remove duplicate messages based on id and created_at
      const uniqueMessages = chatMessages.filter((msg: any, index: number, array: any[]) => {
        return array.findIndex((m: any) => m.id === msg.id && m.created_at === msg.created_at) === index;
      });
      
      console.log('🔍 Unique messages after filtering:', uniqueMessages.length, 'from', chatMessages.length);
      setMessages(uniqueMessages);
      await markMessagesAsRead(contactId, userData.id);
      
      // Update unread count for this contact to 0 and recalculate total
      setContacts(prev => prev.map(contact => 
        contact.user_id === contactId ? { ...contact, unread_count: 0 } : contact
      ));
      
      const updatedTotal = contacts.reduce((sum, contact) => {
        if (contact.user_id === contactId) return sum;
        return sum + (contact.unread_count || 0);
      }, 0);
      setTotalUnreadMessages(updatedTotal);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContactId || !userData?.id) return;

    const trimmed = newMessage.trim();

    try {
      setNewMessage('');
      const result = await sendChatMessage(userData.id, selectedContactId, trimmed);
      
      if (result.success && result.data && result.data[0]) {
        setMessages(prev => [...prev, result.data[0]]);
      } else {
        setNewMessage(trimmed);
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(trimmed);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Load student task submissions
  const loadStudentTasks = async (student: any) => {
    if (!trainerData.id) return;
    
    setSelectedStudent(student);
    setShowTasksModal(true);
    setLoadingTasks(true);
    
    try {
      // Get student's current training plan
      const plansResponse = await fetch(`${baseUrl}/api/plans/student/${student.student_id}`);
      const plansData = await plansResponse.json();
      
      let currentPlanId = null;
      if (plansData.success && plansData.plans && plansData.plans.length > 0) {
        const activePlan = plansData.plans.find((p: any) => p.status === 'active') || plansData.plans[0];
        currentPlanId = activePlan.id;
      }
      
      // Fetch submissions for current plan
      let url = `${baseUrl}/api/task-submissions/student/${student.student_id}/trainer/${trainerData.id}`;
      if (currentPlanId) {
        url += `?planId=${currentPlanId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTaskSubmissions(data.submissions || []);
      } else {
        setTaskSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading student tasks:', error);
      setTaskSubmissions([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Handle review submission
  const handleReviewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewStatus(submission.status === 'pending' ? 'approved' : submission.status);
    setReviewComment(submission.trainer_comment || '');
    setShowReviewModal(true);
  };

  // Submit review
  const submitReview = async () => {
    if (!selectedSubmission) return;

    setLoading(true);
    
    try {
      const response = await fetch(`${baseUrl}/api/task-submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          trainer_comment: reviewComment
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Review submitted successfully!' 
        });
        
        // Reload submissions for the selected student
        if (selectedStudent) {
          await loadStudentTasks(selectedStudent);
        }
        
        setTimeout(() => {
          setShowReviewModal(false);
          setMessage({ text: '', type: '' });
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

  // Get status badge config
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { text: 'Pending', color: '#fb8c00', bgColor: '#fff3e0' },
      approved: { text: 'Approved', color: '#43a047', bgColor: '#e8f5e9' },
      rejected: { text: 'Needs Revision', color: '#e53935', bgColor: '#ffebee' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!trainerData.id || !newReport.student_id || newReport.student_id === 0) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    // Validate ratings (1-10)
    const ratings = [
      newReport.technical_skills,
      newReport.communication_skills,
      newReport.problem_solving,
      newReport.teamwork,
      newReport.performance_rating
    ];

    if (ratings.some(r => r < 1 || r > 10)) {
      Alert.alert('Error', 'All ratings must be between 1 and 10');
      return;
    }

    setLoading(true);
    
    const reportData = {
      trainer_id: trainerData.id,
      ...newReport
    };
    
    console.log('📤 Sending report data:', reportData);
    
    try {
      const response = await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok) {
        console.log('✅ Report saved successfully!');
        setMessage({ type: 'success', text: 'Report submitted successfully!' });
        
        setNewReport({
          student_id: 0,
          technical_skills: 5,
          communication_skills: 5,
          problem_solving: 5,
          teamwork: 5,
          performance_rating: 5,
          comments: ''
        });
        
        setShowStudentDropdown(false);
        loadReports();
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle internship change for schedule
  const handleInternshipChange = (internshipId: string) => {
    setNewSchedule({ ...newSchedule, internship_id: internshipId, student_ids: [] });
    
    if (internshipId) {
      // Filter students by internship
      const filtered = students.filter((s: any) => s.internship_id === parseInt(internshipId));
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  // Toggle student selection for schedule
  const toggleStudentSelection = (studentId: string) => {
    const currentIds = [...newSchedule.student_ids];
    const index = currentIds.indexOf(studentId);
    
    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(studentId);
    }
    
    setNewSchedule({ ...newSchedule, student_ids: currentIds });
  };

  // Format date for API
  const formatDateTimeForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Handle add schedule
  const handleAddSchedule = async () => {
    if (!trainerData.id) return;

    setLoading(true);
    
    try {
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newSchedule.title,
          description: newSchedule.description,
          event_type: newSchedule.event_type,
          start_time: formatDateTimeForAPI(newSchedule.start_time),
          end_time: formatDateTimeForAPI(newSchedule.end_time),
          trainer_id: trainerData.id,
          internship_id: newSchedule.internship_id ? parseInt(newSchedule.internship_id) : null,
          student_ids: newSchedule.student_ids.map(id => parseInt(id))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Event created successfully!' });
        setNewSchedule({
          title: '',
          description: '',
          event_type: 'training',
          start_time: new Date(),
          end_time: new Date(),
          internship_id: '',
          student_ids: []
        });
        setFilteredStudents([]);
        loadSchedules();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create event' });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      setMessage({ type: 'error', text: 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  // Training Plans functions
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
      deliverables: ''
    }]);
  };

  const handleUpdateWeek = (index: number, field: string, value: string) => {
    const updatedWeeks = [...planWeeks];
    updatedWeeks[index][field] = value;
    setPlanWeeks(updatedWeeks);
  };

  const handleRemoveWeek = (index: number) => {
    const updatedWeeks = planWeeks.filter((_, i) => i !== index);
    updatedWeeks.forEach((week, i) => {
      week.week_number = i + 1;
      week.title = `Week ${i + 1}`;
    });
    setPlanWeeks(updatedWeeks);
  };

  const handleCreatePlan = async () => {
    if (!trainerData.id || !newPlan.internship_id || !newPlan.title || newPlan.duration_weeks <= 0) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    try {
      console.log('Creating plan:', newPlan);
      const response = await fetch(`${baseUrl}/api/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          trainer_id: trainerData.id,
          weeks: planWeeks
        })
      });
      const data = await response.json();
      console.log('Create plan response:', data);
      console.log('Response status:', response.status);
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Plan created successfully!' });
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
        setShowInternshipDropdown(false);
        await loadPlans();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorMsg = data.error ? `${data.message}: ${data.error}` : data.message || 'Failed to create plan';
        console.log('Error creating plan:', errorMsg);
        console.log('Error code:', data.code);
        setMessage({ type: 'error', text: errorMsg });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      setMessage({ type: 'error', text: 'Network error: ' + error.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (planId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/plans/${planId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedPlan(data.plan);
        setShowPlanWeeksModal(true);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    
    // Load data based on tab
    switch (tab) {
      case 'profile':
        // Reload trainer data when opening profile
        if (userData?.id) {
          loadTrainerData();
        }
        break;
      case 'students':
        loadStudents();
        break;
      case 'internships':
        loadInternships();
        break;
      case 'reports':
        if (trainerData.id) {
          loadReports();
          loadStudents();
        }
        break;
      case 'schedule':
        loadSchedules();
        loadStudents();
        loadInternships();
        break;
      case 'notifications':
        loadNotifications();
        break;
      case 'plans':
        loadPlans();
        loadInternships();
        break;
    }
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/trainers/${trainerData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTrainerData),
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          
          if (data.success) {
            setTrainerData(prev => ({
              ...prev,
              ...data.trainer
            }));
            setEditedTrainerData(data.trainer);
            setIsEditingProfile(false);
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
          } else {
            setMessage({ text: data.message || 'Failed to update profile', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
          }
        } catch (e) {
          console.error('Error parsing update response:', e);
          setMessage({ text: 'Failed to parse server response', type: 'error' });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
      } else {
        setMessage({ text: `Server error: ${response.status}`, type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id) {
      loadTrainerData();
    }
  }, [userData?.id]);

  useEffect(() => {
    if (trainerData.id) {
      loadDashboardStats(trainerData.id);
      setEditedTrainerData(trainerData);
    }
  }, [trainerData.id]);

  // Render Dashboard
  const renderDashboard = () => {
    const screenWidth = Dimensions.get('window').width;
    
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: { borderRadius: 16 },
      propsForDots: { r: '6', strokeWidth: '2', stroke: '#1e3a8a' },
    };

    const completionRate = dashboardStats.studentsCount > 0 ? '85%' : '0%';
    const avgRating = '4.5';

    // Chart data
    const lineChartData = {
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      datasets: [
        {
          data: [
            Math.max(1, Math.floor(dashboardStats.internshipsCount * 0.35)),
            Math.max(1, Math.floor(dashboardStats.internshipsCount * 0.5)),
            Math.max(1, Math.floor(dashboardStats.internshipsCount * 0.65)),
            Math.max(2, Math.floor(dashboardStats.internshipsCount * 0.75)),
            Math.max(2, Math.floor(dashboardStats.internshipsCount * 0.88)),
            dashboardStats.internshipsCount || 0
          ],
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3
        },
        {
          data: [
            Math.max(1, Math.floor(dashboardStats.studentsCount * 0.33)),
            Math.max(2, Math.floor(dashboardStats.studentsCount * 0.5)),
            Math.max(3, Math.floor(dashboardStats.studentsCount * 0.65)),
            Math.max(4, Math.floor(dashboardStats.studentsCount * 0.77)),
            Math.max(5, Math.floor(dashboardStats.studentsCount * 0.88)),
            dashboardStats.studentsCount || 0
          ],
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 3
        }
      ],
      legend: ['Internships', 'Students']
    };

    const barChartData = {
      labels: ['Internships', 'Students', 'Notifications'],
      datasets: [{
        data: [
          dashboardStats.internshipsCount || 0,
          dashboardStats.studentsCount || 0,
          dashboardStats.unreadNotificationsCount || 0
        ]
      }]
    };

    return (
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dashboardHeader}>
          <Text style={styles.sectionTitle}>Trainer Performance</Text>
          <Text style={styles.sectionSubtitle}>Overview of your training activities and student progress</Text>
        </View>

        {/* KPI Cards with Gradients */}
        <View style={styles.kpiGrid}>
          {/* Blue Gradient - Internships */}
          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardBlue]}
            onPress={() => handleTabChange('internships')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Active Internships</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>INTERNSHIPS</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.internshipsCount}</Text>
            <Text style={styles.kpiDescription}>
              {dashboardStats.internshipsCount === 0 ? 'No internships yet' : 
               dashboardStats.internshipsCount === 1 ? 'Supervising 1 internship' : 
               `Supervising ${dashboardStats.internshipsCount} internships`}
            </Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Active Positions</Text>
              <Text style={styles.kpiFooterValue}>{dashboardStats.internshipsCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Green Gradient - Students */}
          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardGreen]}
            onPress={() => handleTabChange('students')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Assigned Students</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>STUDENTS</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.studentsCount}</Text>
            <Text style={styles.kpiDescription}>
              {dashboardStats.studentsCount === 0 ? 'No students assigned yet' : 
               dashboardStats.studentsCount === 1 ? 'Training 1 student' : 
               `Training ${dashboardStats.studentsCount} students`}
            </Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Total Assigned</Text>
              <Text style={styles.kpiFooterValue}>{dashboardStats.studentsCount} {dashboardStats.studentsCount === 1 ? 'student' : 'students'}</Text>
            </View>
          </TouchableOpacity>

          {/* Purple Gradient - Notifications */}
          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardPurple]}
            onPress={() => handleTabChange('notifications')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Notifications</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>UNREAD</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.unreadNotificationsCount}</Text>
            <Text style={styles.kpiDescription}>Pending notifications</Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Status</Text>
              <Text style={styles.kpiFooterValue}>
                {dashboardStats.unreadNotificationsCount > 0 ? 'Requires attention' : 'All caught up!'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Training Analytics Section */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Training Analytics</Text>
          
          {/* Line Chart - Training Progress */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Training Progress</Text>
              <View style={styles.chartTag}>
                <Text style={styles.chartTagText}>Last 6 Months</Text>
              </View>
            </View>
            <LineChart
              data={lineChartData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Bar Chart - Current Overview */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Current Overview</Text>
              <View style={styles.chartTag}>
                <Text style={styles.chartTagText}>{dashboardStats.studentsCount} Students</Text>
              </View>
            </View>
            <BarChart
              data={barChartData}
              width={screenWidth - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              style={styles.chart}
              fromZero
            />
          </View>

          {/* Pie Chart - Student Status */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Student Status</Text>
              <View style={styles.chartTag}>
                <Text style={styles.chartTagText}>Active: {dashboardStats.studentsCount}</Text>
              </View>
            </View>
            <PieChart
              data={[
                {
                  name: 'Active',
                  population: dashboardStats.studentsCount || 1,
                  color: '#10b981',
                  legendFontColor: '#6b7280',
                  legendFontSize: 12
                },
                {
                  name: 'Pending Tasks',
                  population: Math.floor((dashboardStats.studentsCount || 1) * 0.3),
                  color: '#f59e0b',
                  legendFontColor: '#6b7280',
                  legendFontSize: 12
                },
                {
                  name: 'Completed',
                  population: Math.floor((dashboardStats.studentsCount || 1) * 0.5),
                  color: '#3b82f6',
                  legendFontColor: '#6b7280',
                  legendFontSize: 12
                }
              ]}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render Profile
  const renderProfile = () => {
    return (
      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trainer Profile & Edit</Text>
          <Text style={styles.sectionSubtitle}>Update your professional information</Text>
        </View>

        {message.text && (
          <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Professional Information Card */}
        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Professional Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Specialization</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? (editedTrainerData?.specialization || '') : trainerData.specialization}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, specialization: text })}
              editable={isEditingProfile}
              placeholder="e.g., Full Stack Development, Data Science"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Years of Experience</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? String(editedTrainerData?.experience_years || 0) : String(trainerData.experience_years)}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, experience_years: parseInt(text) || 0 })}
              editable={isEditingProfile}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Hourly Rate ($)</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? String(editedTrainerData?.hourly_rate || 0) : String(trainerData.hourly_rate)}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, hourly_rate: parseFloat(text) || 0 })}
              editable={isEditingProfile}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Maximum Trainees</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? String(editedTrainerData?.max_trainees || 5) : String(trainerData.max_trainees)}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, max_trainees: parseInt(text) || 5 })}
              editable={isEditingProfile}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        </View>

        {/* Contact & Social Links Card */}
        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Contact & Social Links</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>LinkedIn URL</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? (editedTrainerData?.linkedin_url || '') : trainerData.linkedin_url}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, linkedin_url: text })}
              editable={isEditingProfile}
              placeholder="https://linkedin.com/in/yourprofile"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>GitHub URL</Text>
            <TextInput
              style={[styles.formInput, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? (editedTrainerData?.github_url || '') : trainerData.github_url}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, github_url: text })}
              editable={isEditingProfile}
              placeholder="https://github.com/yourusername"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={[styles.formInput, !isEditingProfile && styles.disabledInput, { justifyContent: 'center' }]}>
              <Text style={{ color: isEditingProfile ? '#1f2937' : '#6b7280', textTransform: 'capitalize' }}>
                {trainerData.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* About Me Card */}
        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>About Me</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bio</Text>
            <TextInput
              style={[styles.textArea, !isEditingProfile && styles.disabledInput]}
              value={isEditingProfile ? (editedTrainerData?.bio || '') : trainerData.bio}
              onChangeText={(text) => setEditedTrainerData({ ...editedTrainerData, bio: text })}
              editable={isEditingProfile}
              multiline
              numberOfLines={6}
              placeholder="Tell us about yourself, your experience, and what you can offer to trainees..."
            />
          </View>

          <View style={styles.formActions}>
            {!isEditingProfile ? (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setIsEditingProfile(true);
                  setEditedTrainerData(trainerData);
                }}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsEditingProfile(false);
                    setEditedTrainerData(trainerData);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render My Internships
  const renderInternships = () => {
    const filtered = internships.filter((it: any) => {
      const statusOk = internshipStatus === 'all' ? true : (it.status === internshipStatus);
      const q = internshipSearch.trim().toLowerCase();
      const text = `${it.title || ''} ${it.company_name || ''} ${it.specialization || ''}`.toLowerCase();
      const searchOk = q.length === 0 ? true : text.includes(q);
      return statusOk && searchOk;
    });

    const renderItem = ({ item }: { item: any }) => (
      <View style={styles.internshipCard}>
        <View style={styles.internshipHeader}>
          <View style={styles.companyInfo}>
            {item.company_logo ? (
              <Image
                source={{ uri: `${baseUrl}${item.company_logo}` }}
                style={styles.companyLogo}
              />
            ) : (
              <View style={styles.companyLogoPlaceholder}>
                <Text style={styles.companyLogoText}>
                  {item.company_name?.charAt(0) || 'C'}
                </Text>
              </View>
            )}
            <View style={styles.internshipTitleContainer}>
              <Text style={styles.internshipTitle}>{item.title}</Text>
              <Text style={styles.companyName}>{item.company_name}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'open' && styles.statusOpen,
              item.status === 'closed' && styles.statusClosed,
              item.status === 'active' && styles.statusActive,
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.internshipDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📚</Text>
            <Text style={styles.detailText}>{item.specialization || 'General'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>{item.capacity} positions</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>

        <View style={styles.internshipStats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{item.applicents_count || item.applicants_count || 0}</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{item.accepted_count || 0}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
        </View>

        {item.description && (
          <View style={styles.internshipDescription}>
            <Text style={styles.descriptionText} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        )}
      </View>
    );

    return (
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Internships</Text>
          <Text style={styles.sectionSubtitle}>Internships you are training</Text>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, company, or skill"
            value={internshipSearch}
            onChangeText={setInternshipSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'open', 'active', 'closed'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, internshipStatus === s && styles.filterChipActive]}
              onPress={() => setInternshipStatus(s)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, internshipStatus === s && styles.filterChipTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Internships</Text>
            <Text style={styles.emptyStateText}>Try changing filters or search</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        <View style={{ height: 24 }} />
      </View>
    );
  };

  // Render My Students
  const renderStudents = () => {
    const filtered = students.filter((st: any) => {
      const statusVal = st.training_status || st.status;
      const statusOk = studentStatus === 'all' ? true : statusVal === studentStatus;
      const q = studentSearch.trim().toLowerCase();
      const text = `${st.full_name || ''} ${st.email || ''} ${st.university_name || ''} ${st.major || ''}`.toLowerCase();
      const searchOk = q.length === 0 ? true : text.includes(q);
      return statusOk && searchOk;
    });

    const renderItem = ({ item }: { item: any }) => (
      <View style={styles.studentCard}>
        <View style={styles.studentCardGradient}>
          <View style={styles.studentHeader}>
            {item.student_img ? (
              <Image source={{ uri: `${baseUrl}${item.student_img}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{(item.full_name || 'S').charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.studentName}>{item.full_name}</Text>
              <Text style={styles.studentSubtitle}>
                {(item.university_name || 'University')} • {(item.major || 'Major')}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                (item.training_status || item.status) === 'complete' && styles.pillComplete,
                (item.training_status || item.status) === 'in_training' && styles.pillInTraining,
              ]}
            >
              <Text style={styles.pillText}>
                {(item.training_status || item.status || 'in_training').replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.studentInfoContainer}>
            <View style={styles.studentInfoRow}>
              <View style={styles.infoIconWrapper}>
                <MaterialIcons name="email" size={20} color="#1e3a8a" />
              </View>
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
            {!!item.gpa && (
              <View style={styles.studentInfoRow}>
                <View style={styles.infoIconWrapper}>
                  <MaterialIcons name="school" size={20} color="#1e3a8a" />
                </View>
                <Text style={styles.infoText}>GPA: {item.gpa}</Text>
              </View>
            )}
            {(item.internship_title || item.company_name) && (
              <View style={styles.studentInfoRow}>
                <View style={styles.infoIconWrapper}>
                  <MaterialIcons name="work" size={20} color="#1e3a8a" />
                </View>
                <Text style={styles.infoText}>
                  {(item.internship_title || 'Internship')} at {(item.company_name || 'Company')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.studentActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => {
                setPreselectedStudentId(item.student_id);
                handleTabChange('reports');
              }}
            >
              <MaterialIcons name="assignment" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]} 
              activeOpacity={0.7}
              onPress={() => loadStudentTasks(item)}
            >
              <MaterialIcons name="task-alt" size={24} color="#1e3a8a" />
              <Text style={styles.actionButtonTextSecondary}>Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );

    return (
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Students</Text>
          <Text style={styles.sectionSubtitle}>Accepted students under your supervision</Text>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIconMaterial} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, university, major"
            value={studentSearch}
            onChangeText={setStudentSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'in_training', 'complete'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, studentStatus === s && styles.filterChipActive]}
              onPress={() => setStudentStatus(s)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, studentStatus === s && styles.filterChipTextActive]}>
                {s === 'all' ? 'All' : s === 'in_training' ? 'In Training' : 'Complete'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Students</Text>
            <Text style={styles.emptyStateText}>Try changing filters or search</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => String(item.student_id || item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}

        <View style={{ height: 24 }} />
      </View>
    );
  };

  // Render Reports
  const renderReports = () => {
    const filteredReports = reports;

    return (
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Student Reports</Text>
          <Text style={styles.sectionSubtitle}>Create and manage performance reports</Text>
        </View>

        {message.text && (
          <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Create New Report Form */}
        <View style={styles.reportFormCard}>
          <Text style={styles.cardTitle}>Create New Report</Text>
          
          {/* Select Student */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Student *</Text>
            <View>
              <TouchableOpacity
                style={styles.selectPickerButton}
                onPress={() => setShowStudentDropdown(!showStudentDropdown)}
              >
                <Text style={[
                  styles.selectPickerText,
                  newReport.student_id === 0 && styles.selectPickerPlaceholder
                ]}>
                  {newReport.student_id === 0
                    ? 'Choose a student...'
                    : students.find(s => s.student_id === newReport.student_id)?.full_name || 'Choose a student...'}
                </Text>
                <Text style={styles.selectPickerArrow}>▼</Text>
              </TouchableOpacity>
              
              {showStudentDropdown && (
                <View style={styles.dropdownList}>
                  {students.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>No students available</Text>
                  ) : (
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {students.map((student) => (
                        <TouchableOpacity
                          key={student.student_id}
                          style={[
                            styles.dropdownItem,
                            newReport.student_id === student.student_id && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setNewReport({ ...newReport, student_id: student.student_id });
                            setShowStudentDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            newReport.student_id === student.student_id && styles.dropdownItemTextSelected
                          ]}>
                            {student.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitleSmall}>Performance Evaluation</Text>

          {/* Technical Skills */}
          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Technical Skills (1-10)</Text>
              <TextInput
                style={styles.numberInput}
                value={String(newReport.technical_skills)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewReport({ ...newReport, technical_skills: 0 });
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num) && num <= 10) {
                    setNewReport({ ...newReport, technical_skills: num });
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Enter 1-10"
              />
            </View>

            {/* Communication Skills */}
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Communication Skills (1-10)</Text>
              <TextInput
                style={styles.numberInput}
                value={String(newReport.communication_skills)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewReport({ ...newReport, communication_skills: 0 });
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num) && num <= 10) {
                    setNewReport({ ...newReport, communication_skills: num });
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Enter 1-10"
              />
            </View>
          </View>

          {/* Problem Solving & Teamwork */}
          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Problem Solving (1-10)</Text>
              <TextInput
                style={styles.numberInput}
                value={String(newReport.problem_solving)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewReport({ ...newReport, problem_solving: 0 });
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num) && num <= 10) {
                    setNewReport({ ...newReport, problem_solving: num });
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Enter 1-10"
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Teamwork (1-10)</Text>
              <TextInput
                style={styles.numberInput}
                value={String(newReport.teamwork)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewReport({ ...newReport, teamwork: 0 });
                    return;
                  }
                  const num = parseInt(text);
                  if (!isNaN(num) && num <= 10) {
                    setNewReport({ ...newReport, teamwork: num });
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Enter 1-10"
              />
            </View>
          </View>

          {/* Overall Performance */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Overall Performance Rating (1-10)</Text>
            <TextInput
              style={styles.numberInput}
              value={String(newReport.performance_rating)}
              onChangeText={(text) => {
                if (text === '') {
                  setNewReport({ ...newReport, performance_rating: 0 });
                  return;
                }
                const num = parseInt(text);
                if (!isNaN(num) && num <= 10) {
                  setNewReport({ ...newReport, performance_rating: num });
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="Enter 1-10"
            />
          </View>

          {/* Comments */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Comments & Feedback</Text>
            <TextInput
              style={styles.commentsInput}
              value={newReport.comments}
              onChangeText={(text) => setNewReport({ ...newReport, comments: text })}
              placeholder="Provide detailed feedback about the student's performance..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitReportButton, loading && styles.submitReportButtonDisabled]}
            onPress={handleSubmitReport}
            disabled={loading}
          >
            <Text style={styles.submitReportButtonText}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Previous Reports */}
        <View style={styles.previousReportsSection}>
          <Text style={styles.sectionTitleMedium}>Previous Reports</Text>
          
          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
              <Text style={styles.emptyStateText}>
                You haven't submitted any reports yet.
              </Text>
            </View>
          ) : (
            filteredReports.map((report: any) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportStudentName}>{report.student_name}</Text>
                    <Text style={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.reportBadge}>
                    <Text style={styles.reportBadgeText}>
                      {report.performance_rating}/10
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reportCardBody}>
                  <View style={styles.reportSkillsGrid}>
                    <View style={styles.reportSkillItem}>
                      <Text style={styles.reportSkillLabel}>Technical</Text>
                      <Text style={styles.reportSkillValue}>{report.technical_skills}/10</Text>
                    </View>
                    <View style={styles.reportSkillItem}>
                      <Text style={styles.reportSkillLabel}>Communication</Text>
                      <Text style={styles.reportSkillValue}>{report.communication_skills}/10</Text>
                    </View>
                    <View style={styles.reportSkillItem}>
                      <Text style={styles.reportSkillLabel}>Problem Solving</Text>
                      <Text style={styles.reportSkillValue}>{report.problem_solving}/10</Text>
                    </View>
                    <View style={styles.reportSkillItem}>
                      <Text style={styles.reportSkillLabel}>Teamwork</Text>
                      <Text style={styles.reportSkillValue}>{report.teamwork}/10</Text>
                    </View>
                  </View>
                  
                  {report.comments && (
                    <View style={styles.reportCommentsSection}>
                      <Text style={styles.reportCommentsLabel}>Comments:</Text>
                      <Text style={styles.reportComments}>
                        {report.comments}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render Schedule
  const renderSchedule = () => {
    const eventTypes = [
      { value: 'training', label: 'Training Session' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'workshop', label: 'Workshop' },
      { value: 'review', label: 'Performance Review' }
    ];

    return (
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Training Schedule</Text>
          <Text style={styles.sectionSubtitle}>Manage your training sessions and meetings</Text>
        </View>

        {message.text && (
          <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Add New Schedule Form */}
        <View style={styles.reportFormCard}>
          <Text style={styles.cardTitle}>Add New Event</Text>
          
          {/* Event Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newSchedule.title}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, title: text })}
              placeholder="e.g., Weekly Training Session"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Event Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Type</Text>
            <TouchableOpacity
              style={styles.selectPickerButton}
              onPress={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
            >
              <Text style={styles.selectPickerText}>
                {eventTypes.find(t => t.value === newSchedule.event_type)?.label || 'Select Type'}
              </Text>
              <Text style={styles.selectPickerArrow}>▼</Text>
            </TouchableOpacity>
            
            {showEventTypeDropdown && (
              <View style={styles.dropdownList}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      newSchedule.event_type === type.value && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setNewSchedule({ ...newSchedule, event_type: type.value });
                      setShowEventTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      newSchedule.event_type === type.value && styles.dropdownItemTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Start Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Start Date & Time *</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setShowStartDatePicker(!showStartDatePicker)}
              >
                <MaterialIcons name="calendar-today" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeButtonText}>
                  {newSchedule.start_time.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowStartTimePicker(!showStartTimePicker)}
              >
                <MaterialIcons name="access-time" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeButtonText}>
                  {newSchedule.start_time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Date Picker Modal */}
          {showStartDatePicker && (
            <Modal
              transparent
              visible={showStartDatePicker}
              animationType="fade"
              onRequestClose={() => {
                setShowStartDatePicker(false);
                setTempStartDate('');
              }}
            >
              <TouchableOpacity 
                style={styles.datePickerOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowStartDatePicker(false);
                  setTempStartDate('');
                }}
              >
                <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Enter Start Date</Text>
                    <TouchableOpacity onPress={() => {
                      setShowStartDatePicker(false);
                      setTempStartDate('');
                    }}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerBody}>
                    <Text style={styles.dateInputLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={tempStartDate || newSchedule.start_time.toISOString().split('T')[0]}
                      onChangeText={setTempStartDate}
                      placeholder="2024-12-31"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numbers-and-punctuation"
                      autoFocus
                    />
                    <Text style={styles.datePickerHelper}>
                      Example: {new Date().toISOString().split('T')[0]}
                    </Text>
                    
                    {tempStartDate && (() => {
                      const previewDate = new Date(tempStartDate);
                      const isValid = !isNaN(previewDate.getTime());
                      return (
                        <View style={[styles.datePreview, !isValid && styles.datePreviewError]}>
                          <MaterialIcons 
                            name={isValid ? "check-circle" : "error"} 
                            size={20} 
                            color={isValid ? "#10b981" : "#ef4444"} 
                            style={{ marginRight: 8 }} 
                          />
                          <Text style={[styles.datePreviewText, !isValid && styles.datePreviewTextError]}>
                            {isValid 
                              ? previewDate.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'Invalid date format'
                            }
                          </Text>
                        </View>
                      );
                    })()}

                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const date = new Date(tempStartDate || newSchedule.start_time.toISOString().split('T')[0]);
                        if (!isNaN(date.getTime())) {
                          const newDate = new Date(newSchedule.start_time);
                          newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setNewSchedule({ ...newSchedule, start_time: newDate });
                        }
                        setShowStartDatePicker(false);
                        setTempStartDate('');
                      }}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Start Time Picker Modal */}
          {showStartTimePicker && (
            <Modal
              transparent
              visible={showStartTimePicker}
              animationType="fade"
              onRequestClose={() => setShowStartTimePicker(false)}
            >
              <TouchableOpacity 
                style={styles.datePickerOverlay}
                activeOpacity={1}
                onPress={() => setShowStartTimePicker(false)}
              >
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Start Time</Text>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerBody}>
                    <View style={styles.timeInputRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.timeInputLabel}>Hour</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={String(newSchedule.start_time.getHours()).padStart(2, '0')}
                          onChangeText={(text) => {
                            const hour = parseInt(text);
                            if (!isNaN(hour) && hour >= 0 && hour < 24) {
                              const newDate = new Date(newSchedule.start_time);
                              newDate.setHours(hour);
                              setNewSchedule({ ...newSchedule, start_time: newDate });
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timeInputLabel}>Minute</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={String(newSchedule.start_time.getMinutes()).padStart(2, '0')}
                          onChangeText={(text) => {
                            const minute = parseInt(text);
                            if (!isNaN(minute) && minute >= 0 && minute < 60) {
                              const newDate = new Date(newSchedule.start_time);
                              newDate.setMinutes(minute);
                              setNewSchedule({ ...newSchedule, start_time: newDate });
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* End Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>End Date & Time *</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setShowEndDatePicker(!showEndDatePicker)}
              >
                <MaterialIcons name="calendar-today" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeButtonText}>
                  {newSchedule.end_time.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowEndTimePicker(!showEndTimePicker)}
              >
                <MaterialIcons name="access-time" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeButtonText}>
                  {newSchedule.end_time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date Picker Modal */}
          {showEndDatePicker && (
            <Modal
              transparent
              visible={showEndDatePicker}
              animationType="fade"
              onRequestClose={() => {
                setShowEndDatePicker(false);
                setTempEndDate('');
              }}
            >
              <TouchableOpacity 
                style={styles.datePickerOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowEndDatePicker(false);
                  setTempEndDate('');
                }}
              >
                <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Enter End Date</Text>
                    <TouchableOpacity onPress={() => {
                      setShowEndDatePicker(false);
                      setTempEndDate('');
                    }}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerBody}>
                    <Text style={styles.dateInputLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={tempEndDate || newSchedule.end_time.toISOString().split('T')[0]}
                      onChangeText={setTempEndDate}
                      placeholder="2024-12-31"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numbers-and-punctuation"
                      autoFocus
                    />
                    <Text style={styles.datePickerHelper}>
                      Example: {new Date().toISOString().split('T')[0]}
                    </Text>
                    
                    {tempEndDate && (() => {
                      const previewDate = new Date(tempEndDate);
                      const isValid = !isNaN(previewDate.getTime());
                      return (
                        <View style={[styles.datePreview, !isValid && styles.datePreviewError]}>
                          <MaterialIcons 
                            name={isValid ? "check-circle" : "error"} 
                            size={20} 
                            color={isValid ? "#10b981" : "#ef4444"} 
                            style={{ marginRight: 8 }} 
                          />
                          <Text style={[styles.datePreviewText, !isValid && styles.datePreviewTextError]}>
                            {isValid 
                              ? previewDate.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'Invalid date format'
                            }
                          </Text>
                        </View>
                      );
                    })()}

                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const date = new Date(tempEndDate || newSchedule.end_time.toISOString().split('T')[0]);
                        if (!isNaN(date.getTime())) {
                          const newDate = new Date(newSchedule.end_time);
                          newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setNewSchedule({ ...newSchedule, end_time: newDate });
                        }
                        setShowEndDatePicker(false);
                        setTempEndDate('');
                      }}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* End Time Picker Modal */}
          {showEndTimePicker && (
            <Modal
              transparent
              visible={showEndTimePicker}
              animationType="fade"
              onRequestClose={() => setShowEndTimePicker(false)}
            >
              <TouchableOpacity 
                style={styles.datePickerOverlay}
                activeOpacity={1}
                onPress={() => setShowEndTimePicker(false)}
              >
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select End Time</Text>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerBody}>
                    <View style={styles.timeInputRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.timeInputLabel}>Hour</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={String(newSchedule.end_time.getHours()).padStart(2, '0')}
                          onChangeText={(text) => {
                            const hour = parseInt(text);
                            if (!isNaN(hour) && hour >= 0 && hour < 24) {
                              const newDate = new Date(newSchedule.end_time);
                              newDate.setHours(hour);
                              setNewSchedule({ ...newSchedule, end_time: newDate });
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timeInputLabel}>Minute</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={String(newSchedule.end_time.getMinutes()).padStart(2, '0')}
                          onChangeText={(text) => {
                            const minute = parseInt(text);
                            if (!isNaN(minute) && minute >= 0 && minute < 60) {
                              const newDate = new Date(newSchedule.end_time);
                              newDate.setMinutes(minute);
                              setNewSchedule({ ...newSchedule, end_time: newDate });
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Select Internship */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Internship *</Text>
            <TouchableOpacity
              style={styles.selectPickerButton}
              onPress={() => setShowInternshipDropdown(!showInternshipDropdown)}
            >
              <Text style={[
                styles.selectPickerText,
                newSchedule.internship_id === '' && styles.selectPickerPlaceholder
              ]}>
                {newSchedule.internship_id === ''
                  ? 'Select Internship'
                  : internships.find(i => i.id === parseInt(newSchedule.internship_id))?.title || 'Select Internship'}
              </Text>
              <Text style={styles.selectPickerArrow}>▼</Text>
            </TouchableOpacity>
            
            {showInternshipDropdown && (
              <View style={styles.dropdownList}>
                {internships.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No internships available</Text>
                ) : (
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {internships.map((internship) => (
                      <TouchableOpacity
                        key={internship.id}
                        style={[
                          styles.dropdownItem,
                          newSchedule.internship_id === internship.id.toString() && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          handleInternshipChange(internship.id.toString());
                          setShowInternshipDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          newSchedule.internship_id === internship.id.toString() && styles.dropdownItemTextSelected
                        ]}>
                          {internship.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Select Students */}
          {filteredStudents.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Students *</Text>
              <View style={styles.studentCheckboxContainer}>
                {filteredStudents.map((student) => (
                  <TouchableOpacity
                    key={student.student_id}
                    style={styles.checkboxItem}
                    onPress={() => toggleStudentSelection(student.student_id.toString())}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      newSchedule.student_ids.includes(student.student_id.toString()) && styles.checkboxChecked
                    ]}>
                      {newSchedule.student_ids.includes(student.student_id.toString()) && (
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{student.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.formHelper}>
                {newSchedule.student_ids.length} student(s) selected
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={newSchedule.description}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, description: text })}
              placeholder="Add event details..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setNewSchedule({
                  title: '',
                  description: '',
                  event_type: 'training',
                  start_time: new Date(),
                  end_time: new Date(),
                  internship_id: '',
                  student_ids: []
                });
                setFilteredStudents([]);
              }}
            >
              <MaterialIcons name="close" size={20} color="#6b7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addEventButton, loading && styles.submitButtonDisabled]}
              onPress={handleAddSchedule}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="event" size={20} color="#ffffff" />
                  <Text style={styles.addEventButtonText}>Add Event</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleSmall}>Upcoming Events</Text>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Events Scheduled</Text>
            <Text style={styles.emptyStateText}>You don't have any upcoming events.</Text>
          </View>
        ) : (
          schedules.map((schedule: any) => (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                <View style={[styles.eventTypeBadge, 
                  schedule.event_type === 'training' && styles.badgeBlue,
                  schedule.event_type === 'meeting' && styles.badgeGreen,
                  schedule.event_type === 'workshop' && styles.badgePurple,
                  schedule.event_type === 'review' && styles.badgeOrange
                ]}>
                  <Text style={styles.eventTypeBadgeText}>{schedule.event_type}</Text>
                </View>
              </View>

              {schedule.description && (
                <Text style={styles.scheduleDescription}>{schedule.description}</Text>
              )}

              <View style={styles.scheduleInfoRow}>
                <MaterialIcons name="business" size={16} color="#6b7280" />
                <Text style={styles.scheduleInfoText}>
                  {schedule.internship_title || 'No internship'}
                </Text>
              </View>

              <View style={styles.scheduleInfoRow}>
                <MaterialIcons name="schedule" size={16} color="#6b7280" />
                <Text style={styles.scheduleInfoText}>
                  {new Date(schedule.start_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {' → '}
                  {new Date(schedule.end_time).toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              {schedule.students && schedule.students.length > 0 && (
                <View style={styles.scheduleStudents}>
                  <MaterialIcons name="people" size={16} color="#6b7280" />
                  <View style={styles.studentBadgesContainer}>
                    {schedule.students.map((student: any, idx: number) => (
                      <View key={idx} style={styles.studentBadge}>
                        <Text style={styles.studentBadgeText}>{student.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render Notifications
  const renderNotifications = () => {
    return (
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionSubtitle}>{notifications?.length || 0} notifications</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyStateText}>You'll see notifications here when you receive them</Text>
          </View>
        ) : (
          notifications.map((notification: any) => (
            <View 
              key={notification.id} 
              style={[
                styles.notificationCard,
                !notification.is_read && styles.notificationUnread
              ]}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              {!notification.is_read && (
                <TouchableOpacity
                  style={styles.markReadButton}
                  onPress={() => markAsRead(notification.id)}
                >
                  <MaterialIcons name="check" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.markReadText}>Mark as Read</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  };

  // Render Messages
  const renderMessages = () => {
    return (
      <View style={styles.chatContainer}>
        {showContactsList && (
          <View style={styles.chatSidebar}>
            <View style={styles.chatSidebarHeader}>
              <Text style={styles.chatSidebarTitle}>Conversations</Text>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setShowContactsList(false)}
              >
                <Text style={styles.toggleButtonText}>←</Text>
              </TouchableOpacity>
            </View>
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contacts yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.contactsList}>
              {contacts.map((contact, index) => {
                const isCompany = contact.type === 'company';
                const contactImage = isCompany ? contact.logo : contact.student_img;
                const contactName = contact.full_name || contact.name || (isCompany ? 'Company' : 'Student');
                const contactInitial = contactName.charAt(0).toUpperCase();
                
                return (
                  <TouchableOpacity
                    key={`contact-${contact.user_id || contact.id || index}`}
                    style={[
                      styles.contactItem,
                      selectedContactId === contact.user_id && styles.contactItemSelected
                    ]}
                    onPress={() => {
                      if (contact.user_id) {
                        setSelectedContactId(contact.user_id);
                        loadMessages(contact.user_id);
                      }
                    }}
                  >
                    <View style={styles.contactAvatar}>
                      {contactImage && contactImage.trim() !== '' ? (
                        <>
                          <Image 
                            source={{ 
                              uri: contactImage.startsWith('http') 
                                ? contactImage 
                                : `${baseUrl}${contactImage}` 
                            }}
                            style={styles.contactAvatarImage}
                          />
                          <Text style={[styles.contactAvatarText, { position: 'absolute', opacity: 0 }]}>
                            {contactInitial}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.contactAvatarText}>
                          {contactInitial}
                        </Text>
                      )}
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contactName}</Text>
                      <Text style={styles.contactEmail}>{contact.email}</Text>
                    </View>
                    {contact.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{contact.unread_count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          </View>
        )}

        <View style={[styles.chatMain, !showContactsList && styles.chatMainExpanded]}>
          <View style={styles.chatHeaderRow}>
            {!showContactsList && (
              <TouchableOpacity 
                style={styles.showContactsButton}
                onPress={() => setShowContactsList(true)}
              >
                <Text style={styles.showContactsButtonText}>→ Contacts</Text>
              </TouchableOpacity>
            )}
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle}>
                {contacts.find(c => c.user_id === selectedContactId)?.full_name || 'Messages'}
              </Text>
              <Text style={styles.chatSubtitle}>Real-time messaging with students</Text>
            </View>
          </View>

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {selectedContactId ? 'No messages yet. Start the conversation!' : 'Select a student to start chatting'}
                </Text>
              </View>
            ) : (
              messages.map((msg, index) => {
                const isSentByTrainer = Number(msg.sender_id) === Number(userData?.id);
                return (
                  <View
                    key={`message-${msg.id}-${msg.created_at}-${index}`}
                    style={[
                      styles.messageItem,
                      isSentByTrainer ? styles.messageItemSent : styles.messageItemReceived
                    ]}
                  >
                    {/* Avatar for received messages (student/company) */}
                    {!isSentByTrainer && (
                      <View style={styles.messageAvatar}>
                        {(() => {
                          const selectedContact = contacts.find(c => c.user_id === selectedContactId);
                          const isCompany = selectedContact?.type === 'company';
                          const contactImage = isCompany ? selectedContact?.logo : selectedContact?.student_img;
                          const contactName = selectedContact?.full_name || selectedContact?.name || (isCompany ? 'Company' : 'Student');
                          
                          return contactImage && contactImage.trim() !== '' ? (
                            <>
                              <Image 
                                source={{ 
                                  uri: contactImage.startsWith('http') 
                                    ? contactImage 
                                    : `${baseUrl}${contactImage}` 
                                }}
                                style={styles.messageAvatarImage}
                              />
                              <Text style={[styles.messageAvatarText, { position: 'absolute', opacity: 0 }]}>
                                {contactName.charAt(0).toUpperCase()}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.messageAvatarText}>
                              {contactName.charAt(0).toUpperCase()}
                            </Text>
                          );
                        })()}
                      </View>
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      isSentByTrainer ? styles.messageBubbleSent : styles.messageBubbleReceived
                    ]}>
                      <Text style={[
                        styles.messageText,
                        isSentByTrainer ? styles.messageTextSent : styles.messageTextReceived
                      ]}>
                        {msg.message}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>

                    {/* Avatar for sent messages (trainer) */}
                    {isSentByTrainer && (
                      <View style={styles.messageAvatar}>
                        {trainerData.profile_image && trainerData.profile_image.trim() !== '' ? (
                          <>
                            <Image 
                              source={{ 
                                uri: trainerData.profile_image.startsWith('http') 
                                  ? trainerData.profile_image 
                                  : `${baseUrl}${trainerData.profile_image}` 
                              }}
                              style={styles.messageAvatarImage}
                            />
                            <Text style={[styles.messageAvatarText, { position: 'absolute', opacity: 0 }]}>
                              {trainerData.user.name?.charAt(0).toUpperCase() || userData?.full_name?.charAt(0).toUpperCase() || 'T'}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.messageAvatarText}>
                            {trainerData.user.name?.charAt(0).toUpperCase() || userData?.full_name?.charAt(0).toUpperCase() || 'T'}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {selectedContactId && (
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Training Plans
  const renderPlans = () => {
    const statusOptions = [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ];

    return (
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Training Plans</Text>
          <Text style={styles.sectionSubtitle}>Create and manage internship training plans</Text>
        </View>

        {message.text && (
          <View style={[styles.messageCard, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Create New Plan Form */}
        <View style={styles.reportFormCard}>
          <Text style={styles.cardTitle}>Create New Training Plan</Text>
          
          {/* Select Internship */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Internship *</Text>
            <TouchableOpacity
              style={styles.selectPickerButton}
              onPress={() => setShowInternshipDropdown(!showInternshipDropdown)}
            >
              <Text style={[
                styles.selectPickerText,
                newPlan.internship_id === '' && styles.selectPickerPlaceholder
              ]}>
                {newPlan.internship_id === ''
                  ? 'Select Internship'
                  : internships.find(i => i.id === parseInt(newPlan.internship_id))?.title || 'Select Internship'}
              </Text>
              <Text style={styles.selectPickerArrow}>▼</Text>
            </TouchableOpacity>
            
            {showInternshipDropdown && (
              <View style={styles.dropdownList}>
                {internships.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No internships available</Text>
                ) : (
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {internships.map((internship) => (
                      <TouchableOpacity
                        key={internship.id}
                        style={[
                          styles.dropdownItem,
                          newPlan.internship_id === internship.id.toString() && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setNewPlan({ ...newPlan, internship_id: internship.id.toString() });
                          setShowInternshipDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          newPlan.internship_id === internship.id.toString() && styles.dropdownItemTextSelected
                        ]}>
                          {internship.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Plan Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Plan Title *</Text>
            <TextInput
              style={styles.reportInput}
              value={newPlan.title}
              onChangeText={(text) => setNewPlan({ ...newPlan, title: text })}
              placeholder="e.g., Full Stack Development Training Plan"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.reportInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={newPlan.description}
              onChangeText={(text) => setNewPlan({ ...newPlan, description: text })}
              placeholder="Brief description of the training plan..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Duration (Weeks) *</Text>
            <TextInput
              style={styles.reportInput}
              value={newPlan.duration_weeks > 0 ? newPlan.duration_weeks.toString() : ''}
              onChangeText={(text) => {
                if (!text || text === '') {
                  setNewPlan({ ...newPlan, duration_weeks: 0 });
                } else {
                  const num = parseInt(text);
                  if (!isNaN(num) && num >= 0) {
                    setNewPlan({ ...newPlan, duration_weeks: num });
                  }
                }
              }}
              placeholder="4"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>

          {/* Weeks Section */}
          <View style={styles.weeksSection}>
            <View style={styles.weeksSectionHeader}>
              <Text style={styles.weeksSectionTitle}>Weekly Plan ({planWeeks.length} weeks)</Text>
              <TouchableOpacity
                style={styles.addWeekButton}
                onPress={handleAddWeek}
              >
                <MaterialIcons name="add" size={20} color="#ffffff" />
                <Text style={styles.addWeekButtonText}>Add Week</Text>
              </TouchableOpacity>
            </View>

            {planWeeks.length === 0 ? (
              <View style={styles.emptyWeeksState}>
                <Text style={styles.emptyWeeksText}>No weeks added yet. Click "Add Week" to start planning.</Text>
              </View>
            ) : (
              planWeeks.map((week, index) => (
                <View key={index} style={styles.weekCard}>
                  <View style={styles.weekCardHeader}>
                    <Text style={styles.weekCardTitle}>Week {week.week_number}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveWeek(index)}
                      style={styles.removeWeekButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Week Title</Text>
                    <TextInput
                      style={styles.reportInput}
                      value={week.title}
                      onChangeText={(text) => handleUpdateWeek(index, 'title', text)}
                      placeholder={`Week ${week.week_number} title`}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.reportInput, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={week.description}
                      onChangeText={(text) => handleUpdateWeek(index, 'description', text)}
                      placeholder="What will students learn this week?"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Learning Objectives</Text>
                    <TextInput
                      style={[styles.reportInput, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={week.objectives}
                      onChangeText={(text) => handleUpdateWeek(index, 'objectives', text)}
                      placeholder="Key learning objectives..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Tasks</Text>
                    <TextInput
                      style={[styles.reportInput, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={week.tasks}
                      onChangeText={(text) => handleUpdateWeek(index, 'tasks', text)}
                      placeholder="Tasks and activities..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
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
              }}
            >
              <MaterialIcons name="close" size={20} color="#6b7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addEventButton, loading && styles.submitButtonDisabled]}
              onPress={handleCreatePlan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="assignment" size={20} color="#ffffff" />
                  <Text style={styles.addEventButtonText}>Create Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Existing Plans */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleSmall}>My Training Plans ({plans.length})</Text>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Training Plans Yet</Text>
            <Text style={styles.emptyStateText}>Create your first training plan above to get started.</Text>
          </View>
        ) : (
          plans.map((plan: any) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={[styles.statusBadge, 
                  plan.status === 'active' && styles.statusActive,
                  plan.status === 'draft' && styles.statusDraft,
                  plan.status === 'completed' && styles.statusCompleted,
                  plan.status === 'cancelled' && styles.statusCancelled
                ]}>
                  <Text style={styles.statusBadgeText}>{plan.status}</Text>
                </View>
              </View>

              <View style={styles.planInfo}>
                <Text style={styles.planInfoLabel}>Internship:</Text>
                <Text style={styles.planInfoValue}>{plan.internship_title}</Text>
              </View>

              {plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}

              <View style={styles.planStats}>
                <View style={styles.planStatItem}>
                  <MaterialIcons name="calendar-today" size={18} color="#6b7280" />
                  <Text style={styles.planStatText}>{plan.duration_weeks || 0} weeks</Text>
                </View>
                {plan.weeks_count !== undefined && (
                  <View style={styles.planStatItem}>
                    <MaterialIcons name="assignment" size={18} color="#6b7280" />
                    <Text style={styles.planStatText}>{plan.weeks_count || 0} weeks planned</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => loadPlanDetails(plan.id)}
              >
                <MaterialIcons name="visibility" size={18} color="#1e3a8a" />
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />

        {/* Plan Details Modal */}
        <Modal
          visible={showPlanWeeksModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setShowPlanWeeksModal(false);
            setSelectedPlan(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPlan?.title || 'Plan Details'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPlanWeeksModal(false);
                  setSelectedPlan(null);
                }}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Plan Info */}
              {selectedPlan && (
                <>
                  <View style={styles.planDetailCard}>
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Internship:</Text>
                      <Text style={styles.planDetailValue}>{selectedPlan.internship_title}</Text>
                    </View>
                    
                    {selectedPlan.company_name && (
                      <View style={styles.planDetailRow}>
                        <Text style={styles.planDetailLabel}>Company:</Text>
                        <Text style={styles.planDetailValue}>{selectedPlan.company_name}</Text>
                      </View>
                    )}
                    
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Duration:</Text>
                      <Text style={styles.planDetailValue}>{selectedPlan.duration_weeks} weeks</Text>
                    </View>
                    
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Status:</Text>
                      <View style={[styles.statusBadge, 
                        selectedPlan.status === 'active' && styles.statusActive,
                        selectedPlan.status === 'draft' && styles.statusDraft,
                        selectedPlan.status === 'completed' && styles.statusCompleted,
                        selectedPlan.status === 'cancelled' && styles.statusCancelled
                      ]}>
                        <Text style={styles.statusBadgeText}>{selectedPlan.status}</Text>
                      </View>
                    </View>
                    
                    {selectedPlan.description && (
                      <View style={styles.planDetailRowFull}>
                        <Text style={styles.planDetailLabel}>Description:</Text>
                        <Text style={styles.planDetailValueFull}>{selectedPlan.description}</Text>
                      </View>
                    )}
                  </View>

                  {/* Weekly Breakdown */}
                  <View style={styles.weeksTimelineHeader}>
                    <Text style={styles.weeksTimelineTitle}>Weekly Breakdown</Text>
                  </View>

                  {selectedPlan.weeks && selectedPlan.weeks.length > 0 ? (
                    selectedPlan.weeks.map((week: any) => (
                      <View key={week.id} style={styles.weekDetailCard}>
                        <Text style={styles.weekDetailTitle}>
                          Week {week.week_number}: {week.title}
                        </Text>
                        
                        {week.description && (
                          <Text style={styles.weekDetailDesc}>{week.description}</Text>
                        )}
                        
                        {week.objectives && (
                          <View style={styles.weekSection}>
                            <Text style={styles.weekSectionLabel}>Objectives:</Text>
                            <Text style={styles.weekSectionText}>{week.objectives}</Text>
                          </View>
                        )}
                        
                        {week.tasks && (
                          <View style={styles.weekSection}>
                            <Text style={styles.weekSectionLabel}>Tasks:</Text>
                            <Text style={styles.weekSectionText}>{week.tasks}</Text>
                          </View>
                        )}
                        
                        {week.task_description && (
                          <View style={styles.weekSection}>
                            <Text style={styles.weekSectionLabel}>Task Description:</Text>
                            <Text style={styles.weekSectionText}>{week.task_description}</Text>
                          </View>
                        )}
                        
                        {week.resources && (
                          <View style={styles.weekSection}>
                            <Text style={styles.weekSectionLabel}>Resources:</Text>
                            <Text style={styles.weekSectionText}>{week.resources}</Text>
                          </View>
                        )}
                        
                        {week.deliverables && (
                          <View style={styles.weekSection}>
                            <Text style={styles.weekSectionLabel}>Deliverables:</Text>
                            <Text style={styles.weekSectionText}>{week.deliverables}</Text>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="info-outline" size={48} color="#d1d5db" />
                      <Text style={styles.emptyStateText}>No weekly breakdown available for this plan.</Text>
                    </View>
                  )}
                  
                  <View style={{ height: 24 }} />
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  // Render placeholder for other tabs
  const renderPlaceholder = (title: string) => {
    return (
      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>This section is under development</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Coming Soon</Text>
          <Text style={styles.emptyStateText}>
            This feature is currently being developed for mobile.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'profile':
        return renderProfile();
      case 'internships':
        return renderInternships();
      case 'students':
        return renderStudents();
      case 'reports':
        return renderReports();
      case 'schedule':
        return renderSchedule();
      case 'notifications':
        return renderNotifications();
      case 'messages':
        return renderMessages();
      case 'plans':
        return renderPlans();
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
              userType="trainer"
              userData={trainerData}
              activeMenu={activeTab}
              onMenuSelect={(menu) => {
                handleTabChange(menu as TabKey);
                setDrawerVisible(false);
              }}
              onLogout={() => {
                setDrawerVisible(false);
                onLogout?.();
              }}
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
            <Text style={styles.headerTitle}>Trainer Dashboard</Text>
            <Text style={styles.headerSubtitle}>{trainerData.specialization || userData?.full_name}</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      {renderContent()}

      {/* Tasks Modal */}
      <Modal
        visible={showTasksModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTasksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Task Submissions - {selectedStudent?.full_name}
              </Text>
              <TouchableOpacity
                onPress={() => setShowTasksModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseIconText}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingTasks ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1e3a8a" />
                  <Text style={styles.loadingText}>Loading submissions...</Text>
                </View>
              ) : taskSubmissions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No Submissions</Text>
                  <Text style={styles.emptyStateText}>
                    This student hasn't submitted any tasks yet.
                  </Text>
                </View>
              ) : (
                taskSubmissions.map((submission) => (
                  <View key={submission.id} style={styles.taskCard}>
                    <View style={styles.taskCardHeader}>
                      <Text style={styles.taskTitle}>{submission.task_title}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBadge(submission.status).bgColor }
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          { color: getStatusBadge(submission.status).color }
                        ]}>
                          {getStatusBadge(submission.status).text}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.taskCardInfo}>
                      <Text style={styles.taskInfoText}>
                        <Text style={styles.taskInfoLabel}>Plan:</Text> {submission.plan_title}
                      </Text>
                      <Text style={styles.taskInfoText}>
                        <Text style={styles.taskInfoLabel}>Week:</Text> {submission.week_number}
                      </Text>
                      <Text style={styles.taskInfoText}>
                        <Text style={styles.taskInfoLabel}>Submitted:</Text>{' '}
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => handleReviewSubmission(submission)}
                    >
                      <Text style={styles.reviewButtonText}>
                        {submission.status === 'pending' ? 'Review' : 'View Review'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButtonBottom}
                onPress={() => setShowTasksModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalContainer}>
              <View style={styles.modalHeaderGradient}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <View style={styles.modalIconCircle}>
                      <MaterialIcons name="rate-review" size={24} color="#ffffff" />
                    </View>
                    <Text style={styles.modalTitle}>Review Submission</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowReviewModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <MaterialIcons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedSubmission && (
                  <>
                    {/* Task Details */}
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewSectionTitle}>Task Details</Text>
                      <Text style={styles.reviewTaskTitle}>
                        {selectedSubmission.task_title}
                      </Text>
                      <View style={styles.reviewInfoRow}>
                        <Text style={styles.reviewInfoLabel}>Student:</Text>
                        <Text style={styles.reviewInfoValue}>
                          {selectedSubmission.student_name}
                        </Text>
                      </View>
                      <View style={styles.reviewInfoRow}>
                        <Text style={styles.reviewInfoLabel}>Plan:</Text>
                        <Text style={styles.reviewInfoValue}>
                          {selectedSubmission.plan_title}
                        </Text>
                      </View>
                      <View style={styles.reviewInfoRow}>
                        <Text style={styles.reviewInfoLabel}>Week:</Text>
                        <Text style={styles.reviewInfoValue}>
                          {selectedSubmission.week_number}
                        </Text>
                      </View>
                      <View style={styles.reviewInfoRow}>
                        <Text style={styles.reviewInfoLabel}>Submitted:</Text>
                        <Text style={styles.reviewInfoValue}>
                          {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {/* Submission Content */}
                    <View style={styles.reviewSection}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialIcons name="description" size={20} color="#1e3a8a" />
                        <Text style={styles.reviewSectionTitle}>Submission Content</Text>
                      </View>
                      
                      {selectedSubmission.submission_text && (
                        <View style={styles.submissionTextContainer}>
                          <Text style={styles.submissionText}>
                            {selectedSubmission.submission_text}
                          </Text>
                        </View>
                      )}
                      
                      {selectedSubmission.submission_link && (
                        <View style={styles.submissionLinkContainer}>
                          <View style={styles.linkIconWrapper}>
                            <MaterialIcons name="link" size={18} color="#1e3a8a" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.submissionLinkLabel}>Link:</Text>
                            <Text style={styles.submissionLink}>
                              {selectedSubmission.submission_link}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedSubmission.submission_file && (
                        <View style={styles.submissionFileContainer}>
                          <MaterialIcons name="attach-file" size={20} color="#1e3a8a" />
                          <Text style={styles.submissionFileName}>
                            File attached
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Review Form */}
                    <View style={styles.reviewSection}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialIcons name="edit" size={20} color="#1e3a8a" />
                        <Text style={styles.reviewSectionTitle}>Your Review</Text>
                      </View>
                      
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Status</Text>
                        <View style={styles.statusButtonGroup}>
                          <TouchableOpacity
                            style={[
                              styles.statusButton,
                              reviewStatus === 'approved' && styles.statusButtonApproved,
                              { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }
                            ]}
                            onPress={() => setReviewStatus('approved')}
                          >
                            <MaterialIcons 
                              name="check-circle" 
                              size={20} 
                              color={reviewStatus === 'approved' ? '#ffffff' : '#10b981'} 
                            />
                            <Text style={[
                              styles.statusButtonText,
                              reviewStatus === 'approved' && styles.statusButtonTextActive
                            ]}>
                              Approve
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.statusButton,
                              reviewStatus === 'rejected' && styles.statusButtonRejected,
                              { borderTopRightRadius: 12, borderBottomRightRadius: 12 }
                            ]}
                            onPress={() => setReviewStatus('rejected')}
                          >
                            <MaterialIcons 
                              name="cancel" 
                              size={20} 
                              color={reviewStatus === 'rejected' ? '#ffffff' : '#ef4444'} 
                            />
                            <Text style={[
                              styles.statusButtonText,
                              reviewStatus === 'rejected' && styles.statusButtonTextActive
                            ]}>
                              Request Revision
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Comment for Student</Text>
                        <TextInput
                          style={styles.reviewTextInput}
                          value={reviewComment}
                          onChangeText={setReviewComment}
                          placeholder="Provide feedback to the student..."
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                          returnKeyType="default"
                          blurOnSubmit={false}
                        />
                      </View>

                      {message.text && message.type && (
                        <View style={[
                          styles.messageBox,
                          message.type === 'success' ? styles.messageBoxSuccess : styles.messageBoxError
                        ]}>
                          <Text style={styles.messageText}>{message.text}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopWidth: 1, borderTopColor: '#e5e7eb' }]}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowReviewModal(false)}
                  disabled={loading}
                >
                  <MaterialIcons name="close" size={20} color="#6b7280" />
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, loading && styles.modalSubmitButtonDisabled]}
                  onPress={submitReview}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <MaterialIcons name="send" size={20} color="#ffffff" />
                  )}
                  <Text style={styles.modalSubmitButtonText}>
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successMessage: {
    backgroundColor: '#d1fae5',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
  },
  messageText: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
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
    fontSize: 15,
    color: '#1f2937',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addEventButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addEventButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Search & Filters (Internships)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#1e3a8a',
  },
  filterChipText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  // KPI Styles
  kpiGrid: {
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  kpiCardBlue: {
    backgroundColor: '#3b82f6',
  },
  kpiCardGreen: {
    backgroundColor: '#10b981',
  },
  kpiCardPurple: {
    backgroundColor: '#8b5cf6',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.95,
    flex: 1,
  },
  kpiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  kpiNumber: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  kpiDescription: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 12,
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  kpiFooterLabel: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.85,
  },
  kpiFooterValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Quick Actions Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Activity Styles
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Analytics & Charts Styles
  analyticsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  chartTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  // Additional header styles
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 4,
  },
  messageCloseButton: {
    padding: 4,
  },
  // Internships Styles
  internshipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  internshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  companyLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  internshipTitleContainer: {
    flex: 1,
  },
  internshipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#d1fae5',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusActive: {
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#1f2937',
  },
  internshipDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  internshipStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  internshipDescription: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Students Styles
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  studentCardGradient: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#dbeafe',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  pillComplete: {
    backgroundColor: '#d1fae5',
  },
  pillInTraining: {
    backgroundColor: '#dbeafe',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentInfoContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoIconMaterial: {
    marginRight: 8,
  },
  searchIconMaterial: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  studentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
  },
  modalHeaderGradient: {
    backgroundColor: '#1e3a8a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b7280',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalCloseButtonBottom: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    gap: 10,
  },
  modalCancelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
  },
  modalSubmitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    gap: 10,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  modalSubmitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Task Styles
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskCardInfo: {
    marginBottom: 12,
  },
  taskInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  taskInfoLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  reviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Review Modal Styles
  reviewSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  reviewTaskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  reviewInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 100,
  },
  reviewInfoValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  submissionTextContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  submissionText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  submissionLinkContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  linkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  submissionLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  submissionLink: {
    fontSize: 14,
    color: '#1e3a8a',
    textDecorationLine: 'underline',
  },
  submissionFileContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    gap: 10,
  },
  submissionFileName: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  statusButtonGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 65,
    gap: 12,
  },
  statusButtonApproved: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonRejected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  reviewTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  messageBoxSuccess: {
    backgroundColor: '#d1fae5',
  },
  messageBoxError: {
    backgroundColor: '#fee2e2',
  },
  // Reports Styles
  reportFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleMedium: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  // Select Picker Styles (like web select)
  selectPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  selectPickerText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectPickerPlaceholder: {
    color: '#9ca3af',
  },
  selectPickerArrow: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 8,
  },
  // Dropdown List Styles
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownEmpty: {
    padding: 16,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  // Form Row
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  // Number Input
  numberInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  commentsInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitReportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginTop: 20,
  },
  submitReportButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  previousReportsSection: {
    marginTop: 8,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reportStudentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  reportBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reportBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  reportCardBody: {
    gap: 16,
  },
  reportSkillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportSkillItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportSkillLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  reportSkillValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  reportCommentsSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportCommentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  reportComments: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Schedule Styles
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  scheduleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scheduleInfoText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  scheduleStudents: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  studentBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  studentBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentBadgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  badgeBlue: {
    backgroundColor: '#3b82f6',
  },
  badgeGreen: {
    backgroundColor: '#10b981',
  },
  badgePurple: {
    backgroundColor: '#8b5cf6',
  },
  badgeOrange: {
    backgroundColor: '#f59e0b',
  },
  studentCheckboxContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  formHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  textAreaInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  // DateTime Picker Styles
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 14,
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  datePickerBody: {
    padding: 20,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 17,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  datePickerHelper: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  datePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  datePreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
  },
  datePreviewError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  datePreviewTextError: {
    color: '#dc2626',
  },
  datePickerButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeInputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Notification Styles
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a8a',
    backgroundColor: '#f0f9ff',
  },
  notificationContent: {
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  // Training Plans Styles
  weeksSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  weeksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeksSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  addWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWeekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  emptyWeeksState: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyWeeksText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  weekCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  weekCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  removeWeekButton: {
    padding: 4,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusDraft: {
    backgroundColor: '#6b7280',
  },
  statusCompleted: {
    backgroundColor: '#3b82f6',
  },
  statusCancelled: {
    backgroundColor: '#ef4444',
  },
  planInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 6,
  },
  planInfoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  planStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  planStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  planStatText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    marginLeft: 6,
  },
  // Plan Details Modal Styles
  planDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  planDetailRowFull: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  planDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  planDetailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  planDetailValueFull: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 6,
    lineHeight: 20,
  },
  weeksTimelineHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  weeksTimelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  weekDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDetailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  weekDetailDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  weekSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  weekSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  weekSectionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatSidebar: {
    width: 200,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  chatSidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactItemSelected: {
    backgroundColor: '#eff6ff',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  contactAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatMain: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatHeaderRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageItemSent: {
    justifyContent: 'flex-end',
  },
  messageItemReceived: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleSent: {
    backgroundColor: '#dcf8c6',
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTextSent: {
    color: '#000',
  },
  messageTextReceived: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  // Toggle contacts styles
  chatSidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  chatMainExpanded: {
    flex: 1,
  },
  showContactsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  showContactsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TrainerDashboardScreen;

