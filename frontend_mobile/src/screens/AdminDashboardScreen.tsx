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
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
// Charts will be added later when react-native-chart-kit is properly configured
import DrawerMenu from '../components/DrawerMenu';

interface AdminDashboardScreenProps {
  userData?: any;
  onLogout?: () => void;
}

type TabKey = 'overview' | 'users' | 'companies' | 'universities' | 'students' | 'trainers' | 'internships' | 'partnerships' | 'notifications';

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [adminData, setAdminData] = useState({
    id: null,
    name: '',
    email: '',
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalUniversities: 0,
    totalStudents: 0,
    totalTrainers: 0,
    totalInternships: 0,
    activeInternships: 0,
    totalPartnerships: 0,
    activePartnerships: 0,
    pendingCompanies: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Users Management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Companies Management state
  const [companies, setCompanies] = useState<any[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  
  // Universities Management state
  const [universities, setUniversities] = useState<any[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  
  // Students Management state
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Trainers Management state
  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  
  // Internships Management state
  const [internships, setInternships] = useState<any[]>([]);
  const [internshipsLoading, setInternshipsLoading] = useState(false);
  
  // Partnerships Management state
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [partnershipsLoading, setPartnershipsLoading] = useState(false);
  
  // Notifications Management state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Get base URL based on platform
  const baseUrl = Platform.OS === 'ios' ? 'http://localhost:5050' : 'http://10.0.2.2:5050';

  useEffect(() => {
    if (userData) {
      setAdminData({
        id: userData.id,
        name: userData.full_name || 'Admin',
        email: userData.email || '',
      });
      fetchStats();
    }
  }, [userData]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setMessage({ text: 'Failed to load statistics', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMessage({ text: 'Failed to load statistics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setMessage({ text: 'Failed to load users', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ text: 'Failed to load users', type: 'error' });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/admin/users/delete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: userData?.id,
                  userIdToDelete: userId 
                }),
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'User deleted successfully', type: 'success' });
                fetchUsers(); // Refresh the list
              } else {
                setMessage({ text: data.message || 'Failed to delete user', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              setMessage({ text: 'Failed to delete user', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies || []);
      } else {
        setMessage({ text: 'Failed to load companies', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setMessage({ text: 'Failed to load companies', type: 'error' });
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This will also delete all related internships and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/companies/${companyId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Company deleted successfully', type: 'success' });
                fetchCompanies();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete company', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting company:', error);
              setMessage({ text: 'Failed to delete company', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchUniversities = async () => {
    try {
      setUniversitiesLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/universities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setUniversities(data.universities || []);
      } else {
        setMessage({ text: 'Failed to load universities', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setMessage({ text: 'Failed to load universities', type: 'error' });
    } finally {
      setUniversitiesLoading(false);
    }
  };

  const handleDeleteUniversity = async (universityId: number) => {
    Alert.alert(
      'Delete University',
      'Are you sure you want to delete this university? This will also delete all related students and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/universities/${universityId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'University deleted successfully', type: 'success' });
                fetchUniversities();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete university', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting university:', error);
              setMessage({ text: 'Failed to delete university', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setMessage({ text: 'Failed to load students', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ text: 'Failed to load students', type: 'error' });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student? This will also delete all related applications and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/students/${studentId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Student deleted successfully', type: 'success' });
                fetchStudents();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete student', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting student:', error);
              setMessage({ text: 'Failed to delete student', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchTrainers = async () => {
    try {
      setTrainersLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/trainers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setTrainers(data.trainers || []);
      } else {
        setMessage({ text: 'Failed to load trainers', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setMessage({ text: 'Failed to load trainers', type: 'error' });
    } finally {
      setTrainersLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: number) => {
    Alert.alert(
      'Delete Trainer',
      'Are you sure you want to delete this trainer? This will also delete all related training data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/trainers/${trainerId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Trainer deleted successfully', type: 'success' });
                fetchTrainers();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete trainer', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting trainer:', error);
              setMessage({ text: 'Failed to delete trainer', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchInternships = async () => {
    try {
      setInternshipsLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/internships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setInternships(data.internships || []);
      } else {
        setMessage({ text: 'Failed to load internships', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      setMessage({ text: 'Failed to load internships', type: 'error' });
    } finally {
      setInternshipsLoading(false);
    }
  };

  const handleDeleteInternship = async (internshipId: number) => {
    Alert.alert(
      'Delete Internship',
      'Are you sure you want to delete this internship? This will also delete all related applications and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/internships/${internshipId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Internship deleted successfully', type: 'success' });
                fetchInternships();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete internship', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting internship:', error);
              setMessage({ text: 'Failed to delete internship', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const fetchPartnerships = async () => {
    try {
      setPartnershipsLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/partnerships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setPartnerships(data.partnerships || []);
      } else {
        setMessage({ text: 'Failed to load partnerships', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      setMessage({ text: 'Failed to load partnerships', type: 'error' });
    } finally {
      setPartnershipsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await fetch(`${baseUrl}/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setMessage({ text: 'Failed to load notifications', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setMessage({ text: 'Failed to load notifications', type: 'error' });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleDeletePartnership = async (partnershipId: number) => {
    Alert.alert(
      'Delete Partnership',
      'Are you sure you want to delete this partnership?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/partnerships/${partnershipId}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Partnership deleted successfully', type: 'success' });
                fetchPartnerships();
                fetchStats();
              } else {
                setMessage({ text: data.message || 'Failed to delete partnership', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting partnership:', error);
              setMessage({ text: 'Failed to delete partnership', type: 'error' });
            }
          }
        },
      ]
    );
  };

  const handleDeleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/api/admin/notifications/delete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: userData?.id,
                  notificationId: notificationId 
                }),
              });

              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not found or server error');
              }

              const data = await response.json();
              if (data.success) {
                setMessage({ text: 'Notification deleted successfully', type: 'success' });
                fetchNotifications();
              } else {
                setMessage({ text: data.message || 'Failed to delete notification', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              if (error instanceof Error && error.message?.includes('API endpoint not found')) {
                setMessage({ text: 'Delete notification feature not yet implemented in backend', type: 'error' });
              } else {
                setMessage({ text: 'Failed to delete notification', type: 'error' });
              }
            }
          }
        },
      ]
    );
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setDrawerVisible(false);
    
    // Load data based on active tab
    switch (tab) {
      case 'users':
        fetchUsers();
        break;
      case 'companies':
        fetchCompanies();
        break;
      case 'universities':
        fetchUniversities();
        break;
      case 'students':
        fetchStudents();
        break;
      case 'trainers':
        fetchTrainers();
        break;
      case 'internships':
        fetchInternships();
        break;
      case 'partnerships':
        fetchPartnerships();
        break;
      case 'notifications':
        fetchNotifications();
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          }
        },
      ]
    );
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      );
    }

    // Chart configuration removed for now

    return (
      <ScrollView style={styles.overviewContainer} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardUsers]}>
            <View style={[styles.statIcon, styles.statIconUsers]}>
              <Text style={styles.statIconText}>👥</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardCompanies]}>
            <View style={[styles.statIcon, styles.statIconCompanies]}>
              <Text style={styles.statIconText}>🏢</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.totalCompanies || 0}</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardUniversities]}>
            <View style={[styles.statIcon, styles.statIconUniversities]}>
              <Text style={styles.statIconText}>🎓</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{stats.totalUniversities || 0}</Text>
              <Text style={styles.statLabel}>Universities</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardStudents]}>
            <View style={[styles.statIcon, styles.statIconStudents]}>
              <Text style={styles.statIconText}>👨‍🎓</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.totalStudents || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardTrainers]}>
            <View style={[styles.statIcon, styles.statIconTrainers]}>
              <Text style={styles.statIconText}>👨‍🏫</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#06b6d4' }]}>{stats.totalTrainers || 0}</Text>
              <Text style={styles.statLabel}>Trainers</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardInternships]}>
            <View style={[styles.statIcon, styles.statIconInternships]}>
              <Text style={styles.statIconText}>💼</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#ec4899' }]}>{stats.totalInternships || 0}</Text>
              <Text style={styles.statLabel}>Total Internships</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardActive]}>
            <View style={[styles.statIcon, styles.statIconActive]}>
              <Text style={styles.statIconText}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.activeInternships || 0}</Text>
              <Text style={styles.statLabel}>Active Internships</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardPending]}>
            <View style={[styles.statIcon, styles.statIconPending]}>
              <Text style={styles.statIconText}>🔔</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pendingRequests || 0}</Text>
              <Text style={styles.statLabel}>Pending Registrations</Text>
            </View>
          </View>
        </View>

        {/* System Summary */}
        <Text style={styles.sectionTitle}>System Summary</Text>
        
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Platform Health</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Users:</Text>
              <Text style={styles.summaryValue}>{stats.totalUsers || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active Internships:</Text>
              <Text style={styles.summaryValue}>{stats.activeInternships || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Requests:</Text>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{stats.pendingRequests || 0}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>User Distribution</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Companies:</Text>
              <Text style={styles.summaryValue}>{stats.totalCompanies || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Universities:</Text>
              <Text style={styles.summaryValue}>{stats.totalUniversities || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Students:</Text>
              <Text style={styles.summaryValue}>{stats.totalStudents || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trainers:</Text>
              <Text style={styles.summaryValue}>{stats.totalTrainers || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderUsers = () => {
    if (usersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      );
    }

    if (!users || users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2.2 }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2.8 }]}>Email</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Type</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {users.map((user, index) => (
          <View key={user.id} style={[
            styles.tableRow,
            index === users.length - 1 && styles.lastTableRow,
            user.user_type === 'admin' && styles.adminRow
          ]}>
            <View style={[styles.tableCell, { flex: 0.6 }]}>
              <Text style={[styles.tableCellText, styles.idText]}>{user.id}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.2, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                {user.full_name || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.8, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.emailText]} numberOfLines={1}>
                {user.email || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1.2 }]}>
              <View style={[
                styles.userTypeBadgeSmall, 
                user.user_type === 'student' && styles.userTypeStudent,
                user.user_type === 'company' && styles.userTypeCompany,
                user.user_type === 'university' && styles.userTypeUniversity,
                user.user_type === 'trainer' && styles.userTypeTrainer,
                user.user_type === 'admin' && styles.userTypeAdmin,
              ]}>
                <Text style={styles.userTypeBadgeTextSmall}>
                  {user.user_type?.charAt(0).toUpperCase() || 'N'}
                </Text>
              </View>
            </View>
            <View style={[styles.tableCell, { flex: 0.8 }]}>
              {user.user_type !== 'admin' ? (
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeleteUser(user.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.protectedBadgeSmall}>
                  <Text style={styles.protectedTextSmall}>🛡</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCompanies = () => {
    if (companiesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      );
    }

    if (!companies || companies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No companies found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Logo</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Company Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Action</Text>
        </View>
        
        {companies.map((company, index) => (
          <View key={company.id} style={[
            styles.tableRow,
            index === companies.length - 1 && styles.lastTableRow,
          ]}>
            <View style={[styles.tableCell, { flex: 0.7 }]}>
              <Image
                source={{ uri: company.logo ? `${baseUrl}${company.logo}` : 'https://via.placeholder.com/40?text=C' }}
                style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#e5e7eb' }}
              />
            </View>
            <View style={[styles.tableCell, { flex: 0.5 }]}>
              <Text style={[styles.tableCellText, styles.idText]}>{company.id}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                {company.company_name || company.name || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.emailText]} numberOfLines={1}>
                {company.email || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1.2 }]}>
              <View style={[
                styles.statusBadgeSmall,
                company.status === 'approved' && styles.statusApproved,
                company.status === 'pending' && styles.statusPending,
                company.status === 'rejected' && styles.statusRejected,
              ]}>
                <Text style={styles.statusBadgeTextSmall}>
                  {company.status === 'approved' ? '✓' : 
                   company.status === 'pending' ? '⏳' : 
                   company.status === 'rejected' ? '✗' : '?'}
                </Text>
              </View>
            </View>
            <View style={[styles.tableCell, { flex: 0.8 }]}>
              <TouchableOpacity
                style={styles.deleteButtonSmall}
                onPress={() => handleDeleteCompany(company.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonTextSmall}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderUniversities = () => {
    if (universitiesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading universities...</Text>
        </View>
      );
    }

    if (!universities || universities.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No universities found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Logo</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>University Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Action</Text>
        </View>
        
        {universities.map((university, index) => (
          <View key={university.id} style={[
            styles.tableRow,
            index === universities.length - 1 && styles.lastTableRow,
          ]}>
            <View style={[styles.tableCell, { flex: 0.7 }]}>
              <Image
                source={{ uri: university.logo ? `${baseUrl}${university.logo}` : 'https://via.placeholder.com/35?text=U' }}
                style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#e5e7eb' }}
              />
            </View>
            <View style={[styles.tableCell, { flex: 0.5 }]}>
              <Text style={[styles.tableCellText, styles.idText]}>{university.id}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                {university.university_name || university.name || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
              <Text style={[styles.tableCellText, styles.emailText]} numberOfLines={1}>
                {university.email || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1.2 }]}>
              <View style={[
                styles.statusBadgeSmall,
                university.status === 'approved' && styles.statusApproved,
                university.status === 'pending' && styles.statusPending,
                university.status === 'rejected' && styles.statusRejected,
              ]}>
                <Text style={styles.statusBadgeTextSmall}>
                  {university.status === 'approved' ? '✓' : 
                   university.status === 'pending' ? '⏳' : 
                   university.status === 'rejected' ? '✗' : '?'}
                </Text>
              </View>
            </View>
            <View style={[styles.tableCell, { flex: 0.8 }]}>
              <TouchableOpacity
                style={styles.deleteButtonSmall}
                onPress={() => handleDeleteUniversity(university.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonTextSmall}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStudents = () => {
    if (studentsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      );
    }

    if (!students || students.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Photo</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>University</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>GPA</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {(students || []).map((student, index) => {
          if (!student) return null;
          return (
            <View key={student.id || `student-${index}`} style={[
              styles.tableRow,
              index === students.length - 1 && styles.lastTableRow,
            ]}>
              <View style={[styles.tableCell, { flex: 0.7 }]}>
                <Image
                  source={{ uri: student.profile_picture ? `${baseUrl}${student.profile_picture}` : 'https://via.placeholder.com/40?text=S' }}
                  style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#e5e7eb' }}
                />
              </View>
              <View style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellText, styles.idText]}>{student.id || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                  {student.full_name || student.name || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.emailText]} numberOfLines={1}>
                  {student.email || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.universityText]} numberOfLines={1}>
                  {student.university_name || student.university || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <View style={[
                  styles.gpaBadgeSmall,
                  student.gpa && !isNaN(parseFloat(student.gpa)) && parseFloat(student.gpa) >= 3.5 && styles.gpaExcellent,
                  student.gpa && !isNaN(parseFloat(student.gpa)) && parseFloat(student.gpa) >= 3.0 && parseFloat(student.gpa) < 3.5 && styles.gpaGood,
                  student.gpa && !isNaN(parseFloat(student.gpa)) && parseFloat(student.gpa) >= 2.5 && parseFloat(student.gpa) < 3.0 && styles.gpaAverage,
                  student.gpa && !isNaN(parseFloat(student.gpa)) && parseFloat(student.gpa) < 2.5 && styles.gpaPoor,
                  (!student.gpa || isNaN(parseFloat(student.gpa))) && styles.gpaAverage,
                ]}>
                  <Text style={styles.gpaBadgeTextSmall}>
                    {student.gpa && !isNaN(parseFloat(student.gpa)) ? parseFloat(student.gpa).toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeleteStudent(student.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderTrainers = () => {
    if (trainersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading trainers...</Text>
        </View>
      );
    }

    if (!trainers || trainers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No trainers found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Photo</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Company</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Experience</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {(trainers || []).map((trainer, index) => {
          if (!trainer) return null;
          return (
            <View key={trainer.id || `trainer-${index}`} style={[
              styles.tableRow,
              index === trainers.length - 1 && styles.lastTableRow,
            ]}>
              <View style={[styles.tableCell, { flex: 0.7 }]}>
                <Image
                  source={{ uri: trainer.profile_picture ? `${baseUrl}${trainer.profile_picture}` : 'https://via.placeholder.com/40?text=T' }}
                  style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#e5e7eb' }}
                />
              </View>
              <View style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellText, styles.idText]}>{trainer.id || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                  {trainer.full_name || trainer.name || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.emailText]} numberOfLines={1}>
                  {trainer.email || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.universityText]} numberOfLines={1}>
                  {trainer.company_name || trainer.company || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <View style={[
                  styles.experienceBadgeSmall,
                  trainer.experience_years && parseInt(trainer.experience_years) >= 5 && styles.experienceExpert,
                  trainer.experience_years && parseInt(trainer.experience_years) >= 3 && parseInt(trainer.experience_years) < 5 && styles.experienceSenior,
                  trainer.experience_years && parseInt(trainer.experience_years) >= 1 && parseInt(trainer.experience_years) < 3 && styles.experienceJunior,
                  (!trainer.experience_years || parseInt(trainer.experience_years) < 1) && styles.experienceNew,
                ]}>
                  <Text style={styles.experienceBadgeTextSmall}>
                    {trainer.experience_years && !isNaN(parseInt(trainer.experience_years)) ? `${parseInt(trainer.experience_years)}Y` : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeleteTrainer(trainer.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderInternships = () => {
    if (internshipsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading internships...</Text>
        </View>
      );
    }

    if (!internships || internships.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No internships found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Title</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Company</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Duration</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {(internships || []).map((internship, index) => {
          if (!internship) return null;
          return (
            <View key={internship.id || `internship-${index}`} style={[
              styles.tableRow,
              index === internships.length - 1 && styles.lastTableRow,
            ]}>
              <View style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellText, styles.idText]}>{internship.id || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                  {internship.title || internship.internship_title || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.universityText]} numberOfLines={1}>
                  {internship.company_name || internship.company || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={styles.durationBadgeSmall}>
                  <Text style={styles.durationBadgeTextSmall}>
                    {internship.duration ? `${internship.duration}M` : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <View style={[
                  styles.statusBadgeSmall,
                  internship.status === 'active' && styles.statusActive,
                  internship.status === 'inactive' && styles.statusInactive,
                  internship.status === 'completed' && styles.statusCompleted,
                ]}>
                  <Text style={styles.statusBadgeTextSmall}>
                    {internship.status === 'active' ? '✓' : 
                     internship.status === 'inactive' ? '⏸' : 
                     internship.status === 'completed' ? '✅' : '?'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeleteInternship(internship.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderPartnerships = () => {
    if (partnershipsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading partnerships...</Text>
        </View>
      );
    }

    if (!partnerships || partnerships.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No partnerships found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2.2 }]}>University Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Company Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {(partnerships || []).map((partnership, index) => {
          if (!partnership) return null;
          return (
            <View key={partnership.id || `partnership-${index}`} style={[
              styles.tableRow,
              index === partnerships.length - 1 && styles.lastTableRow,
            ]}>
              <View style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellText, styles.idText]}>{partnership.id || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2.2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                  {partnership.university_name || partnership.university || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={1}>
                  {partnership.company_name || partnership.company || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={[
                  styles.statusBadgeSmall,
                  partnership.status === 'approved' && styles.statusApproved,
                  partnership.status === 'pending' && styles.statusPending,
                  partnership.status === 'rejected' && styles.statusRejected,
                ]}>
                  <Text style={styles.statusBadgeTextSmall}>
                    {partnership.status === 'approved' ? '✓' : 
                     partnership.status === 'pending' ? '⏳' : 
                     partnership.status === 'rejected' ? '✗' : '?'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeletePartnership(partnership.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderNotifications = () => {
    if (notificationsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Message</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Type</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Action</Text>
        </View>
        
        {(notifications || []).map((notification, index) => {
          if (!notification) return null;
          return (
            <View key={notification.id || `notification-${index}`} style={[
              styles.tableRow,
              index === notifications.length - 1 && styles.lastTableRow,
            ]}>
              <View style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellText, styles.idText]}>{notification.id || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 }]}>
                <Text style={[styles.tableCellText, styles.nameText]} numberOfLines={2}>
                  {notification.message || notification.title || 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={[
                  styles.notificationTypeBadgeSmall,
                  notification.type === 'info' && styles.notificationInfo,
                  notification.type === 'warning' && styles.notificationWarning,
                  notification.type === 'error' && styles.notificationError,
                  notification.type === 'success' && styles.notificationSuccess,
                ]}>
                  <Text style={styles.notificationTypeBadgeTextSmall}>
                    {notification.type === 'info' ? 'ℹ️' : 
                     notification.type === 'warning' ? '⚠️' : 
                     notification.type === 'error' ? '❌' : 
                     notification.type === 'success' ? '✅' : '📢'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={[
                  styles.statusBadgeSmall,
                  notification.is_read && styles.statusRead,
                  !notification.is_read && styles.statusUnread,
                ]}>
                  <Text style={styles.statusBadgeTextSmall}>
                    {notification.is_read ? '👁️' : '🔔'}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <Text style={[styles.tableCellText, styles.dateText]} numberOfLines={1}>
                  {notification.created_at ? new Date(notification.created_at).toLocaleDateString('en-US', {
                    year: '2-digit',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButtonSmall}
                  onPress={() => handleDeleteNotification(notification.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonTextSmall}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'companies':
        return renderCompanies();
      case 'universities':
        return renderUniversities();
      case 'students':
        return renderStudents();
      case 'trainers':
        return renderTrainers();
      case 'internships':
        return renderInternships();
      case 'partnerships':
        return renderPartnerships();
      case 'notifications':
        return renderNotifications();
      default:
        return renderOverview();
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Admin Dashboard';
      case 'users':
        return 'All Users';
      case 'companies':
        return 'Companies';
      case 'universities':
        return 'Universities';
      case 'students':
        return 'Students';
      case 'trainers':
        return 'Trainers';
      case 'internships':
        return 'Internships';
      case 'partnerships':
        return 'Partnerships';
      case 'notifications':
        return 'Notifications';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
      {/* Drawer Menu Modal */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            <DrawerMenu
              userType="admin"
              userName={adminData.name}
              userEmail={adminData.email}
              activeTab={activeTab}
              onTabChange={(tab: string) => handleTabChange(tab as TabKey)}
              onLogout={handleLogout}
              pendingCount={stats.pendingRequests}
            />
          </View>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            onPress={() => setDrawerVisible(false)}
          />
        </View>
      </Modal>

      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTabTitle()}</Text>
        </View>

        {/* Message */}
        {message.text ? (
          <View style={[styles.messageContainer, message.type === 'error' ? styles.errorMessage : styles.successMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
            <TouchableOpacity onPress={() => setMessage({ text: '', type: '' })}>
              <Text style={styles.closeMessage}>×</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Content */}
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '75%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  drawerBackdrop: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  closeMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  overviewContainer: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
  },
  statCardUsers: {
    borderLeftColor: '#3b82f6',
  },
  statCardCompanies: {
    borderLeftColor: '#10b981',
  },
  statCardUniversities: {
    borderLeftColor: '#8b5cf6',
  },
  statCardStudents: {
    borderLeftColor: '#f59e0b',
  },
  statCardTrainers: {
    borderLeftColor: '#06b6d4',
  },
  statCardInternships: {
    borderLeftColor: '#ec4899',
  },
  statCardActive: {
    borderLeftColor: '#10b981',
  },
  statCardPending: {
    borderLeftColor: '#f59e0b',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statIconUsers: {
    backgroundColor: '#dbeafe',
  },
  statIconCompanies: {
    backgroundColor: '#d1fae5',
  },
  statIconUniversities: {
    backgroundColor: '#e9d5ff',
  },
  statIconStudents: {
    backgroundColor: '#fef3c7',
  },
  statIconTrainers: {
    backgroundColor: '#cffafe',
  },
  statIconInternships: {
    backgroundColor: '#fce7f3',
  },
  statIconActive: {
    backgroundColor: '#d1fae5',
  },
  statIconPending: {
    backgroundColor: '#fef3c7',
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Table styles
  tableContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 2,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 2,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellText: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userTypeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  userTypeStudent: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  userTypeCompany: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  userTypeUniversity: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
  },
  userTypeTrainer: {
    backgroundColor: '#06b6d4',
    shadowColor: '#06b6d4',
  },
  userTypeAdmin: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Enhanced table row styles
  lastTableRow: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
  },
  adminRow: {
    borderLeftColor: '#f59e0b',
    borderLeftWidth: 6,
    backgroundColor: '#fffbeb',
  },
  idBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  nameText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  emailText: {
    color: '#6b7280',
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  protectedBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  protectedText: {
    fontSize: 16,
  },
  // Compact table styles
  idText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  userTypeBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userTypeBadgeTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteButtonSmall: {
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteButtonTextSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  protectedBadgeSmall: {
    backgroundColor: '#f3f4f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedTextSmall: {
    fontSize: 12,
  },
  // Status badge styles
  statusBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statusBadgeTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusApproved: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  statusRejected: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  // Students management styles
  universityText: {
    color: '#6b7280',
    fontSize: 11,
  },
  gpaBadgeSmall: {
    width: 32,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  gpaBadgeTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gpaExcellent: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  gpaGood: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  gpaAverage: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  gpaPoor: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  // Trainers management styles
  experienceBadgeSmall: {
    width: 36,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  experienceBadgeTextSmall: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  experienceExpert: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  experienceSenior: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  experienceJunior: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  experienceNew: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },
  // Internships management styles
  durationBadgeSmall: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  durationBadgeTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },
  statusCompleted: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  // Notifications management styles
  notificationTypeBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  notificationTypeBadgeTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationInfo: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  notificationWarning: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  notificationError: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  notificationSuccess: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  statusRead: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },
  statusUnread: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
});

export default AdminDashboardScreen;
