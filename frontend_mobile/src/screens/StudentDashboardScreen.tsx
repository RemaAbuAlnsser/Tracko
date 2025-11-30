import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Modal,
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

type TabKey = 'overview' | 'internships' | 'applications' | 'chat' | 'notifications' | 'profile';

const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
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
  
  // Chat
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
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
    }
  }, [userData]);

  useEffect(() => {
    if (studentData.id) {
      fetchDashboardStats();
    }
  }, [studentData.id]);

  useEffect(() => {
    if (activeTab === 'internships' && studentData.id) {
      fetchInternships();
    }
  }, [activeTab, studentData.id]);

  useEffect(() => {
    if (activeTab === 'applications' && studentData.id) {
      fetchApplications();
    }
  }, [activeTab, studentData.id]);

  useEffect(() => {
    if (activeTab === 'chat' && studentData.id) {
      loadContacts();
    }
  }, [activeTab, studentData.id]);

  useEffect(() => {
    if (activeTab === 'notifications' && userData?.id) {
      fetchNotifications();
    }
  }, [activeTab, userData?.id]);

  const fetchStudentData = async () => {
    try {
      console.log('👨‍🎓 Fetching student data for user:', userData.id);
      const response = await fetch(`${baseUrl}/api/students/${userData.id}`);
      const data = await response.json();
      
      console.log('👨‍🎓 Student data response:', data);
      
      if (data.success && data.data) {
        setStudentData(data.data);
        setEditedStudentData(data.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
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

  const fetchInternships = async () => {
    if (!studentData.id) return;
    
    try {
      console.log('🎯 Loading internships for student:', studentData.id);
      const response = await fetch(`${baseUrl}/api/matching/student/${studentData.id}`);
      const data = await response.json();
      
      console.log('🎯 Internships response:', data);
      
      if (response.ok && data.success) {
        const internshipsWithScores = (data.matches || []).map((internship: any) => ({
          ...internship,
          match_score: internship.match_percentage || internship.match_score || internship.score || 0,
        }));
        setInternships(internshipsWithScores);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
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

  const loadContacts = async () => {
    if (!userData?.id) return;
    
    try {
      console.log('📞 Loading contacts for user:', userData.id);
      const response = await fetch(`${baseUrl}/api/students/${userData.id}/trainers`);
      const data = await response.json();
      
      console.log('📞 Trainers response:', data);
      
      if (data.success) {
        const trainersWithUnread = await Promise.all(
          (data.trainers || []).map(async (trainer: any) => {
            let unreadCount = 0;
            try {
              unreadCount = await getUnreadCount(userData.id, trainer.user_id);
            } catch (error) {
              console.error('Error getting unread count:', error);
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
        setContacts(trainersWithUnread);
        if (trainersWithUnread.length > 0 && !selectedContactId) {
          setSelectedContactId(trainersWithUnread[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadMessagesForContact = async (contactId: number) => {
    if (!userData?.id || !contactId) return;
    
    try {
      console.log('💬 Loading messages between:', userData.id, 'and:', contactId);
      const chatMessages = await loadChatMessages(userData.id, contactId);
      setMessages(chatMessages);
      await markMessagesAsRead(contactId, userData.id);
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

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/students/${studentData.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedStudentData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStudentData(data.data);
        setEditedStudentData(data.data);
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

  const renderOverview = () => {
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
            onPress={() => setActiveTab('applications')}
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
            onPress={() => setActiveTab('applications')}
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

  const renderInternships = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Recommended Internships</Text>
          <Text style={styles.dashboardSubtitle}>
            Internships matched to your profile
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Internships</Text>
        <Text style={styles.sectionSubtitle}>{internships.length} internships</Text>

        {internships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No internships found</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        ) : (
          internships.map((item: any) => (
            <View key={item.id} style={styles.internshipCard}>
              <View style={styles.internshipHeader}>
                <View style={styles.companyLogo}>
                  <Text style={styles.avatarText}>{item.company_name?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.internshipInfo}>
                  <Text style={styles.companyNameText}>{item.company_name}</Text>
                  <Text style={styles.companyIndustryText}>{item.company_industry}</Text>
                </View>
              </View>

              <Text style={styles.internshipTitleText}>{item.title}</Text>

              <View style={styles.internshipDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Match Score:</Text>
                  <View style={styles.matchScoreContainer}>
                    <Text style={styles.matchScoreText}>{Math.round(item.match_score)}%</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{item.duration || 'N/A'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.applyButton]}
                onPress={() => Alert.alert('Apply', `Apply to ${item.title}`)}
              >
                <Text style={styles.buttonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderApplications = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>My Applications</Text>
          <Text style={styles.dashboardSubtitle}>
            Track your internship applications
          </Text>
        </View>

        <Text style={styles.sectionTitle}>All Applications</Text>
        <Text style={styles.sectionSubtitle}>{applications.length} applications</Text>

        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No applications yet</Text>
            <Text style={styles.emptySubtext}>Start applying to internships!</Text>
          </View>
        ) : (
          applications.map((app: any) => (
            <View key={app.id} style={styles.applicationCard}>
              <Text style={styles.applicationTitle}>{app.internship_title || app.title}</Text>
              <Text style={styles.applicationCompany}>{app.company_name || app.company}</Text>
              <Text style={styles.applicationDate}>
                Applied: {new Date(app.created_at).toLocaleDateString()}
              </Text>
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

  const renderChat = () => {
    return (
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
                <View style={styles.contactAvatar}>
                  <Text style={styles.avatarText}>{contact.name?.charAt(0) || 'T'}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                </View>
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
            <Text style={styles.chatSubtitle}>Real-time messaging</Text>
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
  };

  const renderNotifications = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Notifications</Text>
          <Text style={styles.dashboardSubtitle}>
            View all your notifications and updates
          </Text>
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
                onPress={() => setIsEditingProfile(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'internships':
        return renderInternships();
      case 'applications':
        return renderApplications();
      case 'chat':
        return renderChat();
      case 'notifications':
        return renderNotifications();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
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
    width: 120,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  chatSidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactItemActive: {
    backgroundColor: '#eff6ff',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  contactRole: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
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
  messagesList: {
    flex: 1,
    padding: 16,
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
    backgroundColor: '#3b82f6',
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
    color: '#fff',
  },
  messageTextReceived: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeSent: {
    color: '#dbeafe',
  },
  messageTimeReceived: {
    color: '#9ca3af',
  },
  messageInputRow: {
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
  },
  messageSendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  messageSendText: {
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
});

export default StudentDashboardScreen;
