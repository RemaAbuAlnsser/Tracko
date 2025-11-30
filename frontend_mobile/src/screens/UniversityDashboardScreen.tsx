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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DrawerMenu from '../components/DrawerMenu';

interface UniversityDashboardScreenProps {
  userData?: any;
  onLogout?: () => void;
}

type TabKey = 'dashboard' | 'profile' | 'partnerships' | 'students' | 'internships' | 'reports' | 'notifications' | 'messages' | 'requests';

const UniversityDashboardScreen: React.FC<UniversityDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [universityData, setUniversityData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    university_type: 'public',
    domain: '',
    address: '',
    website: '',
    description: '',
  });
  const [dashboardStats, setDashboardStats] = useState({
    studentsCount: 0,
    activePartnershipsCount: 0,
    internshipsCount: 0,
  });
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUniversityData, setEditedUniversityData] = useState(universityData);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // Partnerships state
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [partnershipData, setPartnershipData] = useState({
    agreement_date: '',
    agreement_end_date: '',
    agreement_duration: '',
    contact_person_university: '',
    contact_person_company: '',
    terms_and_conditions: '',
    training_hours: '',
    status: 'pending',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Students state
  const [students, setStudents] = useState<any[]>([]);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [studentsFilterStatus, setStudentsFilterStatus] = useState('all');
  
  // Internships state
  const [internships, setInternships] = useState<any[]>([]);
  const [internshipSearchTerm, setInternshipSearchTerm] = useState('');
  const [internshipFilterStatus, setInternshipFilterStatus] = useState('all');
  
  // Reports state
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

  useEffect(() => {
    if (userData?.email) {
      fetchUniversityData();
    }
  }, [userData]);

  useEffect(() => {
    if (universityData.id) {
      fetchDashboardStats();
      fetchRegistrationRequests();
    }
  }, [universityData.id]);

  useEffect(() => {
    if (activeTab === 'partnerships' && universityData.id) {
      fetchPartnerships();
      fetchCompanies();
    }
  }, [activeTab, universityData.id]);

  useEffect(() => {
    if (activeTab === 'students' && universityData.id) {
      fetchStudents();
    }
  }, [activeTab, universityData.id]);

  useEffect(() => {
    if (activeTab === 'internships' && universityData.id) {
      fetchInternships();
    }
  }, [activeTab, universityData.id]);

  useEffect(() => {
    if (activeTab === 'reports' && universityData.id) {
      fetchWeeklyReports();
    }
  }, [activeTab, universityData.id]);

  useEffect(() => {
    if (activeTab === 'notifications' && userData?.id) {
      fetchNotifications();
    }
  }, [activeTab, userData?.id]);

  const fetchUniversityData = async () => {
    try {
      console.log('🎓 Fetching university data for email:', userData.email);
      const encodedEmail = encodeURIComponent(userData.email);
      const url = `${baseUrl}/api/universities/email/${encodedEmail}`;
      console.log('🎓 Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('🎓 Response status:', response.status);
      
      const data = await response.json();
      console.log('🎓 Response data:', data);
      
      if (data.success && data.data) {
        setUniversityData(data.data);
        setEditedUniversityData(data.data);
      } else {
        console.error('🎓 Failed to fetch university data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching university data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/universities/${universityData.id}/statistics`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRegistrationRequests = async () => {
    if (!universityData.id) return;
    
    try {
      console.log('📋 Loading registration requests for university:', universityData.id);
      const response = await fetch(`${baseUrl}/api/universities/${universityData.id}/registration-requests`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Loaded registration requests:', data.data);
        setRegistrationRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error loading registration requests:', error);
    }
  };

  const fetchPartnerships = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/partnerships/university/${universityData.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPartnerships(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/companies`);
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/students/university/${universityData.id}`);
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchInternships = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/internships/by-university/${universityData.id}`);
      const data = await response.json();
      
      if (data.success) {
        setInternships(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
    }
  };

  const fetchWeeklyReports = async () => {
    if (!universityData.id) {
      console.log('⚠️ Cannot load weekly reports: university ID is missing');
      return;
    }
    
    try {
      const url = `${baseUrl}/api/weekly-reports/university/${universityData.id}`;
      console.log('📊 Fetching weekly reports from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Weekly reports response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Loaded weekly reports:', data.reports);
        setWeeklyReports(data.reports || []);
      } else {
        console.error('❌ Failed to load weekly reports:', data);
        setWeeklyReports([]);
      }
    } catch (error) {
      console.error('Error fetching weekly reports:', error);
      setWeeklyReports([]);
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

  const handleApproveRequest = async (requestId: number) => {
    Alert.alert(
      'Confirm Approval',
      'Are you sure you want to approve this student registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${baseUrl}/api/universities/registration-requests/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ universityId: universityData.id }),
              });
              
              const data = await response.json();
              
              if (response.ok) {
                setMessage({ type: 'success', text: 'Student registration approved successfully!' });
                fetchRegistrationRequests();
                fetchDashboardStats();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
              } else {
                setMessage({ type: 'error', text: data.message || 'Failed to approve request' });
              }
            } catch (error) {
              console.error('Approve error:', error);
              setMessage({ type: 'error', text: 'Failed to approve request' });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectRequest = async (requestId: number) => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this student registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${baseUrl}/api/universities/registration-requests/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ universityId: universityData.id }),
              });
              
              const data = await response.json();
              
              if (response.ok) {
                setMessage({ type: 'success', text: 'Student registration rejected successfully!' });
                fetchRegistrationRequests();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
              } else {
                setMessage({ type: 'error', text: data.message || 'Failed to reject request' });
              }
            } catch (error) {
              console.error('Reject error:', error);
              setMessage({ type: 'error', text: 'Failed to reject request' });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/universities/email/${universityData.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUniversityData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUniversityData(data.data);
        setEditedUniversityData(data.data);
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

    const placementRate = dashboardStats.studentsCount > 0 ? '92%' : '0%';
    const partnershipGrowth = Math.floor(dashboardStats.activePartnershipsCount * 0.2);
    const matchRate = dashboardStats.internshipsCount > 0 ? '88%' : '0%';

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>University Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            Welcome back, {universityData.name || userData?.full_name}! Monitor your students and partnerships.
          </Text> */}
        </View>

        <Text style={styles.sectionTitle}>University Performance</Text>
        <Text style={styles.sectionSubtitle}>Overview of academic partnerships and placements</Text>
        
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardBlue]}
            onPress={() => setActiveTab('students')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Students</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Enrolled</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.studentsCount}</Text>
            <Text style={styles.kpiDescription}>Total students enrolled</Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Placement Rate</Text>
              <Text style={styles.kpiFooterValue}>{placementRate}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardGreen]}
            onPress={() => setActiveTab('partnerships')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Active Partnerships</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Companies</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.activePartnershipsCount}</Text>
            <Text style={styles.kpiDescription}>Active company partnerships</Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Partnership Growth</Text>
              <Text style={styles.kpiFooterValue}>+{partnershipGrowth} this year</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.kpiCard, styles.kpiCardOrange]}
            onPress={() => setActiveTab('internships')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Internship Opportunities</Text>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>Available</Text>
              </View>
            </View>
            <Text style={styles.kpiNumber}>{dashboardStats.internshipsCount}</Text>
            <Text style={styles.kpiDescription}>Available internships</Text>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiFooterLabel}>Match Rate</Text>
              <Text style={styles.kpiFooterValue}>{matchRate}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>University Growth Trends</Text>
        <Text style={styles.sectionSubtitle}>Last 6 Months</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
              datasets: [
                {
                  data: [
                    Math.max(50, Math.floor(dashboardStats.studentsCount * 0.5)),
                    Math.max(70, Math.floor(dashboardStats.studentsCount * 0.6)),
                    Math.max(90, Math.floor(dashboardStats.studentsCount * 0.7)),
                    Math.max(110, Math.floor(dashboardStats.studentsCount * 0.8)),
                    Math.max(130, Math.floor(dashboardStats.studentsCount * 0.9)),
                    dashboardStats.studentsCount || 0,
                  ],
                },
              ],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
            }}
            style={styles.chart}
            bezier
          />
        </View>

        <Text style={styles.sectionTitle}>Current Statistics</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: ['Students', 'Partnerships', 'Internships'],
              datasets: [{
                data: [
                  dashboardStats.studentsCount || 1,
                  dashboardStats.activePartnershipsCount || 1,
                  dashboardStats.internshipsCount || 1,
                ],
              }],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        <Text style={styles.sectionTitle}>Resource Distribution</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={[
              {
                name: 'Students',
                population: dashboardStats.studentsCount || 1,
                color: '#0ea5e9',
                legendFontColor: '#1f2937',
              },
              {
                name: 'Partnerships',
                population: (dashboardStats.activePartnershipsCount || 1) * 10,
                color: '#22c55e',
                legendFontColor: '#1f2937',
              },
              {
                name: 'Internships',
                population: (dashboardStats.internshipsCount || 1) * 5,
                color: '#f59e0b',
                legendFontColor: '#1f2937',
              },
            ]}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </ScrollView>
    );
  };

  const renderProfile = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>University Profile</Text>
        
        {message.text ? (
          <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ) : null}

        <View style={styles.profileSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>University Name</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.name : universityData.name}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, name: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.email : universityData.email}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, email: text })}
              editable={isEditingProfile}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.phone : universityData.phone}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, phone: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Domain</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.domain : universityData.domain}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, domain: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>University Type</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.university_type : universityData.university_type}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, university_type: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.address : universityData.address}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, address: text })}
              editable={isEditingProfile}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={[styles.input, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.website : universityData.website}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, website: text })}
              editable={isEditingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, !isEditingProfile && styles.inputDisabled]}
              value={isEditingProfile ? editedUniversityData.description : universityData.description}
              onChangeText={(text) => setEditedUniversityData({ ...editedUniversityData, description: text })}
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
                    setEditedUniversityData(universityData);
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

  const renderRegistrationRequests = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Student Registration Requests</Text>
        
        {message.text ? (
          <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ) : null}
        
        {registrationRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending registration requests</Text>
          </View>
        ) : (
          registrationRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestName}>{request.full_name}</Text>
                <Text style={styles.requestDate}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.requestEmail}>{request.email}</Text>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => handleApproveRequest(request.id)}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={() => handleRejectRequest(request.id)}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const handleCreatePartnership = async () => {
    if (!selectedCompany) {
      Alert.alert('Error', 'Please select a company');
      return;
    }

    if (!partnershipData.training_hours) {
      Alert.alert('Error', 'Training hours is required');
      return;
    }

    try {
      setLoading(true);
      
      // Convert empty strings to null for numeric fields
      const cleanedData = {
        university_id: universityData.id,
        company_id: selectedCompany,
        agreement_date: partnershipData.agreement_date || null,
        agreement_end_date: partnershipData.agreement_end_date || null,
        agreement_duration: partnershipData.agreement_duration ? parseInt(partnershipData.agreement_duration) : null,
        contact_person_university: partnershipData.contact_person_university || null,
        contact_person_company: partnershipData.contact_person_company || null,
        terms_and_conditions: partnershipData.terms_and_conditions || null,
        training_hours: parseInt(partnershipData.training_hours),
        status: partnershipData.status || 'pending',
      };

      const response = await fetch(`${baseUrl}/api/partnerships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Partnership created successfully');
        setSelectedCompany('');
        setPartnershipData({
          agreement_date: '',
          agreement_end_date: '',
          agreement_duration: '',
          contact_person_university: '',
          contact_person_company: '',
          terms_and_conditions: '',
          training_hours: '',
          status: 'pending',
        });
        fetchPartnerships();
      } else {
        Alert.alert('Error', data.message || 'Failed to create partnership');
      }
    } catch (error) {
      console.error('Error creating partnership:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPartnerships = () => {
    const filteredPartnerships = partnerships.filter(p => {
      const matchesSearch = p.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Company Partnerships</Text>
          <Text style={styles.dashboardSubtitle}>
            View and manage all your partnerships with companies
          </Text>
        </View>

        {message.text ? (
          <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ) : null}

        {/* Create New Partnership Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New Partnership</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Company *</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.input}
                value={companies.find(c => c.id === parseInt(selectedCompany))?.name || 'Select a company'}
                editable={false}
              />
            </View>
            <ScrollView style={styles.companyList} nestedScrollEnabled>
              {companies.map(company => (
                <TouchableOpacity
                  key={company.id}
                  style={[
                    styles.companyItem,
                    selectedCompany === company.id.toString() && styles.companyItemSelected
                  ]}
                  onPress={() => setSelectedCompany(company.id.toString())}
                >
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyIndustry}>{company.industry}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Agreement Start Date</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.agreement_date}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, agreement_date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Agreement End Date</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.agreement_end_date}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, agreement_end_date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Duration (months)</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.agreement_duration}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, agreement_duration: text })}
                placeholder="12"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Training Hours *</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.training_hours}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, training_hours: text })}
                placeholder="240"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>University Contact</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.contact_person_university}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, contact_person_university: text })}
                placeholder="Name"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Company Contact</Text>
              <TextInput
                style={styles.input}
                value={partnershipData.contact_person_company}
                onChangeText={(text) => setPartnershipData({ ...partnershipData, contact_person_company: text })}
                placeholder="Name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Terms and Conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={partnershipData.terms_and_conditions}
              onChangeText={(text) => setPartnershipData({ ...partnershipData, terms_and_conditions: text })}
              placeholder="Enter partnership terms..."
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.createButton, (!selectedCompany || loading) && styles.buttonDisabled]}
            onPress={handleCreatePartnership}
            disabled={!selectedCompany || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Partnership</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Partnerships</Text>
        <Text style={styles.sectionSubtitle}>{filteredPartnerships.length} partnerships</Text>

        {filteredPartnerships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No partnerships found</Text>
            <Text style={styles.emptySubtext}>Start by creating your first partnership with a company</Text>
          </View>
        ) : (
          filteredPartnerships.map((partnership) => (
            <View key={partnership.id} style={styles.partnershipCard}>
              <View style={styles.partnershipHeader}>
                <Text style={styles.partnershipCompany}>{partnership.company_name}</Text>
                <View style={[
                  styles.statusBadge,
                  partnership.status === 'active' && styles.statusActive,
                  partnership.status === 'pending' && styles.statusPending,
                  partnership.status === 'expired' && styles.statusExpired,
                ]}>
                  <Text style={styles.statusText}>{partnership.status}</Text>
                </View>
              </View>
              <View style={styles.partnershipDetails}>
                <Text style={styles.partnershipLabel}>Agreement Period:</Text>
                <Text style={styles.partnershipValue}>
                  {partnership.agreement_date ? new Date(partnership.agreement_date).toLocaleDateString() : 'N/A'} - 
                  {partnership.agreement_end_date ? new Date(partnership.agreement_end_date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.partnershipDetails}>
                <Text style={styles.partnershipLabel}>Duration:</Text>
                <Text style={styles.partnershipValue}>{partnership.agreement_duration || 'N/A'} months</Text>
              </View>
              <View style={styles.partnershipDetails}>
                <Text style={styles.partnershipLabel}>Training Hours:</Text>
                <Text style={styles.partnershipValue}>{partnership.training_hours || 'N/A'} hours</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderStudents = () => {
    const filteredStudents = students.filter(s => {
      const matchesSearch = 
        s.full_name?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
        s.major?.toLowerCase().includes(studentsSearchTerm.toLowerCase());
      
      const hasCompletedTraining = s.final_report && s.final_report.university_approved;
      const isInTraining = s.internships?.some((i: any) => i.match_status === 'accepted');
      
      const matchesStatus = 
        studentsFilterStatus === 'all' ||
        (studentsFilterStatus === 'completed' && hasCompletedTraining) ||
        (studentsFilterStatus === 'in_training' && isInTraining && !hasCompletedTraining);
      
      return matchesSearch && matchesStatus;
    });

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>Students Management</Text>
          <Text style={styles.dashboardSubtitle}>
            View and manage all students from your university
          </Text> */}
        </View>

        <Text style={styles.sectionTitle}>University Students</Text>
        <Text style={styles.sectionSubtitle}>{filteredStudents.length} students</Text>

        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>No students are registered from your university yet</Text>
          </View>
        ) : (
          filteredStudents.map((student) => {
            const currentInternship = student.internships?.find((i: any) => 
              i.match_status === 'accepted' || i.match_status === 'pending'
            ) || student.internships?.[0];
            
            const hasCompletedTraining = student.final_report && student.final_report.university_approved;
            const isInTraining = currentInternship && currentInternship.match_status === 'accepted';

            return (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>{student.full_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </View>
                </View>

                <View style={styles.studentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Major:</Text>
                    <Text style={styles.detailValue}>{student.major || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Academic Year:</Text>
                    <Text style={styles.detailValue}>{student.academic_year || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GPA:</Text>
                    {student.gpa ? (
                      <View style={[
                        styles.gpaBadge,
                        student.gpa >= 3.5 ? styles.gpaHigh : student.gpa >= 3.0 ? styles.gpaMedium : styles.gpaLow
                      ]}>
                        <Text style={styles.gpaText}>{student.gpa}</Text>
                      </View>
                    ) : (
                      <Text style={styles.detailValue}>N/A</Text>
                    )}
                  </View>
                </View>

                <View style={styles.statusSection}>
                  <Text style={styles.detailLabel}>Training Status:</Text>
                  {hasCompletedTraining ? (
                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                      <Text style={styles.statusText}>Training Completed</Text>
                    </View>
                  ) : isInTraining ? (
                    <View style={[styles.statusBadge, styles.statusInTraining]}>
                      <Text style={styles.statusText}>In Training</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusNotStarted]}>
                      <Text style={styles.statusText}>Not Started</Text>
                    </View>
                  )}
                </View>

                {currentInternship && (
                  <View style={styles.internshipSection}>
                    <Text style={styles.detailLabel}>Current Internship:</Text>
                    <Text style={styles.internshipTitle}>{currentInternship.internship_title}</Text>
                    <Text style={styles.internshipCompany}>{currentInternship.company_name}</Text>
                    <View style={[
                      styles.statusBadge,
                      currentInternship.match_status === 'accepted' && styles.statusActive,
                      currentInternship.match_status === 'pending' && styles.statusPending,
                    ]}>
                      <Text style={styles.statusText}>{currentInternship.match_status}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderInternships = () => {
    const filteredInternships = internships.filter(i => {
      const matchesSearch = 
        i.title?.toLowerCase().includes(internshipSearchTerm.toLowerCase()) ||
        i.company_name?.toLowerCase().includes(internshipSearchTerm.toLowerCase()) ||
        i.specialization?.toLowerCase().includes(internshipSearchTerm.toLowerCase());
      
      const matchesStatus = 
        internshipFilterStatus === 'all' || i.status === internshipFilterStatus;
      
      return matchesSearch && matchesStatus;
    });

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>Internship Opportunities</Text>
          <Text style={styles.dashboardSubtitle}>
            Browse all available internships from companies
          </Text> */}
        </View>

        <Text style={styles.sectionTitle}>Available Internships</Text>
        <Text style={styles.sectionSubtitle}>{filteredInternships.length} internships</Text>

        {filteredInternships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No internships found</Text>
            <Text style={styles.emptySubtext}>No internship opportunities available yet</Text>
          </View>
        ) : (
          filteredInternships.map((internship) => (
            <View key={internship.id} style={styles.internshipCard}>
              <View style={styles.internshipHeader}>
                <View style={styles.companyLogo}>
                  <Text style={styles.avatarText}>{internship.company_name?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.internshipInfo}>
                  <Text style={styles.companyNameText}>{internship.company_name}</Text>
                  <Text style={styles.companyIndustryText}>{internship.company_industry}</Text>
                </View>
              </View>

              <Text style={styles.internshipTitleText}>{internship.title}</Text>

              <View style={styles.internshipDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specialization:</Text>
                  <Text style={styles.detailValue}>{internship.specialization || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Capacity:</Text>
                  <View style={styles.capacityBadge}>
                    <Text style={styles.capacityText}>{internship.capacity} position(s)</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    internship.status === 'open' && styles.statusActive,
                    internship.status === 'closed' && styles.statusExpired,
                    internship.status === 'in_progress' && styles.statusPending,
                  ]}>
                    <Text style={styles.statusText}>{internship.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Posted:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(internship.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {internship.trainers && internship.trainers.length > 0 && (
                <View style={styles.trainersSection}>
                  <Text style={styles.detailLabel}>Trainers:</Text>
                  <View style={styles.trainersList}>
                    {internship.trainers.map((trainer: any, idx: number) => (
                      <View key={idx} style={styles.trainerBadge}>
                        <Text style={styles.trainerText}>{trainer.full_name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderReports = () => {
    console.log('📊 Rendering reports, total reports:', weeklyReports?.length || 0);
    console.log('📊 First report:', weeklyReports?.[0]);
    
    if (!weeklyReports || weeklyReports.length === 0) {
      return (
        <ScrollView style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Student Weekly Reports</Text>
          <Text style={styles.sectionSubtitle}>0 students</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>No weekly reports have been submitted yet</Text>
          </View>
        </ScrollView>
      );
    }
    
    // Group reports by student and get latest for each
    const studentReportsMap: any = {};
    weeklyReports.forEach(report => {
      if (!studentReportsMap[report.student_id] || 
          new Date(report.submitted_at) > new Date(studentReportsMap[report.student_id].submitted_at)) {
        studentReportsMap[report.student_id] = report;
      }
    });
    const latestReports = Object.values(studentReportsMap);
    const uniqueStudents = [...new Set(weeklyReports.map(r => r.student_id))];
    const studentCount = uniqueStudents.length || 0;
    
    console.log('📊 Latest reports count:', latestReports.length);
    console.log('📊 Student count:', studentCount);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.dashboardHeader}>
          {/* <Text style={styles.dashboardTitle}>Reports & Analytics</Text>
          <Text style={styles.dashboardSubtitle}>
            Review and approve weekly reports submitted by students
          </Text> */}
        </View>

        {message.text ? (
          <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Student Weekly Reports</Text>
        <Text style={styles.sectionSubtitle}>{studentCount} students</Text>

        {latestReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>No weekly reports have been submitted yet</Text>
          </View>
        ) : (
          latestReports.map((report: any) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.studentHeader}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>{report.student_name?.charAt(0) || '?'}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{report.student_name}</Text>
                  <Text style={styles.studentEmail}>{report.student_email}</Text>
                </View>
              </View>

              <View style={styles.reportDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Latest Week:</Text>
                  <View style={styles.weekBadge}>
                    <Text style={styles.weekText}>Week {report.week_number}</Text>
                  </View>
                </View>

                {report.internship_title && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Internship:</Text>
                    <View style={styles.internshipInfoSmall}>
                      <Text style={styles.internshipTitleSmall}>{report.internship_title}</Text>
                      <Text style={styles.companyNameSmall}>{report.company_name}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(report.submitted_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  {report.university_approved ? (
                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                      <Text style={styles.statusText}>Approved</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusPending]}>
                      <Text style={styles.statusText}>Pending Review</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.button,
                  report.university_approved ? styles.viewButton : styles.reviewButton
                ]}
                onPress={() => Alert.alert('View Report', `Viewing report for ${report.student_name}`)}
              >
                <Text style={styles.buttonText}>
                  {report.university_approved ? 'View Report' : 'Review Report'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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

  const renderPlaceholder = (title: string) => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>This section is under development</Text>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'profile':
        return renderProfile();
      case 'requests':
        return renderRegistrationRequests();
      case 'partnerships':
        return renderPartnerships();
      case 'students':
        return renderStudents();
      case 'internships':
        return renderInternships();
      case 'reports':
        return renderReports();
      case 'notifications':
        return renderNotifications();
      case 'messages':
        return renderPlaceholder('Messages/Chat');
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
              userType="university"
              userData={universityData}
              activeMenu={activeTab}
              onMenuSelect={(menu) => {
                setActiveTab(menu as TabKey);
                setDrawerVisible(false);
              }}
              onLogout={() => {
                setDrawerVisible(false);
                onLogout?.();
              }}
              pendingCount={registrationRequests.length}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>University Dashboard</Text>
            <Text style={styles.headerSubtitle}>{universityData.name || userData?.full_name}</Text>
          </View>
        </View>
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
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
    padding: 4,
  },
  menuIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#93c5fd',
    marginTop: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 24,
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
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  kpiCardBlue: {
    backgroundColor: '#3b82f6',
  },
  kpiCardGreen: {
    backgroundColor: '#10b981',
  },
  kpiCardOrange: {
    backgroundColor: '#f59e0b',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kpiLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  kpiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kpiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  kpiNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  kpiDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiFooterLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  kpiFooterValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
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
  chart: {
    borderRadius: 12,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1e3a8a',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#1f2937',
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  requestDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  requestEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  partnershipCard: {
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
  partnershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnershipCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusExpired: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  partnershipDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partnershipLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  partnershipValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  companyList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  companyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  companyItemSelected: {
    backgroundColor: '#dbeafe',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  companyIndustry: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#1e3a8a',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  studentDetails: {
    marginBottom: 12,
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
  gpaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpaHigh: {
    backgroundColor: '#dcfce7',
  },
  gpaMedium: {
    backgroundColor: '#fef3c7',
  },
  gpaLow: {
    backgroundColor: '#fee2e2',
  },
  gpaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusSection: {
    marginBottom: 12,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusInTraining: {
    backgroundColor: '#fef3c7',
  },
  statusNotStarted: {
    backgroundColor: '#f3f4f6',
  },
  internshipSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  internshipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  internshipCompany: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 4,
  },
  internshipCard: {
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
  internshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  internshipInfo: {
    flex: 1,
  },
  companyNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  companyIndustryText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  internshipTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  internshipDetails: {
    marginBottom: 12,
  },
  capacityBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  trainersSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trainersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  trainerBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trainerText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  reportCard: {
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
  reportDetails: {
    marginBottom: 12,
  },
  weekBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  weekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  internshipInfoSmall: {
    flex: 1,
  },
  internshipTitleSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  companyNameSmall: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: '#6b7280',
  },
  reviewButton: {
    backgroundColor: '#3b82f6',
  },
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
    borderLeftColor: '#3b82f6',
  },
  notificationContent: {
    marginBottom: 8,
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
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default UniversityDashboardScreen;
