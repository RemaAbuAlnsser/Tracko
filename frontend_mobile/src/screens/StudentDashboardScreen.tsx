import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import DrawerMenu from '../components/DrawerMenu';
import {
  loadChatMessages,
  sendChatMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount,
} from '../utils/chatService';

interface StudentDashboardScreenProps {
  userData?: any;
  onLogout?: () => void;
}

type TabKey = 'dashboard' | 'profile' | 'cv-upload' | 'internships' | 'saved' | 'notifications' | 'messages' | 'plans';

const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Student data
  const [studentData, setStudentData] = useState({
    id: null,
    full_name: '',
    email: '',
    phone: '',
    major: '',
    gpa: '',
    academic_year: '',
    skills: '',
    university_id: null,
    student_img: null as string | null,
  });
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    applicationsCount: 0,
    matchedInternshipsCount: 0,
    acceptedApplicationsCount: 0,
  });
  
  // Internships and applications
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [weekStatuses, setWeekStatuses] = useState<any>({});
  
  // Solution Upload
  const [selectedSolutionFile, setSelectedSolutionFile] = useState<any>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionLink, setSolutionLink] = useState('');
  const [uploadingSubmission, setUploadingSubmission] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState({ type: '', text: '' });
  
  // Weekly Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportWeekNumber, setReportWeekNumber] = useState(1);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });
  
  // CV Upload
  const [selectedCV, setSelectedCV] = useState<any>(null);
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false);
  
  // Internship Details Modal
  const [selectedInternship, setSelectedInternship] = useState<any>(null);
  const [showInternshipDetails, setShowInternshipDetails] = useState(false);
  
  // Hours Modal for Application
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState('20');
  
  // Chat/Messages state
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [showContactsList, setShowContactsList] = useState(true);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedStudentData, setEditedStudentData] = useState(studentData);

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

  useEffect(() => {
    if (userData?.id) {
      fetchStudentData();
      loadSavedInternships();
      loadContacts(); // Load contacts on app start to get initial unread count
    }
  }, [userData]);

  useEffect(() => {
    if (studentData.id) {
      fetchDashboardStats();
      fetchApplications();
    }
  }, [studentData.id]);

  useEffect(() => {
    if (activeTab === 'internships' && userData?.id && studentData.id) {
      fetchInternships();
      fetchApplications();
    }
  }, [activeTab, userData?.id, studentData.id]);


  useEffect(() => {
    if (activeTab === 'saved' && userData?.id) {
      loadSavedInternships();
    }
  }, [activeTab, userData?.id]);

  useEffect(() => {
    console.log('🔄 Messages tab effect triggered:', {
      activeTab,
      hasUserData: !!userData?.id,
      hasStudentData: !!studentData.id
    });
    
    if (activeTab === 'messages' && userData?.id) {
      console.log('✅ Loading contacts...');
      loadContacts();
    }
  }, [activeTab, userData?.id, studentData.id]);

  useEffect(() => {
    if (activeTab === 'notifications' && userData?.id) {
      fetchNotifications();
    }
  }, [activeTab, userData?.id]);

  useEffect(() => {
    console.log('🔄 Plans tab effect triggered:', {
      activeTab,
      hasStudentData: !!studentData.id,
      studentId: studentData.id,
      hasUserData: !!userData?.id
    });
    
    if (activeTab === 'plans') {
      // If studentData is not loaded yet, fetch it first
      if (!studentData.id && userData?.id) {
        console.log('⏳ Student data not loaded, fetching first...');
        fetchStudentData().then(() => {
          console.log('✅ Student data loaded, now loading plans...');
        });
      } else if (studentData.id) {
        console.log('✅ Loading training plans and reports...');
        loadTrainingPlans();
        loadWeeklyReports();
      }
    }
  }, [activeTab, studentData.id, userData?.id]);

  // Subscribe to real-time messages to update unread counter
  useEffect(() => {
    if (!userData?.id) return;

    console.log('🔔 Subscribing to real-time messages for user:', userData.id);
    
    const channel = subscribeToMessages(userData.id, async (newMessage) => {
      console.log('📨 New message received:', newMessage);
      
      // Update unread count for the sender
      const senderId = newMessage.sender_id;
      
      setContacts(prevContacts => {
        const updatedContacts = prevContacts.map(contact => {
          if (contact.user_id === senderId) {
            return { ...contact, unread_count: (contact.unread_count || 0) + 1 };
          }
          return contact;
        });
        
        // Recalculate total unread
        const totalUnread = updatedContacts.reduce((sum, contact) => sum + (contact.unread_count || 0), 0);
        setTotalUnreadMessages(totalUnread);
        console.log('📬 Updated unread count. New total:', totalUnread);
        
        return updatedContacts;
      });
      
      // If we're viewing messages from this sender, reload them
      if (selectedContactId === senderId) {
        const chatMessages = await loadChatMessages(userData.id, senderId);
        setMessages(chatMessages);
      }
    });

    return () => {
      console.log('🔕 Unsubscribing from messages');
      unsubscribeFromMessages(channel);
    };
  }, [userData?.id, selectedContactId]);

  const fetchStudentData = async () => {
    try {
      console.log('👨‍🎓 Fetching student data for user:', userData.id);
      // Use the same API as web version to get student record by user_id
      const response = await fetch(`${baseUrl}/api/students/user/${userData.id}`);
      const data = await response.json();
      
      console.log('👨‍🎓 Student data response:', data);
      
      if (data.success && data.student) {
        // Use student record from the response
        setStudentData({
          id: data.student.id, // This is the student.id we need for training plans
          full_name: data.student.full_name || userData.full_name || '',
          email: data.student.email || userData.email || '',
          phone: data.student.phone || '',
          major: data.student.major || '',
          gpa: data.student.gpa || '',
          academic_year: data.student.academic_year || '',
          skills: data.student.skills || '',
          university_id: data.student.university_id || null,
          student_img: data.student.student_img || null,
        });
        setEditedStudentData({
          id: data.student.id,
          full_name: data.student.full_name || userData.full_name || '',
          email: data.student.email || userData.email || '',
          phone: data.student.phone || '',
          major: data.student.major || '',
          gpa: data.student.gpa || '',
          academic_year: data.student.academic_year || '',
          skills: data.student.skills || '',
          university_id: data.student.university_id || null,
          student_img: data.student.student_img || null,
        });
        
        // Load CV analysis if exists
        if (data.student.id) {
          await loadCVAnalysis(data.student.id);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const loadCVAnalysis = async (studentId?: number) => {
    const idToUse = studentId || studentData.id;
    if (!idToUse) return;
    
    try {
      console.log('📄 Loading CV analysis for student:', idToUse);
      const response = await fetch(`${baseUrl}/api/cvs/student-id/${idToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 CV analysis response:', data);
        
        if (data.success && data.cv && data.cv.analysis_data) {
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
      } else if (response.status === 404) {
        console.log('ℹ️ No CV found for this student yet');
      }
    } catch (error) {
      console.error('Error loading CV analysis:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/students/${studentData.id}/statistics`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const runAIMatching = async (userId: number) => {
    try {
      console.log('🤖 Running AI matching for user:', userId);
      const response = await fetch(`${baseUrl}/api/matching/student/${userId}/run`, {
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

  const fetchInternships = async (forceRefresh = false) => {
    if (!userData?.id) return;
    
    try {
      setLoading(true);
      console.log('🎯 Loading AI-matched internships for user:', userData.id);
      
      // First, try to load existing matches
      const response = await fetch(`${baseUrl}/api/matching/student/${userData.id}`);
      const data = await response.json();
      
      console.log('🎯 Internships response:', data);
      
      // If no matches found or force refresh, run AI matching
      if (forceRefresh || !data.success || !data.matches || data.matches.length === 0) {
        console.log('🤖 Running AI matching to generate/refresh matches...');
        await runAIMatching(userData.id);
        
        // Reload matches after AI matching
        const refreshResponse = await fetch(`${baseUrl}/api/matching/student/${userData.id}`);
        const refreshData = await refreshResponse.json();
        
        if (refreshResponse.ok && refreshData.success) {
          const internshipsWithScores = (refreshData.matches || []).map((internship: any) => ({
            ...internship,
            match_percentage: internship.match_percentage || internship.match_score || internship.score || 0,
          }));
          setInternships(internshipsWithScores);
        }
      } else {
        // Use existing matches
        console.log('✅ Using existing AI matches from database');
        console.log('📊 Sample match data:', data.matches[0]); // Debug: show first match
        const internshipsWithScores = (data.matches || []).map((internship: any) => {
          console.log('🔍 Processing internship:', {
            id: internship.id,
            internship_id: internship.internship_id,
            title: internship.internship_title
          });
          return {
            ...internship,
            match_percentage: internship.match_percentage || internship.match_score || internship.score || 0,
          };
        });
        setInternships(internshipsWithScores);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!studentData.id) return;
    
    try {
      console.log('📝 Loading applications for student:', studentData.id);
      const response = await fetch(`${baseUrl}/api/students/${studentData.id}/applications`);
      const data = await response.json();
      
      console.log('📝 Applications response:', data);
      
      if (response.ok && data.success) {
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const loadSavedInternships = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('📚 Loading saved internships...');
      const response = await fetch(`${baseUrl}/api/matching/student/${userData.id}/saved`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Saved internships loaded:', data.data);
        setSavedInternships(data.data || []);
      }
    } catch (error) {
      console.error('Error loading saved internships:', error);
    }
  };

  const loadContacts = async () => {
    if (!userData?.id) {
      console.log('❌ No userData.id, cannot load contacts');
      return;
    }
    
    try {
      console.log('📞 ========== LOADING CONTACTS ==========');
      console.log('📞 User ID:', userData.id);
      console.log('📞 Student Data:', studentData);
      
      // Array to hold all contacts (trainers + university)
      const allContacts: any[] = [];
      
      // Load trainers
      console.log('📞 Fetching trainers from:', `${baseUrl}/api/students/${userData.id}/trainers`);
      const response = await fetch(`${baseUrl}/api/students/${userData.id}/trainers`);
      const data = await response.json();
      
      console.log('📞 Trainers API response:', data);
      console.log('📞 Number of trainers:', data.trainers?.length || 0);
      
      if (data.success && data.trainers) {
        const trainersWithUnread = await Promise.all(
          (data.trainers || []).map(async (trainer: any) => {
            console.log('👤 Trainer data:', {
              full_name: trainer.full_name,
              user_id: trainer.user_id,
              profile_image: trainer.profile_image,
              has_profile_image: !!trainer.profile_image
            });
            
            let unreadCount = 0;
            try {
              unreadCount = await getUnreadCount(userData.id, trainer.user_id);
            } catch (error) {
              console.error('Error getting unread count:', error);
            }
            
            return {
              ...trainer,
              type: 'trainer',
              unread_count: unreadCount,
            };
          })
        );
        allContacts.push(...trainersWithUnread);
      }
      
      // Load university - always try to load university ID 1 (An-Najah) as default
      console.log('🔍 Checking for university_id in studentData:', {
        university_id: studentData.university_id,
        studentData: studentData
      });
      
      // Use student's university_id if exists, otherwise default to 1 (An-Najah)
      const universityId = studentData.university_id || 1;
      
      try {
        console.log('🎓 Loading university:', universityId);
        const universityResponse = await fetch(`${baseUrl}/api/universities/${universityId}`);
        const universityData = await universityResponse.json();
        
        console.log('🎓 University response:', universityData);
        
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
          } else {
            let unreadCount = 0;
            try {
              unreadCount = await getUnreadCount(userData.id, university.user_id);
            } catch (error) {
              console.error('Error getting university unread count:', error);
            }
            
            // Add university at the beginning of contacts
            allContacts.unshift({
              ...university,
              type: 'university',
              full_name: university.name,
              unread_count: unreadCount,
            });
            
            console.log('✅ University added to contacts');
          }
        }
      } catch (universityError) {
        console.error('Error loading university:', universityError);
      }
      
      console.log('✅ Total contacts loaded:', allContacts.length);
      console.log('✅ Contacts array:', allContacts);
      console.log('========================================\n');
      
      // Calculate total unread messages
      const totalUnread = allContacts.reduce((sum, contact) => sum + (contact.unread_count || 0), 0);
      console.log('📬 Total unread messages:', totalUnread);
      setTotalUnreadMessages(totalUnread);
      
      setContacts(allContacts);
      
      // Auto-select first contact if none selected
      if (allContacts.length > 0 && !selectedContactId) {
        console.log('📌 Auto-selecting first contact:', allContacts[0].full_name);
        setSelectedContactId(allContacts[0].user_id);
        loadMessagesForContact(allContacts[0].user_id);
      } else if (allContacts.length === 0) {
        console.log('⚠️ No contacts available');
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
    }
  };

  const loadMessagesForContact = async (contactId: number) => {
    if (!userData?.id || !contactId) return;
    
    try {
      console.log('💬 Loading messages between:', userData.id, 'and:', contactId);
      const chatMessages = await loadChatMessages(userData.id, contactId);
      setMessages(chatMessages);
      await markMessagesAsRead(contactId, userData.id);
      
      // Update unread count for this contact to 0 and recalculate total
      setContacts(prevContacts => {
        console.log('📊 Before update - contacts:', prevContacts.map(c => ({ 
          name: c.full_name, 
          user_id: c.user_id, 
          unread: c.unread_count 
        })));
        
        const updatedContacts = prevContacts.map(contact => 
          contact.user_id === contactId 
            ? { ...contact, unread_count: 0 }
            : contact
        );
        
        console.log('📊 After update - contacts:', updatedContacts.map(c => ({ 
          name: c.full_name, 
          user_id: c.user_id, 
          unread: c.unread_count 
        })));
        
        // Recalculate total unread
        const totalUnread = updatedContacts.reduce((sum, contact) => sum + (contact.unread_count || 0), 0);
        console.log('📬 New total unread messages:', totalUnread);
        setTotalUnreadMessages(totalUnread);
        
        return updatedContacts;
      });
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !selectedContactId || !userData?.id) return;

    try {
      setNewMessage('');
      const result = await sendChatMessage(userData.id, selectedContactId, trimmed);
      
      if (result.success && result.data && result.data[0]) {
        setMessages(prev => [...prev, result.data[0]]);
      } else {
        setNewMessage(trimmed);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(trimmed);
    }
  };

  const loadTrainingPlans = async () => {
    if (!studentData.id) {
      console.log('❌ No student ID, cannot load training plans');
      return;
    }
    
    try {
      console.log('📋 Loading training plans for student:', studentData.id);
      const response = await fetch(`${baseUrl}/api/plans/student/${studentData.id}`);
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

  const loadWeekStatuses = async (planId: number) => {
    if (!studentData.id || !planId) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/task-submissions/student/${studentData.id}/plan/${planId}/statuses`);
      const data = await response.json();
      
      if (data.success && data.weekStatuses) {
        // Create a map of week_id -> status
        const statusMap: any = {};
        data.weekStatuses.forEach((ws: any) => {
          statusMap[ws.week_id] = ws.status;
        });
        
        setWeekStatuses((prev: any) => ({
          ...prev,
          [planId]: statusMap
        }));
      }
    } catch (error) {
      console.error('Error loading week statuses:', error);
    }
  };

  const loadWeeklyReports = async () => {
    if (!studentData.id) return;
    
    try {
      console.log('📚 Loading weekly reports for student:', studentData.id);
      const response = await fetch(`${baseUrl}/api/weekly-reports/student/${studentData.id}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Weekly reports loaded:', data.reports);
        setWeeklyReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading weekly reports:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('🔔 Fetching notifications for user:', userData.id);
      const response = await fetch(`${baseUrl}/api/notifications/user/${userData.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Notifications response:', data);
        setNotifications(data.notifications || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSolutionFilePick = () => {
    Alert.alert(
      'Select Solution File',
      'Choose how to provide your solution',
      [
        {
          text: 'Browse Files',
          onPress: async () => {
            try {
              const { launchImageLibrary } = require('react-native-image-picker');
              
              const result = await launchImageLibrary({
                mediaType: 'mixed',
                selectionLimit: 1,
              });
              
              if (result.assets && result.assets[0]) {
                const file = result.assets[0];
                setSelectedSolutionFile({
                  uri: file.uri,
                  type: file.type || 'application/octet-stream',
                  name: file.fileName || 'solution.pdf',
                  size: file.fileSize || 0,
                });
                console.log('✅ Solution file selected:', file.fileName);
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Failed to select file');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitSolution = async () => {
    if (!selectedTask || !studentData.id) {
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
        formData.append('file', {
          uri: selectedSolutionFile.uri,
          type: selectedSolutionFile.type,
          name: selectedSolutionFile.name,
        } as any);

        const uploadResponse = await fetch(`${baseUrl}/api/upload/file`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
      const planResponse = await fetch(`${baseUrl}/api/plans/${selectedTask.plan_id}`);
      const planData = await planResponse.json();
      
      if (!planData.success || !planData.plan) {
        setSubmissionMessage({ type: 'error', text: 'Failed to get plan information' });
        setUploadingSubmission(false);
        return;
      }

      const trainerId = planData.plan.trainer_id;

      // Submit the solution
      const submitResponse = await fetch(`${baseUrl}/api/task-submissions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentData.id,
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
      console.error('Error submitting solution:', error);
      setSubmissionMessage({ type: 'error', text: 'Server error' });
    } finally {
      setUploadingSubmission(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      setReportMessage({ type: 'error', text: 'Please enter your weekly report' });
      return;
    }

    if (!studentData.id) {
      setReportMessage({ type: 'error', text: 'Student data not found' });
      return;
    }

    setIsSubmittingReport(true);
    setReportMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${baseUrl}/api/weekly-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentData.id,
          week_number: reportWeekNumber,
          report_text: reportText.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Weekly report submitted successfully!' 
        });
        
        // Reset form
        setReportText('');
        setReportWeekNumber(1);
        
        // Reload weekly reports
        await loadWeeklyReports();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowReportModal(false);
          setReportMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: data.message || 'Failed to submit report' 
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setReportMessage({ type: 'error', text: 'Server error' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCVPick = () => {
    Alert.alert(
      'Select CV File',
      'Choose how to provide your CV',
      [
        {
          text: 'Browse Files (Gallery)',
          onPress: async () => {
            try {
              const { launchImageLibrary } = require('react-native-image-picker');
              
              const result = await launchImageLibrary({
                mediaType: 'mixed',
                selectionLimit: 1,
              });
              
              if (result.assets && result.assets[0]) {
                const file = result.assets[0];
                setSelectedCV({
                  uri: file.uri,
                  type: file.type || 'application/pdf',
                  name: file.fileName || 'cv.pdf',
                  size: file.fileSize || 0,
                });
                console.log('✅ File selected:', file.fileName);
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Failed to select file');
            }
          }
        },
        {
          text: 'Use Sample CV',
          onPress: () => {
            // For testing purposes
            setSelectedCV({
              uri: 'sample',
              type: 'application/pdf',
              name: 'sample_cv.pdf',
              size: 50000,
            });
            Alert.alert('Info', 'Sample CV selected for testing');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleCVUpload = async () => {
    if (!selectedCV) {
      Alert.alert('Error', 'Please select a CV file first');
      return;
    }

    if (!userData?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsUploadingCV(true);
    setMessage({ text: '', type: '' });

    try {
      // Step 1: Upload CV
      const formData = new FormData();
      formData.append('cv', {
        uri: selectedCV.uri,
        type: selectedCV.type,
        name: selectedCV.name,
      } as any);

      console.log('📤 Uploading CV...');
      const uploadResponse = await fetch(`${baseUrl}/api/upload/cv`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadData = await uploadResponse.json();
      console.log('📤 Upload response:', uploadData);

      if (!uploadResponse.ok || !uploadData.success) {
        Alert.alert('Error', uploadData.message || 'Failed to upload CV');
        setIsUploadingCV(false);
        return;
      }

      setMessage({ text: 'CV uploaded! Analyzing with AI...', type: 'success' });
      setIsAnalyzingCV(true);

      // Step 2: Analyze CV with AI
      const aiBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      console.log('🤖 Analyzing CV with AI...');
      
      const analyzeResponse = await fetch(`${aiBaseUrl}/analyze-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_path: uploadData.filePath
        }),
      });

      const analyzeData = await analyzeResponse.json();
      console.log('🤖 Analysis response:', analyzeData);

      if (analyzeResponse.ok && analyzeData.success) {
        // Step 3: Save CV record to database
        console.log('💾 Saving CV to database...');
        const saveCVResponse = await fetch(`${baseUrl}/api/cvs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userData.id,
            cv_file: uploadData.filePath,
            analysis_data: analyzeData.analysis
          }),
        });

        const saveCVData = await saveCVResponse.json();
        console.log('💾 Save response:', saveCVData);

        if (saveCVResponse.ok && saveCVData.success) {
          setMessage({ 
            text: 'CV analyzed successfully!', 
            type: 'success' 
          });
        } else {
          setMessage({ 
            text: 'CV analyzed! (DB save failed)', 
            type: 'success' 
          });
        }
        
        // Set analysis results to display
        setCvAnalysis(analyzeData.analysis);
        setSelectedCV(null);
        
        Alert.alert('Success', 'CV uploaded and analyzed successfully!');
      } else {
        Alert.alert('Error', analyzeData.message || 'AI analysis failed, but CV was uploaded');
      }
    } catch (error) {
      console.error('CV upload/analysis error:', error);
      Alert.alert('Error', 'Failed to process CV');
    } finally {
      setIsUploadingCV(false);
      setIsAnalyzingCV(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cv-upload' && studentData.id && !cvAnalysis) {
      loadCVAnalysis(studentData.id);
    }
  }, [activeTab, studentData.id]);

  const handleViewDetails = async (internship: any) => {
    try {
      // ✅ استخدام internship_id من الـ match record
      const internshipId = internship.internship_id;
      
      if (!internshipId) {
        console.error('❌ No internship_id found in:', internship);
        Alert.alert('Error', 'Internship ID not found');
        return;
      }
      
      console.log('📋 Loading internship details for ID:', internshipId);
      console.log('📋 Original match record:', internship);
      
      // Fetch full internship details
      const response = await fetch(`${baseUrl}/api/internships/${internshipId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const fullInternship = {
          ...data.internship,
          internship_id: internshipId, // ✅ استخدام الـ ID الصحيح من الـ match
          match_percentage: internship.match_percentage,
          matched_skills: internship.matched_skills,
          matched_categories: internship.matched_categories,
          isSaved: internship.saved === 1 || internship.saved === true,
        };
        
        console.log('✅ Full internship details loaded with internship_id:', internshipId);
        console.log('✅ fullInternship.internship_id:', fullInternship.internship_id);
        console.log('✅ fullInternship.id:', fullInternship.id);
        setSelectedInternship(fullInternship);
        setShowInternshipDetails(true);
      } else {
        Alert.alert('Error', 'Failed to load internship details');
      }
    } catch (error) {
      console.error('Error loading internship details:', error);
      Alert.alert('Error', 'Failed to load internship details');
    }
  };

  const handleCloseDetails = () => {
    setShowInternshipDetails(false);
    setSelectedInternship(null);
  };

  const handleApplyInternship = async (internship?: any) => {
    // إذا تم تمرير internship من القائمة، استخدمه. وإلا استخدم selectedInternship من الـ modal
    const internshipToApply = internship || selectedInternship;
    
    if (!internshipToApply || !userData?.id) {
      console.error('❌ No internship or user data');
      return;
    }

    console.log(`\n✅ ========== APPLY INTERNSHIP ==========`);
    console.log(`Called from:`, internship ? 'List Button' : 'Modal Button');
    console.log(`internship_id:`, internshipToApply.internship_id);
    console.log(`User ID: ${userData.id}`);
    console.log(`==========================================\n`);

    // التأكد من وجود internship_id
    if (!internshipToApply.internship_id) {
      console.error('❌ No internship_id found');
      Alert.alert('Error', 'Cannot apply: Internship ID not found');
      return;
    }

    // ✅ Check if student has an accepted application
    const hasAcceptedApplication = applications.some(app => app.status === 'accepted');
    
    if (hasAcceptedApplication) {
      Alert.alert(
        'Cannot Apply',
        'You already have an accepted internship application. You must complete your current internship before applying to a new one.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    // إذا تم التقديم من القائمة، حفظ الـ internship في selectedInternship
    if (internship) {
      setSelectedInternship(internship);
    }
    
    // فتح modal إدخال عدد الساعات
    setHoursPerWeek('20');
    setShowHoursModal(true);
  };

  const handleConfirmApplication = async () => {
    if (!selectedInternship || !userData?.id) return;

    console.log(`\n🔍 ========== DEBUG SELECTED INTERNSHIP ==========`);
    console.log(`Selected Internship:`, selectedInternship);
    console.log(`internship_id:`, selectedInternship.internship_id);
    console.log(`id:`, selectedInternship.id);
    console.log(`================================================\n`);

    // ✅ استخدام internship_id فقط (وهو الـ ID الصحيح للتدريب في جدول Internships)
    const internshipId = selectedInternship.internship_id;
    const hours = parseInt(hoursPerWeek || '0');
    
    if (!internshipId) {
      console.error('❌ No internship_id found in selectedInternship:', selectedInternship);
      Alert.alert('Error', 'Internship ID not found. Please try again.');
      return;
    }
    
    if (hours < 20) {
      Alert.alert('Error', 'Hours per week must be at least 20 hours');
      return;
    }

    try {
      console.log(`\n📝 ========== MOBILE APPLY REQUEST ==========`);
      console.log(`User ID: ${userData.id}`);
      console.log(`Internship ID: ${internshipId}`);
      console.log(`Hours per week: ${hours}`);
      console.log(`URL: ${baseUrl}/api/matching/student/${userData.id}/apply/${internshipId}`);
      console.log(`Body:`, JSON.stringify({ hours_per_week: hours }));
      
      const response = await fetch(
        `${baseUrl}/api/matching/student/${userData.id}/apply/${internshipId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hours_per_week: hours }),
        }
      );

      console.log(`Response status: ${response.status}`);
      const data = await response.json();
      console.log(`Response data:`, data);
      console.log(`==========================================\n`);

      if (data.success) {
        Alert.alert('Success', '✅ Application submitted successfully!\nYou can view it in My Applications tab.');
        setShowHoursModal(false);
        setHoursPerWeek('20');
        handleCloseDetails();
        // Refresh applications list
        fetchApplications();
      } else {
        Alert.alert('Error', data.message || 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('❌ Error applying to internship:', error);
      console.error('Error details:', error?.message || error);
      Alert.alert('Error', 'An error occurred while submitting application');
    }
  };

  const handleSaveInternship = async () => {
    if (!selectedInternship || !userData?.id) return;

    // ✅ استخدام internship_id للحفظ/إلغاء الحفظ
    const internshipId = selectedInternship.internship_id;
    
    if (!internshipId) {
      console.error('❌ No internship_id found');
      Alert.alert('Error', 'Internship ID not found');
      return;
    }

    try {
      if (selectedInternship.isSaved) {
        // Unsave the internship
        console.log(`🗑️ Unsaving internship ${internshipId}...`);
        
        const response = await fetch(
          `${baseUrl}/api/matching/student/${userData.id}/unsave/${internshipId}`,
          { method: 'POST' }
        );

        const data = await response.json();

        if (data.success) {
          Alert.alert('Success', '✅ Internship removed from saved list!');
          handleCloseDetails();
          // Remove from saved list
          setSavedInternships(savedInternships.filter(s => s.internship_id !== internshipId));
        } else {
          Alert.alert('Error', 'Failed to unsave internship');
        }
      } else {
        // Save the internship
        console.log(`💾 Saving internship ${internshipId}...`);
        
        const response = await fetch(
          `${baseUrl}/api/matching/student/${userData.id}/save/${internshipId}`,
          { method: 'POST' }
        );

        const data = await response.json();

        if (data.success) {
          Alert.alert('Success', '✅ Internship saved successfully!');
          // Update the selected internship state
          setSelectedInternship({ ...selectedInternship, isSaved: true });
          // Reload saved internships
          loadSavedInternships();
        } else {
          Alert.alert('Error', 'Failed to save internship');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving internship:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData?.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure the edited data includes the correct user_id
      const profileData = {
        ...editedStudentData,
        id: userData.id,
      };
      
      console.log('📱 Updating student profile for user ID:', userData.id);
      console.log('📦 Request body:', profileData);
      
      const response = await fetch(`${baseUrl}/api/students/${userData.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      console.log('✅ Update response:', data);
      
      if (response.ok && data.success) {
        // If data is returned, update state with it
        if (data.data) {
          setStudentData(data.data);
          setEditedStudentData(data.data);
        } else {
          // If no data returned, re-fetch student data
          await fetchStudentData();
        }
        setIsEditingProfile(false);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time message subscription
  useEffect(() => {
    if (!userData?.id) return;

    const channel = subscribeToMessages(userData.id, (newMessage) => {
      if (selectedContactId && 
          newMessage.sender_id === selectedContactId && 
          newMessage.receiver_id === userData.id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    });

    setMessagesChannel(channel);

    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [userData?.id, selectedContactId]);

  // Load messages when contact changes
  useEffect(() => {
    if (selectedContactId) {
      loadMessagesForContact(selectedContactId);
    }
  }, [selectedContactId]);

  const renderDashboard = () => {
    const screenWidth = Dimensions.get('window').width;
    
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.welcomeTitle}>Welcome, {studentData.full_name || userData?.full_name || 'Student'}</Text>
          <Text style={styles.welcomeSubtitle}>Here is an overview of your journey</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Text style={styles.sectionSubtitle}>Track your internship journey</Text>
        
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardBlue]}
            onPress={() => setActiveTab('internships')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Applications</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Total</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.applicationsCount}</Text>
            <Text style={styles.kpiDescription}>Total applications submitted</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardGreen]}
            onPress={() => setActiveTab('internships')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Matched Internships</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Available</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.matchedInternshipsCount}</Text>
            <Text style={styles.kpiDescription}>Recommended for you</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardOrange]}
            onPress={() => setActiveTab('internships')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Accepted</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Success</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.acceptedApplicationsCount}</Text>
            <Text style={styles.kpiDescription}>Accepted applications</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Applications</Text>
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No applications yet</Text>
            <Text style={styles.emptySubtext}>Start applying to internships!</Text>
          </View>
        ) : (
          applications.slice(0, 3).map((app: any) => (
            <View key={app.id} style={styles.applicationCard}>
              <Text style={styles.applicationTitle}>{app.internship_title || app.title}</Text>
              <Text style={styles.applicationCompany}>{app.company_name || app.company}</Text>
              <View style={[
                styles.statusBadge,
                app.status === 'accepted' && styles.statusActive,
                app.status === 'rejected' && styles.statusExpired,
                app.status === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.statusText}>{app.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const getMatchBadgeStyle = (percentage: number) => {
    if (percentage >= 80) return styles.matchExcellent;
    if (percentage >= 60) return styles.matchGood;
    if (percentage >= 40) return styles.matchFair;
    return styles.matchLow;
  };

  const renderInternships = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <View style={styles.headerWithButton}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.dashboardTitle}>AI-Matched Internships</Text>
              <Text style={styles.dashboardSubtitle}>
                Internships matched to your skills and profile - sorted by compatibility
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchInternships(true)}
              disabled={loading}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading AI-matched internships...</Text>
          </View>
        ) : internships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No Internships Available</Text>
            <Text style={styles.emptySubtext}>There are currently no internships from companies partnered with your university.</Text>
          </View>
        ) : (
          internships.map((item: any) => (
            <View key={item.id} style={styles.internshipCard}>
              {/* Match Percentage Badge */}
              <View style={[styles.matchBadge, getMatchBadgeStyle(item.match_percentage)]}>
                <Text style={styles.matchBadgeText}>✓ {Math.round(item.match_percentage)}% Match</Text>
              </View>

              <View style={styles.internshipHeader}>
                <View style={styles.companyLogo}>
                  <Text style={styles.avatarText}>{item.company_name?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.internshipInfo}>
                  <Text style={styles.internshipTitleText}>{item.internship_title || item.title}</Text>
                  <Text style={styles.companyNameText}>{item.company_name}</Text>
                </View>
              </View>

              <View style={styles.internshipDetails}>
                {item.specialization && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🎓 Specialization:</Text>
                    <Text style={styles.detailValue}>{item.specialization || item.internship_specialization}</Text>
                  </View>
                )}
                {item.min_gpa && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📊 Min GPA:</Text>
                    <Text style={[
                      styles.detailValue,
                      studentData.gpa && parseFloat(studentData.gpa) >= parseFloat(item.min_gpa) 
                        ? styles.gpaMatch 
                        : styles.gpaMismatch
                    ]}>
                      {item.min_gpa} {studentData.gpa && `(Your GPA: ${studentData.gpa})`}
                    </Text>
                  </View>
                )}
                {item.work_mode && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {item.work_mode === 'onsite' ? '🏢' : item.work_mode === 'online' ? '💻' : '🔄'} Work Mode:
                    </Text>
                    <Text style={styles.detailValue}>{item.work_mode}</Text>
                  </View>
                )}
                {item.industry && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🏭 Industry:</Text>
                    <Text style={styles.detailValue}>{item.industry}</Text>
                  </View>
                )}
                {item.capacity && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👥 Capacity:</Text>
                    <Text style={styles.detailValue}>{item.capacity} positions</Text>
                  </View>
                )}
              </View>

              {item.description && (
                <View style={styles.internshipDescription}>
                  <Text style={styles.descriptionText}>
                    {item.description.length > 150 
                      ? item.description.substring(0, 150) + '...' 
                      : item.description}
                  </Text>
                </View>
              )}

              {/* Match Details Section */}
              {(item.matched_skills || item.matched_categories) && (
                <View style={styles.matchDetailsSection}>
                  <Text style={styles.matchDetailsTitle}>✨ Why this match?</Text>
                  
                  {/* Matched Skills */}
                  {item.matched_skills && item.matched_skills.length > 0 && (
                    <View style={styles.matchDetailGroup}>
                      <Text style={styles.matchLabel}>Matched Skills:</Text>
                      <View style={styles.skillsContainer}>
                        {item.matched_skills.map((skill: string, idx: number) => (
                          <View key={idx} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>✓ {skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Matched Categories */}
                  {item.matched_categories && Object.keys(item.matched_categories).length > 0 && (
                    <View style={styles.matchDetailGroup}>
                      <Text style={styles.matchLabel}>Matched Categories:</Text>
                      {Object.entries(item.matched_categories).map(([category, skills]: [string, any]) => (
                        <View key={category} style={styles.categoryItem}>
                          <Text style={styles.categoryName}>{category}:</Text>
                          <View style={styles.categorySkills}>
                            {skills.map((skill: string, idx: number) => (
                              <Text key={idx} style={styles.categorySkill}>{skill}</Text>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, styles.viewDetailsButton]}
                onPress={() => handleViewDetails(item)}
              >
                <Text style={styles.buttonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderMessages = () => {
    return (
      <View style={styles.chatContainer}>
        {showContactsList && (
          <View style={styles.chatSidebar}>
            <View style={styles.chatSidebarHeader}>
              <Text style={styles.chatSidebarTitle}>Contacts</Text>
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
              <Text style={styles.emptySubtext}>Contacts will appear here when available</Text>
            </View>
          ) : (
            <ScrollView>
              {contacts.map(contact => (
                <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactItem,
                  selectedContactId === contact.user_id && styles.contactItemActive,
                ]}
                onPress={() => {
                  setSelectedContactId(contact.user_id);
                  loadMessagesForContact(contact.user_id);
                }}
              >
                <View style={[
                  styles.contactAvatar,
                  contact.type === 'university' && { backgroundColor: '#8b5cf6' }
                ]}>
                  {contact.type === 'university' && contact.logo ? (
                    <Image
                      source={{ uri: `${baseUrl}${contact.logo}` }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : contact.type === 'trainer' && contact.profile_image ? (
                    <Image
                      source={{ 
                        uri: contact.profile_image.startsWith('http') 
                          ? contact.profile_image 
                          : `${baseUrl}${contact.profile_image}` 
                      }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {contact.full_name?.charAt(0) || (contact.type === 'university' ? 'U' : 'T')}
                    </Text>
                  )}
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {contact.full_name || 'Contact'}
                    {contact.type === 'university' ? ' 🎓' : ''}
                  </Text>
                  <Text style={styles.contactRole}>{contact.email}</Text>
                </View>
                {contact.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{contact.unread_count}</Text>
                  </View>
                )}
                </TouchableOpacity>
              ))}
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
                {contacts.find(c => c.user_id === selectedContactId)?.full_name || 'Chat'}
              </Text>
              <Text style={styles.chatSubtitle}>Real-time messaging</Text>
            </View>
          </View>

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {selectedContactId ? 'No messages yet. Start the conversation!' : 'Select a contact to start chatting'}
                </Text>
              </View>
            ) : (
              messages.map(msg => {
              const isFromMe = Number(msg.sender_id) === Number(userData?.id);
              const time = new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              return (
                <View
                  key={`message-${msg.id}-${msg.created_at}`}
                  style={[
                    styles.messageItem,
                    isFromMe ? styles.messageItemSent : styles.messageItemReceived,
                  ]}
                >
                  {!isFromMe && (
                    <View style={styles.messageAvatar}>
                      {(() => {
                        const sender = contacts.find(c => c.user_id === Number(msg.sender_id));
                        
                        console.log('🖼️ Message avatar debug:', {
                          sender_id: msg.sender_id,
                          sender_found: !!sender,
                          sender_type: sender?.type,
                          sender_name: sender?.full_name,
                          has_logo: !!sender?.logo,
                          has_profile_image: !!sender?.profile_image,
                          logo: sender?.logo,
                          profile_image: sender?.profile_image
                        });
                        
                        // Always try to show image first
                        const imageUrl = sender?.type === 'university' 
                          ? sender?.logo 
                          : sender?.profile_image;
                        
                        if (imageUrl) {
                          const fullUrl = imageUrl.startsWith('http') 
                            ? imageUrl 
                            : `${baseUrl}${imageUrl}`;
                          
                          console.log('✅ Showing image:', fullUrl);
                          
                          return (
                            <Image
                              source={{ uri: fullUrl }}
                              style={{ width: 32, height: 32, borderRadius: 16 }}
                              onError={(e) => {
                                console.log('❌ Image load error:', fullUrl);
                              }}
                            />
                          );
                        } else {
                          console.log('⚠️ No image URL, showing letter avatar');
                          // Fallback to letter avatar using sender's name
                          const avatarLetter = sender?.full_name?.charAt(0)?.toUpperCase() 
                            || sender?.email?.charAt(0)?.toUpperCase() 
                            || 'U';
                          return (
                            <Text style={styles.avatarText}>
                              {avatarLetter}
                            </Text>
                          );
                        }
                      })()}
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
                    <Text style={styles.messageTime}>
                      {time}
                    </Text>
                  </View>

                  {isFromMe && (
                    <View style={styles.messageAvatar}>
                      {studentData.student_img ? (
                        <Image
                          source={{ uri: `${baseUrl}${studentData.student_img}` }}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {userData?.full_name?.charAt(0)?.toUpperCase() || 'S'}
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
              placeholder="Type your message..."
              value={newMessage}
              onChangeText={setNewMessage}
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

  const renderNotifications = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>Notifications</Text>
          <Text style={styles.dashboardSubtitle}>
            View all your notifications and updates
          </Text> */}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionSubtitle}>{notifications?.length || 0} notifications</Text>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No Notifications Yet</Text>
            <Text style={styles.emptySubtext}>You'll see notifications here when you receive them</Text>
          </View>
        ) : (
          notifications.map((notification) => (
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
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>
              {!notification.is_read && (
                <TouchableOpacity
                  style={styles.markReadButton}
                  onPress={() => markAsRead(notification.id)}
                >
                  <Text style={styles.markReadText}>Mark as Read</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderProfile = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Student Profile</Text>
        
        {message.text ? (
          <View style={[styles.messageBoxStyle, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageTextStyle}>{message.text}</Text>
          </View>
        ) : null}

        <View style={styles.profileSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.full_name : studentData.full_name}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, full_name: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.email : studentData.email}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, email: text })}
              editable={isEditingProfile}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.phone : studentData.phone}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, phone: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.major : studentData.major}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, major: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GPA</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.gpa : studentData.gpa}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, gpa: text })}
              editable={isEditingProfile}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Academic Year</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.academic_year : studentData.academic_year}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, academic_year: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills</Text>
            <TextInput
              style={[styles.input, styles.textArea, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedStudentData.skills : studentData.skills}
              onChangeText={(text) => setEditedStudentData({ ...editedStudentData, skills: text })}
              editable={isEditingProfile}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.buttonRow}>
            {isEditingProfile ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditingProfile(false);
                    setEditedStudentData(studentData);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => {
                  setEditedStudentData(studentData);
                  setIsEditingProfile(true);
                }}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCVUpload = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>CV Upload & AI Analysis</Text>
          <Text style={styles.dashboardSubtitle}>
            Upload your CV to get AI-powered skills analysis and match recommendations
          </Text>
        </View>

        {message.text ? (
          <View style={[styles.messageBoxStyle, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageTextStyle}>{message.text}</Text>
          </View>
        ) : null}

        {/* CV Upload Section */}
        <View style={styles.cvUploadContainer}>
          <View style={styles.cvUploadBox}>
            <Text style={styles.cvUploadIcon}>📄</Text>
            <Text style={styles.cvUploadTitle}>Upload Your CV</Text>
            <Text style={styles.cvUploadDescription}>
              Select your CV file to upload and analyze
            </Text>

            {selectedCV && (
              <View style={styles.cvSelectedFile}>
                <Text style={styles.cvFileName}>📎 {selectedCV.name}</Text>
                <Text style={styles.cvFileSize}>
                  {(selectedCV.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cvChooseButton}
              onPress={handleCVPick}
              disabled={isUploadingCV || isAnalyzingCV}
            >
              <Text style={styles.cvChooseButtonText}>
                {selectedCV ? 'Change File' : 'Choose File'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.cvUploadFormats}>
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </Text>
          </View>

          {selectedCV && (
            <TouchableOpacity
              style={[styles.button, styles.uploadButton]}
              onPress={handleCVUpload}
              disabled={isUploadingCV || isAnalyzingCV}
            >
              {isUploadingCV || isAnalyzingCV ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Upload & Analyze</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* AI Analysis Results */}
        {cvAnalysis && (
          <View style={styles.cvAnalysisResults}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisHeaderTitle}>🤖 AI Analysis Results</Text>
              <TouchableOpacity
                style={styles.clearAnalysisButton}
                onPress={() => setCvAnalysis(null)}
              >
                <Text style={styles.clearAnalysisText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information */}
            {(cvAnalysis.Name || cvAnalysis.Email || cvAnalysis.Phone) && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>👤 Personal Information</Text>
                <View style={styles.analysisItems}>
                  {cvAnalysis.Name && (
                    <View style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>Name:</Text>
                      <Text style={styles.analysisValue}>{cvAnalysis.Name}</Text>
                    </View>
                  )}
                  {cvAnalysis.Email && (
                    <View style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>Email:</Text>
                      <Text style={styles.analysisValue}>{cvAnalysis.Email}</Text>
                    </View>
                  )}
                  {cvAnalysis.Phone && (
                    <View style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>Phone:</Text>
                      <Text style={styles.analysisValue}>{cvAnalysis.Phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Academic Information */}
            {(cvAnalysis.Degree || cvAnalysis.GPA) && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>🎓 Academic Information</Text>
                <View style={styles.analysisItems}>
                  {cvAnalysis.Degree && (
                    <View style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>Degree:</Text>
                      <Text style={styles.analysisValue}>{cvAnalysis.Degree}</Text>
                    </View>
                  )}
                  {cvAnalysis.GPA && (
                    <View style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>GPA:</Text>
                      <Text style={styles.analysisValue}>{cvAnalysis.GPA}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Skills */}
            {cvAnalysis.Skills && cvAnalysis.Skills.length > 0 && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>💼 Skills</Text>
                <View style={styles.skillsGrid}>
                  {cvAnalysis.Skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillBadgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Experience */}
            {cvAnalysis.Experience && cvAnalysis.Experience.length > 0 && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>💼 Experience</Text>
                {cvAnalysis.Experience.map((exp: any, index: number) => (
                  <View key={index} style={styles.experienceItem}>
                    {exp.Position && (
                      <Text style={styles.experiencePosition}>{exp.Position}</Text>
                    )}
                    {exp.Company && (
                      <Text style={styles.experienceCompany}>{exp.Company}</Text>
                    )}
                    {exp.Duration && (
                      <Text style={styles.experienceDuration}>{exp.Duration}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {cvAnalysis.Education && cvAnalysis.Education.length > 0 && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>🎓 Education</Text>
                {cvAnalysis.Education.map((edu: any, index: number) => (
                  <View key={index} style={styles.educationItem}>
                    {edu.Degree && (
                      <Text style={styles.educationDegree}>{edu.Degree}</Text>
                    )}
                    {edu.Institution && (
                      <Text style={styles.educationInstitution}>{edu.Institution}</Text>
                    )}
                    {edu.Year && (
                      <Text style={styles.educationYear}>{edu.Year}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSavedInternships = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>Saved Internships</Text>
          <Text style={styles.dashboardSubtitle}>
            Internships you've bookmarked for later
          </Text> */}
        </View>

        <Text style={styles.sectionTitle}>Saved Internships</Text>
        <Text style={styles.sectionSubtitle}>{savedInternships.length} saved</Text>

        {savedInternships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No saved internships</Text>
            <Text style={styles.emptySubtext}>Save internships to view them here</Text>
          </View>
        ) : (
          savedInternships.map((item: any) => (
            <View key={item.id} style={styles.internshipCard}>
              {/* Company Header */}
              <View style={styles.internshipHeader}>
                <View style={styles.companyLogo}>
                  <Text style={styles.avatarText}>{item.company_name?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.internshipInfo}>
                  <Text style={styles.companyNameText}>{item.company_name}</Text>
                  <Text style={styles.companyIndustryText}>{item.company_industry || 'Technology'}</Text>
                </View>
              </View>

              {/* Internship Title */}
              <Text style={styles.internshipTitleText}>{item.internship_title || item.title}</Text>

              {/* Match Badge if available */}
              {item.match_percentage && (
                <View style={[styles.matchBadge, getMatchBadgeStyle(parseFloat(item.match_percentage))]}>
                  <Text style={styles.matchBadgeText}>{item.match_percentage}% Match</Text>
                </View>
              )}

              {/* Details Grid */}
              <View style={styles.internshipDetails}>
                {item.internship_specialization && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📚 Specialization:</Text>
                    <Text style={styles.detailValue}>{item.internship_specialization}</Text>
                  </View>
                )}
                {item.min_gpa && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📊 Min GPA:</Text>
                    <Text style={styles.detailValue}>{item.min_gpa}</Text>
                  </View>
                )}
                {item.work_mode && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💼 Work Mode:</Text>
                    <Text style={styles.detailValue}>{item.work_mode}</Text>
                  </View>
                )}
                {item.capacity && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👥 Capacity:</Text>
                    <Text style={styles.detailValue}>{item.capacity} positions</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {item.internship_description && (
                <View style={styles.internshipDescription}>
                  <Text style={styles.descriptionText}>
                    {item.internship_description.length > 100 
                      ? item.internship_description.substring(0, 100) + '...' 
                      : item.internship_description}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.internshipActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.viewDetailsButton]}
                  onPress={() => handleViewDetails(item)}
                >
                  <Text style={styles.buttonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.applyButton]}
                  onPress={() => handleApplyInternship(item)}
                >
                  <Text style={styles.buttonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderTrainingPlans = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Training Plans</Text>
          <Text style={styles.dashboardSubtitle}>
            View training plans published by your trainers
          </Text>
        </View>

        {trainingPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No Training Plans Yet</Text>
            <Text style={styles.emptySubtext}>
              Training plans will appear here once you are accepted to an internship and the company publishes a training plan
            </Text>
          </View>
        ) : (
          trainingPlans.map((plan: any) => (
            <View key={plan.id} style={styles.trainingPlanCard}>
              {/* Plan Header */}
              <View style={styles.planCardHeader}>
                <View style={styles.planTitleSection}>
                  <Text style={styles.planTitle}>{plan.title || 'Training Plan'}</Text>
                  <Text style={styles.planCompany}>{plan.company_name}</Text>
                  <Text style={styles.planDate}>
                    Applied on {new Date(plan.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.planStatusBadge,
                  plan.status === 'active' && styles.statusActive,
                  plan.status === 'completed' && styles.statusCompleted,
                ]}>
                  <Text style={styles.planStatusText}>
                    {plan.status === 'active' ? 'In Progress' : plan.status === 'completed' ? 'Completed' : 'Draft'}
                  </Text>
                </View>
              </View>

              {/* Next Step */}
              {plan.weeks && plan.weeks.length > 0 && (
                <View style={styles.planNextStep}>
                  <Text style={styles.nextStepTitle}>Next Step:</Text>
                  <Text style={styles.nextStepText}>
                    {plan.weeks[0]?.title || 'Start Week 1'} - {plan.weeks[0]?.description || 'Begin your training journey'}
                  </Text>
                </View>
              )}

              {/* Timeline */}
              {plan.weeks && plan.weeks.length > 0 && (
                <View style={styles.timelineSection}>
                  <Text style={styles.timelineTitle}>Application Timeline:</Text>
                  {plan.weeks.map((week: any, index: number) => {
                    const weekStatus = weekStatuses[plan.id]?.[week.id];
                    const isApproved = weekStatus === 'approved';
                    const isPending = weekStatus === 'pending';
                    const isRejected = weekStatus === 'rejected';
                    const dueDate = week.due_date ? new Date(week.due_date) : null;
                    const now = new Date();
                    const isOverdue = dueDate && dueDate < now;
                    const diffMs = dueDate ? dueDate.getTime() - now.getTime() : 0;
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffHours / 24);
                    const isUrgent = diffHours <= 24 && diffHours > 0;
                    
                    return (
                      <View key={week.id} style={styles.timelineItem}>
                        <View style={[
                          styles.timelineDot,
                          isApproved && styles.timelineDotApproved,
                          isPending && styles.timelineDotPending,
                          isRejected && styles.timelineDotRejected,
                        ]}>
                          {isApproved && <Text style={styles.timelineDotCheck}>✓</Text>}
                        </View>
                        {index < plan.weeks.length - 1 && <View style={styles.timelineLine} />}
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineTaskHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.timelineTaskName}>
                                {week.tasks || `Week ${week.week_number}`}
                              </Text>
                              {dueDate && (
                                <View style={[
                                  styles.dueDateContainer,
                                  isUrgent && styles.dueDateUrgent,
                                ]}>
                                  <Text style={[
                                    styles.dueDateText,
                                    isOverdue && styles.dueDateOverdue,
                                    isUrgent && styles.dueDateUrgentText,
                                  ]}>
                                    ⏰ Due: {dueDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                  {isOverdue ? (
                                    <Text style={styles.overdueLabel}>(Overdue)</Text>
                                  ) : (
                                    <Text style={[
                                      styles.timeLeftLabel,
                                      isUrgent && styles.timeLeftUrgent,
                                    ]}>
                                      ({diffDays > 0 ? `${diffDays}d ${diffHours % 24}h` : `${diffHours}h`} left)
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                            <TouchableOpacity 
                              style={styles.viewDetailsButton}
                              onPress={() => {
                                setSelectedTask({ ...week, plan_id: plan.id });
                                setShowTaskModal(true);
                              }}
                            >
                              <Text style={styles.viewDetailsText}>👁 View</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.timelineWeekLabel}>Week {week.week_number}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.weeklyReportsHeader}>
          <View style={styles.weeklyReportsHeaderLeft}>
            <Text style={styles.sectionTitle}>Weekly Reports</Text>
            <Text style={styles.sectionSubtitle}>{weeklyReports.length} reports</Text>
          </View>
          <TouchableOpacity 
            style={styles.submitReportButton}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={styles.submitReportText}>📝 Submit Report</Text>
          </TouchableOpacity>
        </View>

        {weeklyReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No weekly reports</Text>
            <Text style={styles.emptySubtext}>Submit weekly reports through the web version</Text>
          </View>
        ) : (
          weeklyReports.map((report: any) => (
            <View key={report.id} style={styles.applicationCard}>
              <Text style={styles.applicationTitle}>Week {report.week_number}</Text>
              {report.plan_title && (
                <Text style={styles.reportPlanTitle}>{report.plan_title}</Text>
              )}
              {report.report_text && (
                <Text style={styles.reportText} numberOfLines={2}>
                  {report.report_text}
                </Text>
              )}
              <Text style={styles.applicationDate}>
                Submitted: {new Date(report.submitted_at).toLocaleDateString()}
              </Text>
              <View style={[
                styles.statusBadge,
                report.trainer_approved && styles.statusActive,
                !report.trainer_approved && styles.statusPending,
              ]}>
                <Text style={styles.statusText}>
                  {report.trainer_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'profile':
        return renderProfile();
      case 'cv-upload':
        return renderCVUpload();
      case 'internships':
        return renderInternships();
      case 'saved':
        return renderSavedInternships();
      case 'notifications':
        return renderNotifications();
      case 'messages':
        return renderMessages();
      case 'plans':
        return renderTrainingPlans();
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
          <View style={styles.drawerContainer}>
            <DrawerMenu
              userType="student"
              userData={userData}
              activeMenu={activeTab}
              onMenuSelect={(tab: string) => {
                setActiveTab(tab as TabKey);
                setDrawerVisible(false);
              }}
              onLogout={onLogout || (() => {})}
              unreadCount={totalUnreadMessages}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Student Dashboard</Text>
          <Text style={styles.headerSubtitle}>{studentData.full_name}</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {renderTabContent()}

      {/* Internship Details Modal */}
      <Modal
        visible={showInternshipDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Internship Details</Text>
            <TouchableOpacity onPress={handleCloseDetails} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedInternship && (
              <>
                {/* Company Header */}
                <View style={styles.detailCompanyHeader}>
                  <View style={styles.detailCompanyLogo}>
                    {selectedInternship.company_logo ? (
                      <Image
                        source={{ uri: `${baseUrl}${selectedInternship.company_logo}` }}
                        style={styles.companyLogoImage}
                      />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoPlaceholderText}>
                          {selectedInternship.company_name?.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailCompanyInfo}>
                    <Text style={styles.detailInternshipTitle}>{selectedInternship.title}</Text>
                    <Text style={styles.detailCompanyName}>{selectedInternship.company_name}</Text>
                  </View>
                </View>

                {/* Match Percentage */}
                {selectedInternship.match_percentage && (
                  <View style={[styles.matchBadge, getMatchBadgeStyle(selectedInternship.match_percentage)]}>
                    <Text style={styles.matchBadgeText}>
                      {selectedInternship.match_percentage}% Match
                    </Text>
                  </View>
                )}

                {/* Basic Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>ℹ️ Basic Information</Text>
                  <View style={styles.detailInfoGrid}>
                    {selectedInternship.specialization && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailLabel}>Specialization:</Text>
                        <Text style={styles.detailValue}>{selectedInternship.specialization}</Text>
                      </View>
                    )}
                    {selectedInternship.min_gpa && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailLabel}>Minimum GPA:</Text>
                        <Text style={styles.detailValue}>{selectedInternship.min_gpa}</Text>
                      </View>
                    )}
                    {selectedInternship.work_mode && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailLabel}>Work Mode:</Text>
                        <Text style={styles.detailValue}>
                          {selectedInternship.work_mode === 'onsite' ? '🏢 Onsite' :
                           selectedInternship.work_mode === 'online' ? '💻 Online' : '🔄 Hybrid'}
                        </Text>
                      </View>
                    )}
                    {selectedInternship.capacity && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailLabel}>Available Positions:</Text>
                        <Text style={styles.detailValue}>{selectedInternship.capacity}</Text>
                      </View>
                    )}
                    {selectedInternship.status && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <Text style={styles.detailValue}>{selectedInternship.status}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Description */}
                {selectedInternship.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📄 Description</Text>
                    <Text style={styles.detailDescription}>{selectedInternship.description}</Text>
                  </View>
                )}

                {/* Requirements */}
                {selectedInternship.requirements && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📋 Requirements</Text>
                    <Text style={styles.detailRequirements}>{selectedInternship.requirements}</Text>
                  </View>
                )}

                {/* Matched Skills */}
                {selectedInternship.matched_skills && selectedInternship.matched_skills.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>✓ Matched Skills</Text>
                    <View style={styles.skillsContainer}>
                      {selectedInternship.matched_skills.map((skill: string, idx: number) => (
                        <View key={idx} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>✓ {skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.detailActions}>
                  <TouchableOpacity 
                    style={styles.btnApply}
                    onPress={() => handleApplyInternship()}
                  >
                    <Text style={styles.btnApplyText}>✓ Apply Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btnSave, selectedInternship.isSaved && styles.btnSaved]}
                    onPress={handleSaveInternship}
                  >
                    <Text style={styles.btnSaveText}>
                      {selectedInternship.isSaved ? '★ Unsave' : '☆ Save for Later'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Task Details Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Task Details</Text>
            <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedTask && (
              <>
                {/* Task Header */}
                <View style={styles.taskDetailSection}>
                  <Text style={styles.taskDetailTitle}>Week {selectedTask.week_number}: {selectedTask.title}</Text>
                  {selectedTask.description && (
                    <Text style={styles.taskWeekDescription}>{selectedTask.description}</Text>
                  )}
                </View>

                {/* Task Name */}
                <View style={styles.taskDetailSection}>
                  <Text style={styles.taskDetailLabel}>📋 Task Name</Text>
                  <Text style={styles.taskContent}>{selectedTask.tasks || 'No task specified'}</Text>
                </View>

                {/* Task Description */}
                {selectedTask.task_description && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>📄 Task Description</Text>
                    <Text style={styles.taskContent}>{selectedTask.task_description}</Text>
                  </View>
                )}

                {/* Learning Objectives */}
                {selectedTask.objectives && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>✓ Learning Objectives</Text>
                    <Text style={styles.taskContent}>{selectedTask.objectives}</Text>
                  </View>
                )}

                {/* Deliverables */}
                {selectedTask.deliverables && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>📦 Deliverables</Text>
                    <Text style={styles.taskContent}>{selectedTask.deliverables}</Text>
                  </View>
                )}

                {/* Resources */}
                {selectedTask.resources && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>📚 Resources</Text>
                    <Text style={styles.taskContent}>{selectedTask.resources}</Text>
                  </View>
                )}

                {/* Due Date */}
                {selectedTask.due_date && (
                  <View style={[
                    styles.dueDateBox,
                    new Date(selectedTask.due_date) < new Date() ? styles.dueDateBoxOverdue : styles.dueDateBoxNormal
                  ]}>
                    <Text style={styles.dueDateBoxTitle}>
                      {new Date(selectedTask.due_date) < new Date() ? '⚠️ Overdue Submission' : '📅 Submission Deadline'}
                    </Text>
                    <Text style={styles.dueDateBoxDate}>
                      {new Date(selectedTask.due_date).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}

                {/* Upload Solution Section */}
                <View style={styles.taskUploadSection}>
                  <Text style={styles.taskUploadTitle}>📤 Upload Your Solution</Text>

                  {/* Success/Error Message */}
                  {submissionMessage.text && (
                    <View style={[
                      styles.submissionAlert,
                      submissionMessage.type === 'success' ? styles.submissionAlertSuccess : styles.submissionAlertError
                    ]}>
                      <Text style={styles.submissionAlertText}>{submissionMessage.text}</Text>
                    </View>
                  )}

                  {/* File Upload */}
                  <TouchableOpacity 
                    style={styles.uploadSolutionButton}
                    onPress={handleSolutionFilePick}
                  >
                    <Text style={styles.uploadSolutionText}>
                      {selectedSolutionFile ? `📎 ${selectedSolutionFile.name}` : '📁 Choose File to Upload'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.uploadHint}>Supported: PDF, DOC, DOCX, ZIP, RAR (Max 10MB)</Text>

                  {/* Text Solution */}
                  <Text style={styles.solutionLabel}>Or write your solution here:</Text>
                  <TextInput
                    style={styles.solutionTextArea}
                    value={solutionText}
                    onChangeText={setSolutionText}
                    placeholder="Describe your solution or paste your code here..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />

                  {/* Link Solution */}
                  <Text style={styles.solutionLabel}>Or provide a link (GitHub, Google Drive, etc.):</Text>
                  <TextInput
                    style={styles.solutionLinkInput}
                    value={solutionLink}
                    onChangeText={setSolutionLink}
                    placeholder="https://github.com/username/repo"
                    keyboardType="url"
                    autoCapitalize="none"
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitSolutionButton, uploadingSubmission && styles.submitSolutionButtonDisabled]}
                    onPress={handleSubmitSolution}
                    disabled={uploadingSubmission}
                  >
                    <Text style={styles.submitSolutionText}>
                      {uploadingSubmission ? 'Submitting...' : 'Submit Solution'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Weekly Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Weekly Report</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.reportFormSection}>
              <Text style={styles.reportFormTitle}>📝 Weekly Training Report</Text>
              
              {/* Success/Error Message */}
              {reportMessage.text && (
                <View style={[
                  styles.submissionAlert,
                  reportMessage.type === 'success' ? styles.submissionAlertSuccess : styles.submissionAlertError
                ]}>
                  <Text style={styles.submissionAlertText}>{reportMessage.text}</Text>
                </View>
              )}

              {/* Week Number */}
              <Text style={styles.reportLabel}>Week Number:</Text>
              <TextInput
                style={styles.reportWeekInput}
                value={reportWeekNumber.toString()}
                onChangeText={(text) => setReportWeekNumber(parseInt(text) || 1)}
                keyboardType="numeric"
                placeholder="1"
              />

              {/* Report Text */}
              <Text style={styles.reportLabel}>Weekly Report:</Text>
              <TextInput
                style={styles.reportTextArea}
                value={reportText}
                onChangeText={setReportText}
                placeholder="Describe your weekly activities, achievements, challenges, and learnings..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitReportButtonModal, isSubmittingReport && styles.submitReportButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
              >
                <Text style={styles.submitReportTextModal}>
                  {isSubmittingReport ? 'Submitting...' : 'Submit Weekly Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Hours Modal for Application */}
      <Modal
        visible={showHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHoursModal(false)}
      >
        <View style={styles.hoursModalOverlay}>
          <View style={styles.hoursModalContainer}>
            <Text style={styles.hoursModalTitle}>Apply to Internship</Text>
            <Text style={styles.hoursModalSubtitle}>
              {selectedInternship?.internship_title || selectedInternship?.title}
            </Text>
            
            <Text style={styles.hoursLabel}>Hours per week (minimum 20):</Text>
            <TextInput
              style={styles.hoursInput}
              value={hoursPerWeek}
              onChangeText={setHoursPerWeek}
              keyboardType="numeric"
              placeholder="20"
            />
            
            <View style={styles.hoursModalActions}>
              <TouchableOpacity 
                style={[styles.hoursButton, styles.hoursCancelButton]}
                onPress={() => {
                  setShowHoursModal(false);
                  setHoursPerWeek('20');
                }}
              >
                <Text style={styles.hoursCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.hoursButton, styles.hoursApplyButton]}
                onPress={handleConfirmApplication}
              >
                <Text style={styles.hoursApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 8,
    width: 40,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  kpiGrid: {
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  kpiCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  kpiCardOrange: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  kpiBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kpiBadgeText: {
    fontSize: 10,
    color: '#4f46e5',
    fontWeight: '600',
  },
  kpiNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  kpiDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  applicationCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusExpired: {
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
  internshipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  internshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  internshipInfo: {
    flex: 1,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  companyIndustryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  internshipTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  internshipDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  matchScoreContainer: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
  },
  saveButton: {
    backgroundColor: '#10b981',
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    flex: 1,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactItemActive: {
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  contactRole: {
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
  unreadText: {
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
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
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
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationContent: {
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  markReadButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markReadText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  messageBoxStyle: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: '#d1fae5',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
  },
  messageTextStyle: {
    fontSize: 14,
    color: '#1f2937',
  },
  // AI Matching Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  matchExcellent: {
    backgroundColor: '#d1fae5',
  },
  matchGood: {
    backgroundColor: '#dbeafe',
  },
  matchFair: {
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
  gpaMatch: {
    color: '#10b981',
    fontWeight: '600',
  },
  gpaMismatch: {
    color: '#ef4444',
    fontWeight: '600',
  },
  internshipDescription: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  descriptionText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  matchDetailsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  matchDetailGroup: {
    marginBottom: 12,
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillTagText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categorySkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categorySkill: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  // CV Upload Styles
  cvUploadContainer: {
    padding: 16,
  },
  cvUploadBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  cvUploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cvUploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cvUploadDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  cvSelectedFile: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  cvFileName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  cvFileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  cvChooseButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cvChooseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cvUploadFormats: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#10b981',
    marginTop: 16,
  },
  // CV Analysis Results Styles
  cvAnalysisResults: {
    marginTop: 24,
    padding: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearAnalysisButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAnalysisText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  analysisItems: {
    gap: 8,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  analysisLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  analysisValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillBadgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  experienceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  experiencePosition: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  experienceDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  educationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  educationDegree: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  educationInstitution: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  educationYear: {
    fontSize: 12,
    color: '#9ca3af',
  },
  headerWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    backgroundColor: '#1e3a8a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  // Detail Styles
  detailCompanyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailCompanyLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    overflow: 'hidden',
  },
  companyLogoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailCompanyInfo: {
    flex: 1,
  },
  detailInternshipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailCompanyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailInfoGrid: {
    gap: 12,
  },
  detailInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailRequirements: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  btnApply: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnApplyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSaved: {
    backgroundColor: '#f59e0b',
  },
  internshipActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  // Training Plan Styles
  trainingPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  planCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  planDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  planStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  planStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  planNextStep: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  nextStepText: {
    fontSize: 13,
    color: '#1f2937',
  },
  timelineSection: {
    marginTop: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineViewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  timelineViewText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTaskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  timelineDueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Hours Modal Styles
  hoursModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  hoursModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  hoursModalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  hoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  hoursInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  hoursModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  hoursButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  hoursCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  hoursCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  hoursApplyButton: {
    backgroundColor: '#3b82f6',
  },
  hoursApplyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Training Plans Styles
  timelineDotApproved: {
    backgroundColor: '#10b981',
  },
  timelineDotPending: {
    backgroundColor: '#f59e0b',
  },
  timelineDotRejected: {
    backgroundColor: '#ef4444',
  },
  timelineDotCheck: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    width: 2,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  timelineTaskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dueDateContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dueDateUrgent: {
    backgroundColor: '#fee2e2',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  dueDateText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  dueDateOverdue: {
    color: '#dc2626',
  },
  dueDateUrgentText: {
    color: '#dc2626',
  },
  overdueLabel: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  timeLeftLabel: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  timeLeftUrgent: {
    color: '#dc2626',
  },
  viewDetailsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineWeekLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  weeklyReportsHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  reportPlanTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  reportText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  // Task Details Modal Styles
  taskDetailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  taskDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  taskWeekDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  taskDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  taskContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  dueDateBox: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  dueDateBoxOverdue: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  dueDateBoxNormal: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  dueDateBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  dueDateBoxDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  taskUploadSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskUploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  submissionAlert: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  submissionAlertSuccess: {
    backgroundColor: '#dcfce7',
  },
  submissionAlertError: {
    backgroundColor: '#fee2e2',
  },
  submissionAlertText: {
    fontSize: 14,
    color: '#166534',
  },
  uploadSolutionButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadSolutionText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  solutionTextArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  solutionLinkInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  submitSolutionButton: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitSolutionButtonDisabled: {
    opacity: 0.6,
  },
  submitSolutionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Weekly Reports Header Styles
  weeklyReportsHeaderLeft: {
    flex: 1,
  },
  submitReportButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitReportText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Weekly Report Modal Styles
  reportFormSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
  },
  reportFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  reportWeekInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  reportTextArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 150,
    textAlignVertical: 'top',
    backgroundColor: '#f9fafb',
  },
  submitReportButtonModal: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitReportButtonDisabled: {
    opacity: 0.6,
  },
  submitReportTextModal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentDashboardScreen;
