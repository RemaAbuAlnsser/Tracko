import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import {
  loadChatMessages,
  sendChatMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  markMessagesAsRead,
  getUnreadCount,
} from '../utils/chatService';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

interface StudentDashboardScreenProps {
  userData?: any;
  onLogout?: () => void;
}

type TabKey = 'overview' | 'internships' | 'chat' | 'notifications' | 'cv' | 'profile';

const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // CV related states
  const [cvFile, setCvFile] = useState<any>(null);
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false);
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    major: '',
    gpa: '',
    academic_year: '3rd Year',
    skills: 'JavaScript, React, Python, SQL',
  });

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';
  
  // Log the platform and baseUrl for debugging
  console.log('🔧 Platform:', Platform.OS);
  console.log('🔧 Base URL:', baseUrl);

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      const response = await fetch(`${baseUrl}/api/health`);
      console.log('🔍 Health check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
      } else {
        console.error('❌ Backend health check failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error);
    }
  };

  // Load internships and applications from backend
  const loadInternshipsData = async () => {
    if (!userData?.id) {
      console.log('🚫 No userData.id available for loading internships');
      return;
    }
    
    console.log('🔄 Starting to load internships data for user:', userData.id);
    console.log('🔄 Using baseUrl:', baseUrl);
    
    try {
      // Load student applications
      console.log('📝 Loading applications for user:', userData.id);
      const applicationsUrl = `${baseUrl}/api/students/${userData.id}/applications`;
      console.log('📝 Applications URL:', applicationsUrl);
      
      const applicationsResponse = await fetch(applicationsUrl);
      console.log('📝 Applications response status:', applicationsResponse.status);
      
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        console.log('📝 Applications data:', applicationsData);
        if (applicationsData.success) {
          setApplications(applicationsData.applications || []);
          console.log('✅ Applications loaded:', applicationsData.applications?.length || 0);
        }
      } else {
        console.log('❌ Applications API error:', applicationsResponse.status, applicationsResponse.statusText);
      }

      // Load recommended internships with match scores
      console.log('🎯 Loading internships for user:', userData.id);
      const matchingUrl = `${baseUrl}/api/matching/student/${userData.id}`;
      console.log('🎯 Matching URL:', matchingUrl);
      
      const matchingResponse = await fetch(matchingUrl);
      console.log('🎯 Matching response status:', matchingResponse.status);
      
      if (matchingResponse.ok) {
        const matchingData = await matchingResponse.json();
        console.log('🎯 Raw matching data from API:', JSON.stringify(matchingData, null, 2));
        
        if (matchingData.success) {
          console.log('🎯 Matching API returned success with', matchingData.matches?.length || 0, 'matches');
          
          // Ensure each internship has a match_score
          const internshipsWithScores = (matchingData.matches || []).map((internship: any) => ({
            ...internship,
            match_score: internship.match_percentage || internship.match_score || internship.score || 0,
            // Also ensure we have proper display data
            title: internship.title || internship.internship_title || 'Untitled Internship',
            company: internship.company || internship.company_name || 'Unknown Company',
            location: internship.location || 'Location TBD'
          }));
          
          console.log('🎯 Processed internships with scores:', internshipsWithScores.length);
          console.log('🎯 First internship sample:', internshipsWithScores[0]);
          
          setInternships(internshipsWithScores);
          
          // If no matches found, try to run AI matching
          if (internshipsWithScores.length === 0) {
            console.log('🤖 No matches found, running AI matching...');
            await runAIMatching();
          }
        } else {
          console.log('❌ Matching API returned success=false:', matchingData.message);
        }
      } else {
        console.log('❌ Matching API error:', matchingResponse.status, matchingResponse.statusText);
        const errorText = await matchingResponse.text();
        console.log('❌ Error response body:', errorText);
      }
    } catch (error) {
      console.error('💥 Error loading internships data:', error);
    }
  };

  // Run AI matching to generate new matches
  const runAIMatching = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('Running AI matching for user:', userData.id);
      const response = await fetch(`${baseUrl}/api/matching/student/${userData.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('AI matching result:', result);
        
        // Reload internships after AI matching
        setTimeout(() => {
          console.log('Reloading internships after AI matching...');
          loadInternshipsData();
        }, 3000); // Wait 3 seconds for AI processing
      } else {
        console.log('AI matching error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error running AI matching:', error);
    }
  };

  // Load contacts (trainers + university) from backend
  const loadContacts = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('Loading contacts for user:', userData.id);
      let allContacts: any[] = [];
      
      // Get student's trainers
      const trainersResponse = await fetch(`${baseUrl}/api/students/${userData.id}/trainers`);
      const trainersData = await trainersResponse.json();
      console.log('Trainers data:', trainersData);
      
      if (trainersData.success) {
        const trainersWithUnread = await Promise.all(
          (trainersData.trainers || []).map(async (trainer: any) => {
            console.log('Processing trainer:', trainer.user_id);
            
            // Get unread count using Supabase chatService
            let unreadCount = 0;
            try {
              unreadCount = await getUnreadCount(userData.id, trainer.user_id);
            } catch (error) {
              console.error('Error getting unread count for trainer:', trainer.user_id, error);
            }
            
            return {
              ...trainer,
              id: trainer.user_id,
              name: trainer.full_name,
              role: 'Trainer',
              unread: unreadCount,
            };
          })
        );
        allContacts = [...trainersWithUnread];
        console.log('Processed contacts:', allContacts);
      }
      
      setContacts(allContacts);
      if (allContacts.length > 0 && !selectedContactId) {
        setSelectedContactId(allContacts[0].id);
        console.log('Selected first contact:', allContacts[0].id);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Load messages for selected contact
  const loadMessagesForContact = async (contactId: number) => {
    if (!userData?.id || !contactId) return;
    
    try {
      console.log('Loading messages between user:', userData.id, 'and contact:', contactId);
      
      // Use Supabase chatService like the web version
      const chatMessages = await loadChatMessages(userData.id, contactId);
      console.log('✅ Loaded messages from Supabase:', chatMessages.length, 'messages');
      setMessages(chatMessages);
      
      // Mark messages as read using Supabase
      await markMessagesAsRead(contactId, userData.id);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !selectedContactId || !userData?.id) return;

    try {
      console.log('Sending message from user:', userData.id, 'to contact:', selectedContactId, 'message:', trimmed);
      setNewMessage('');
      
      // Use Supabase chatService like the web version
      const result = await sendChatMessage(userData.id, selectedContactId, trimmed);
      console.log('Send message result:', result);
      
      if (result.success && result.data && result.data[0]) {
        setMessages(prev => [...prev, result.data[0]]);
        console.log('✅ Message sent successfully via Supabase');
      } else {
        console.error('Failed to send message:', result);
        setNewMessage(trimmed); // Restore message on failure
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(trimmed); // Restore message on failure
    }
  };

  // Profile editing functions
  const startEditingProfile = () => {
    setEditedProfile({
      full_name: userData?.full_name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      major: userData?.major || '',
      gpa: userData?.gpa || '',
      academic_year: userData?.academic_year || '3rd Year',
      skills: userData?.skills || 'JavaScript, React, Python, SQL',
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      full_name: '',
      email: '',
      phone: '',
      major: '',
      gpa: '',
      academic_year: '3rd Year',
      skills: 'JavaScript, React, Python, SQL',
    });
  };

  const saveProfileChanges = async () => {
    if (!userData?.id) {
      console.log('❌ No userData.id available');
      return;
    }

    try {
      console.log('💾 Saving profile changes for user:', userData.id);
      console.log('📤 Profile data to save:', editedProfile);
      
      const response = await fetch(`${baseUrl}/api/students/${userData.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);
      
      if (response.ok && result.success) {
        console.log('✅ Profile updated successfully');
        
        // Update local userData - this is important for the UI to reflect changes
        // Note: In a real app, you might want to pass this up to parent component
        // or use a state management solution like Redux/Context
        const updatedUserData = {
          ...userData,
          full_name: editedProfile.full_name,
          email: editedProfile.email,
          major: editedProfile.major,
          gpa: editedProfile.gpa,
          academic_year: editedProfile.academic_year,
          skills: editedProfile.skills
        };
        
        // For now, we'll just log this - in a real implementation you'd update the parent state
        console.log('📱 Updated user data would be:', updatedUserData);
        
        setIsEditingProfile(false);
        
        // Show success message
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        console.error('❌ Failed to update profile:', result.message);
        Alert.alert('Error', 'Failed to update profile: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('💥 Error updating profile:', error);
      Alert.alert('Network Error', 'Please check your connection and try again.');
    }
  };

  // Handle image selection
  const selectImage = () => {
    try {
      console.log('📷 Starting image selection...');
      
      // Show options to user
      Alert.alert(
        'Select Image',
        'Choose how you want to select an image',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('👤 User cancelled image selection')
          },
          {
            text: 'Photo Library',
            onPress: () => openImageLibrary()
          }
        ]
      );
    } catch (error) {
      console.error('💥 Error in selectImage function:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  // Open image library
  const openImageLibrary = () => {
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        console.log('📷 Image picker response:', response);
        
        if (response.didCancel) {
          console.log('👤 User cancelled image picker');
          return;
        } 
        
        if (response.errorCode) {
          console.log('❌ ImagePicker Error Code:', response.errorCode);
          Alert.alert('Error', `Image picker error: ${response.errorCode}\n\nThis might be due to missing permissions. Please check your device settings.`);
          return;
        }
        
        if (response.errorMessage) {
          console.log('❌ ImagePicker Error Message:', response.errorMessage);
          Alert.alert('Error', 'Failed to select image: ' + response.errorMessage + '\n\nPlease check app permissions in device settings.');
          return;
        }
        
        if (response.assets && response.assets.length > 0 && response.assets[0]) {
          const asset = response.assets[0];
          const imageUri = asset.uri;
          console.log('✅ Selected image:', imageUri);
          console.log('📊 Image details:', {
            uri: asset.uri,
            type: asset.type,
            fileSize: asset.fileSize,
            fileName: asset.fileName
          });
          
          setSelectedImage(imageUri || null);
          Alert.alert('Success', 'Image selected successfully!\n\nNote: Image upload to server will be implemented in a future update.');
        } else {
          console.log('⚠️ No image assets found in response');
          Alert.alert('Warning', 'No image was selected. Please try again.');
        }
      });
    } catch (error) {
      console.error('💥 Error in openImageLibrary function:', error);
      Alert.alert('Error', 'Failed to open photo library. This might be due to missing permissions or library issues.');
    }
  };

  // Handle CV file selection
  const selectCVFile = async () => {
    try {
      console.log('📄 Starting CV file selection...');
      
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        console.log('✅ Selected CV file:', file);
        
        setCvFile(file);
        const fileSize = file.size ? (file.size / 1024 / 1024).toFixed(2) : 'Unknown';
        Alert.alert('Success', `CV file selected: ${file.name}\n\nSize: ${fileSize} MB`);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('👤 User cancelled CV file selection');
      } else {
        console.error('💥 Error selecting CV file:', error);
        Alert.alert('Error', 'Failed to select CV file. Please try again.');
      }
    }
  };

  // Upload CV to server
  const uploadCV = async () => {
    if (!cvFile) {
      Alert.alert('Error', 'Please select a CV file first.');
      return;
    }

    if (!userData?.id) {
      Alert.alert('Error', 'User data not available.');
      return;
    }

    try {
      setIsUploadingCV(true);
      console.log('📤 Uploading CV file...');

      const formData = new FormData();
      formData.append('cv', {
        uri: cvFile.uri,
        type: cvFile.type,
        name: cvFile.name,
      } as any);

      const uploadResponse = await fetch(`${baseUrl}/api/upload/cv`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadResult = await uploadResponse.json();
      console.log('📤 Upload response:', uploadResult);

      if (uploadResponse.ok && uploadResult.success) {
        console.log('✅ CV uploaded successfully');
        
        // Create CV record in database
        const cvData = {
          user_id: userData.id,
          cv_file: uploadResult.filePath,
          analysis_data: null
        };

        const createResponse = await fetch(`${baseUrl}/api/cvs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cvData),
        });

        const createResult = await createResponse.json();
        console.log('📄 CV record response:', createResult);

        if (createResponse.ok && createResult.success) {
          Alert.alert('Success', 'CV uploaded successfully!\n\nYou can now run AI analysis on your CV.');
          
          // Start AI analysis automatically
          await analyzeCV(uploadResult.filePath);
        } else {
          Alert.alert('Warning', 'CV uploaded but failed to create database record.');
        }
      } else {
        Alert.alert('Error', uploadResult.message || 'Failed to upload CV.');
      }
    } catch (error) {
      console.error('💥 Error uploading CV:', error);
      Alert.alert('Error', 'Network error while uploading CV. Please try again.');
    } finally {
      setIsUploadingCV(false);
    }
  };

  // Analyze CV with AI
  const analyzeCV = async (cvFilePath?: string) => {
    if (!userData?.id) {
      Alert.alert('Error', 'User data not available.');
      return;
    }

    try {
      setIsAnalyzingCV(true);
      console.log('🤖 Starting AI analysis...');

      // Call the real AI analysis API
      const analysisResponse = await fetch(`${baseUrl}/api/cvs/analyze/${userData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const analysisResult = await analysisResponse.json();
      console.log('🤖 AI analysis response:', analysisResult);

      if (analysisResponse.ok && analysisResult.success) {
        console.log('✅ AI analysis completed successfully');
        setCvAnalysis(analysisResult.analysis);
        Alert.alert('Success', 'AI analysis completed successfully!\n\nCheck the detailed results below.');
      } else {
        console.error('❌ AI analysis failed:', analysisResult.message);
        Alert.alert('Error', analysisResult.message || 'Failed to analyze CV. Please try again.');
      }

    } catch (error) {
      console.error('💥 Error analyzing CV:', error);
      Alert.alert('Error', 'Network error during AI analysis. Please check your connection and try again.');
    } finally {
      setIsAnalyzingCV(false);
    }
  };

  // Load existing CV data
  const loadCVData = async () => {
    if (!userData?.id) return;

    try {
      console.log('📄 Loading existing CV data...');
      const response = await fetch(`${baseUrl}/api/cvs/student/${userData.id}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.cv) {
          console.log('✅ Found existing CV:', result.cv);
          
          // Parse analysis data if available
          if (result.cv.analysis_data) {
            try {
              const analysis = typeof result.cv.analysis_data === 'string' 
                ? JSON.parse(result.cv.analysis_data) 
                : result.cv.analysis_data;
              setCvAnalysis(analysis);
            } catch (e) {
              console.warn('Failed to parse CV analysis data');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
    }
  };

  // Load notifications from backend
  const loadNotifications = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('Loading notifications for user:', userData.id);
      const response = await fetch(`${baseUrl}/api/notifications/user/${userData.id}`);
      console.log('Notifications response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications data:', data);
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } else {
        console.log('Notifications API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Setup real-time message subscription using Supabase
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

  // Load data on mount
  useEffect(() => {
    console.log('StudentDashboard userData:', userData);
    
    // Test backend connection first
    testBackendConnection();
    
    if (userData?.id) {
      console.log('Loading data for user ID:', userData.id);
      loadInternshipsData();
      loadNotifications();
      loadCVData();
    } else {
      console.log('No userData available');
    }
  }, [userData?.id]);

  // Load messages when contact changes
  useEffect(() => {
    if (selectedContactId) {
      loadMessagesForContact(selectedContactId);
    }
  }, [selectedContactId]);

  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.welcomeTitle}>Welcome, {userData?.full_name || 'Student'}</Text>
      <Text style={styles.welcomeSubtitle}>Here is an overview of your journey</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
          <Text style={styles.statLabel}>Applications</Text>
          <Text style={styles.statValue}>{applications.length}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ecfeff' }]}>
          <Text style={styles.statLabel}>Matched Internships</Text>
          <Text style={styles.statValue}>{internships.length}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Applications</Text>
      {applications.length === 0 ? (
        <Text style={styles.placeholderText}>No applications yet.</Text>
      ) : (
        applications.slice(0, 3).map((app: any) => (
          <View key={app.id} style={styles.applicationCard}>
            <Text style={styles.applicationTitle}>{app.internship_title || app.title}</Text>
            <Text style={styles.applicationCompany}>{app.company_name || app.company}</Text>
            <Text style={styles.applicationStatus}>{app.status}</Text>
          </View>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderInternships = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.internshipsHeader}>
        <Text style={styles.sectionTitle}>Recommended Internships</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            console.log('🔄 Refresh button pressed, running AI matching...');
            runAIMatching();
          }}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Matches</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.debugText}>
        Debug: Found {internships.length} internships for user {userData?.id}
      </Text>
      
      {internships.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>No Internships Found</Text>
          <Text style={styles.emptyStateText}>
            We couldn't find any matching internships for you yet.
          </Text>
          <Text style={styles.emptyStateText}>
            Try refreshing matches or check back later.
          </Text>
        </View>
      ) : (
        internships.map((item: any) => (
          <View key={item.id} style={styles.internshipCard}>
            <View style={styles.internshipHeader}>
              <Text style={styles.internshipTitle}>{item.title || item.internship_title}</Text>
              <Text style={styles.internshipCompany}>{item.company || item.company_name}</Text>
            </View>
            <View style={styles.internshipFooter}>
              <Text style={styles.internshipLocation}>{item.location}</Text>
              <View style={styles.matchScoreContainer}>
                <Text style={styles.internshipMatch}>{Math.round(item.match_score)}% match</Text>
              </View>
            </View>
          </View>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderChat = () => (
    <View style={styles.chatContainer}>
      <View style={styles.chatSidebar}>
        <Text style={styles.chatSidebarTitle}>Contacts</Text>
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
          {messages.map(msg => {
            const isFromMe = msg.sender_id === userData?.id;
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
                {/* Avatar for received messages (left side) */}
                {!isFromMe && (
                  <View style={styles.messageAvatar}>
                    <Text style={styles.avatarText}>
                      {contacts.find(c => c.id === msg.sender_id)?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </Text>
                  </View>
                )}
                
                {/* Message bubble */}
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

                {/* Avatar for sent messages (right side) */}
                {isFromMe && (
                  <View style={styles.messageAvatar}>
                    <Text style={styles.avatarText}>
                      {userData?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
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
      </View>
    </View>
  );

  const renderNotifications = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.placeholderText}>No notifications yet.</Text>
      ) : (
        notifications.map(notification => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.is_read && styles.notificationCardUnread,
            ]}
            onPress={() => {
              if (!notification.is_read) {
                markNotificationAsRead(notification.id);
              }
            }}
          >
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationTime}>
              {new Date(notification.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {!notification.is_read && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Profile & Edit</Text>
      
      {/* Profile Picture Section */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Profile Picture</Text>
        <View style={styles.imageUploadContainer}>
          <View style={styles.imagePreview}>
            <View style={styles.noImage}>
              <Text style={styles.noImageIcon}>👤</Text>
              <Text style={styles.noImageText}>No image</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={selectImage}>
            <Text style={styles.uploadButtonText}>📷 Choose Image</Text>
          </TouchableOpacity>
          
          {/* Fallback button in case of image picker issues */}
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: '#6b7280', marginTop: 8 }]} 
            onPress={() => {
              Alert.alert(
                'Image Upload Info',
                'Image upload feature is currently in development.\n\nIf you\'re experiencing issues with the image picker, this might be due to:\n\n• Missing app permissions\n• Device compatibility\n• Library configuration\n\nPlease check your device settings and try again.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.uploadButtonText}>ℹ️ Upload Info</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.imageHelpText}>This image will appear in the sidebar</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Personal Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Full Name</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedProfile.full_name}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, full_name: text }))}
              placeholder="Enter full name"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={userData?.full_name || 'Not provided'}
              editable={false}
            />
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedProfile.email}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={userData?.email || 'Not provided'}
              editable={false}
            />
          )}
        </View>
      </View>

      {/* Academic Information */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Academic Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>University</Text>
          <TextInput
            style={[styles.formInput, styles.disabledInput]}
            value={userData?.university_name || 'Not assigned'}
            editable={false}
          />
          <Text style={styles.helpText}>University is automatically assigned based on your email domain</Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Major</Text>
          {isEditingProfile ? (
            <TextInput
              style={styles.formInput}
              value={editedProfile.major}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, major: text }))}
              placeholder="e.g., Computer Science"
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={userData?.major || 'Not provided'}
              editable={false}
            />
          )}
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Academic Year</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value="3rd Year"
              editable={false}
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>GPA</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.formInput}
                value={editedProfile.gpa}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, gpa: text }))}
                placeholder="e.g., 3.75"
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={userData?.gpa || 'Not provided'}
                editable={false}
              />
            )}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Skills</Text>
          {isEditingProfile ? (
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={editedProfile.skills}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, skills: text }))}
              placeholder="e.g., JavaScript, React, Python, SQL..."
              multiline={true}
              numberOfLines={4}
            />
          ) : (
            <TextInput
              style={[styles.formInput, styles.textArea, styles.disabledInput]}
              value={userData?.skills || 'JavaScript, React, Python, SQL'}
              multiline={true}
              numberOfLines={4}
              editable={false}
            />
          )}
          <Text style={styles.helpText}>Separate skills with commas</Text>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.profileCard}>
        {isEditingProfile ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfileChanges}>
              <Text style={styles.saveButtonText}>💾 Save Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButtonSecondary} onPress={cancelEditingProfile}>
              <Text style={styles.saveButtonTextSecondary}>❌ Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={startEditingProfile}>
            <Text style={styles.saveButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderCV = () => (
    <ScrollView contentContainerStyle={styles.content}>
      {/* CV Upload Section */}
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>CV Upload & AI Analysis</Text>
        
        <View style={styles.cvUploadContainer}>
          {cvFile ? (
            <View style={styles.selectedFileContainer}>
              <Text style={styles.selectedFileText}>📄 {cvFile.name}</Text>
              <Text style={styles.selectedFileSize}>
                Size: {cvFile.size ? (cvFile.size / 1024 / 1024).toFixed(2) : 'Unknown'} MB
              </Text>
            </View>
          ) : (
            <View style={styles.noFileContainer}>
              <Text style={styles.noFileIcon}>📄</Text>
              <Text style={styles.noFileText}>No CV selected</Text>
            </View>
          )}
          
          <View style={styles.cvButtonsContainer}>
            <TouchableOpacity style={styles.cvButton} onPress={selectCVFile}>
              <Text style={styles.cvButtonText}>📁 Select CV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cvButton, { backgroundColor: cvFile ? '#10b981' : '#9ca3af' }]} 
              onPress={uploadCV}
              disabled={!cvFile || isUploadingCV}
            >
              <Text style={styles.cvButtonText}>
                {isUploadingCV ? '⏳ Uploading...' : '📤 Upload CV'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.cvButton, { backgroundColor: '#8b5cf6', marginTop: 8 }]} 
            onPress={() => analyzeCV()}
            disabled={isAnalyzingCV}
          >
            <Text style={styles.cvButtonText}>
              {isAnalyzingCV ? '🤖 Analyzing...' : '🤖 Run AI Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.cvHelpText}>
          Upload your CV (PDF, DOC, DOCX) and get AI-powered analysis of your skills and experience.
        </Text>
      </View>

      {/* AI Analysis Results */}
      {cvAnalysis && (
        <View style={styles.profileCard}>
          <Text style={styles.profileCardTitle}>🤖 AI Analysis Results</Text>
          
          <View style={styles.analysisContainer}>
            {cvAnalysis.skills && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Detected Skills:</Text>
                <View style={styles.skillsContainer}>
                  {cvAnalysis.skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {cvAnalysis.categories && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Skill Categories:</Text>
                {Object.entries(cvAnalysis.categories).map(([category, skills]: [string, any]) => (
                  <View key={category} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{category}:</Text>
                    <Text style={styles.categorySkills}>{skills.join(', ')}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {cvAnalysis.experience && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Experience:</Text>
                <Text style={styles.analysisText}>{cvAnalysis.experience}</Text>
              </View>
            )}
            
            {cvAnalysis.education && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Education:</Text>
                <Text style={styles.analysisText}>{cvAnalysis.education}</Text>
              </View>
            )}

            {cvAnalysis.gpa && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>GPA:</Text>
                <Text style={styles.analysisText}>{cvAnalysis.gpa}</Text>
              </View>
            )}

            {cvAnalysis.specialization && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Specialization:</Text>
                <Text style={styles.analysisText}>{cvAnalysis.specialization}</Text>
              </View>
            )}

            {cvAnalysis.summary && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Summary:</Text>
                <Text style={styles.analysisText}>{cvAnalysis.summary}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );

  let body: React.ReactNode;
  if (activeTab === 'overview') body = renderOverview();
  else if (activeTab === 'internships') body = renderInternships();
  else if (activeTab === 'chat') body = renderChat();
  else if (activeTab === 'notifications') body = renderNotifications();
  else if (activeTab === 'cv') body = renderCV();
  else body = renderProfile();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tracko</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {(['overview', 'internships', 'chat', 'notifications', 'cv', 'profile'] as TabKey[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'cv' ? 'CV & AI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutButton: {
    fontSize: 16,
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  applicationCompany: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  applicationStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  internshipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  internshipHeader: {
    marginBottom: 8,
  },
  internshipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  internshipCompany: {
    fontSize: 14,
    color: '#6b7280',
  },
  internshipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  internshipLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  internshipMatch: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  matchScoreContainer: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  internshipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
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
  // Message item container (like web .message-item)
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
  
  // Message avatar (like web .message-avatar)
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
  
  // Message bubble (like web .message-bubble)
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleSent: {
    backgroundColor: '#d4f4dd', // Light green like web
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#f5f5f5', // Light gray like web
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  
  // Message text (like web message text)
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextSent: {
    color: '#1b5e20', // Dark green like web
  },
  messageTextReceived: {
    color: '#424242', // Dark gray like web
  },
  
  // Message time (like web .message-time)
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
  },
  messageTimeSent: {
    color: '#2e7d32', // Green like web
    textAlign: 'right',
  },
  messageTimeReceived: {
    color: '#757575', // Gray like web
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
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  
  // Profile styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 12,
  },
  profileFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  profileFieldValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  profileFieldInput: {
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  profileActions: {
    gap: 12,
  },
  profileButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  profileButtonDanger: {
    backgroundColor: '#ef4444',
  },
  profileButtonSuccess: {
    backgroundColor: '#10b981',
  },
  profileButtonSecondary: {
    backgroundColor: '#6b7280',
  },
  profileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButtonTextDanger: {
    color: '#ffffff',
  },
  profileButtonTextSecondary: {
    color: '#ffffff',
  },
  
  // New Profile Styles (Web-like)
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  
  // Image Upload Styles
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noImageText: {
    fontSize: 12,
    color: '#6b7280',
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageHelpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Form Styles
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Button Styles
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonSuccess: {
    backgroundColor: '#10b981',
  },
  saveButtonSecondary: {
    backgroundColor: '#6b7280',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextSecondary: {
    color: '#ffffff',
  },
  
  // Debug and empty state styles
  debugText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  
  // CV Upload styles
  cvUploadContainer: {
    marginBottom: 16,
  },
  selectedFileContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedFileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  noFileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  noFileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noFileText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cvButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cvButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cvButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cvHelpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  
  // AI Analysis styles
  analysisContainer: {
    marginTop: 8,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  skillTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  skillTagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  categoryContainer: {
    marginBottom: 8,
    paddingLeft: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 2,
  },
  categorySkills: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default StudentDashboardScreen;
