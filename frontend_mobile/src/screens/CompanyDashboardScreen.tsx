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
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

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

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

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

          // Load dashboard stats and trainer requests
          loadDashboardStats(data.company.id);
          loadTrainerRequests(data.company.id);
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
      const response = await fetch(`${baseUrl}/api/companies/${companyId}/trainers`);
      if (response.ok) {
        const trainers = await response.json();
        setCompanyTrainers(trainers);
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
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
    if (!companyData.id) return;

    // Validation
    if (!internshipData.title || !internshipData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/internships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...internshipData,
          company_id: companyData.id,
          trainer_ids: selectedTrainers,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Internship posted successfully!');
        setMessage({ text: 'Internship posted successfully!', type: 'success' });
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
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        Alert.alert('Error', 'Failed to post internship');
        setMessage({ text: 'Failed to post internship', type: 'error' });
      }
    } catch (error) {
      console.error('Error posting internship:', error);
      Alert.alert('Error', 'Failed to post internship');
      setMessage({ text: 'Error posting internship', type: 'error' });
    } finally {
      setLoading(false);
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
      <Text style={styles.sectionTitle}>Post New Internship</Text>
      <Text style={styles.sectionSubtitle}>Create a new internship opportunity for students</Text>

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
          <TextInput
            style={styles.formInput}
            value={internshipData.specialization}
            onChangeText={(text) => handleInternshipInputChange('specialization', text)}
            placeholder="e.g., Software Engineering"
          />
          <Text style={styles.helpText}>Select from: Software Engineering, Data Science, Web Development, Mobile Development, UI/UX Design, DevOps, Cybersecurity, AI/ML, Cloud Computing</Text>
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
            <TextInput
              style={styles.formInput}
              value={internshipData.status}
              onChangeText={(text) => handleInternshipInputChange('status', text)}
              placeholder="open"
            />
            <Text style={styles.helpText}>open, pending, or closed</Text>
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
            <TextInput
              style={styles.formInput}
              value={internshipData.work_mode}
              onChangeText={(text) => handleInternshipInputChange('work_mode', text)}
              placeholder="onsite/online/hybrid"
            />
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
            {loading ? 'Posting...' : 'Post Internship'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // Render Manage Internships Tab
  const renderManage = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Manage Internships</Text>
      <Text style={styles.placeholderText}>Internship management will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  // Render Applicants Tab
  const renderApplicants = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Applicants List</Text>
      <Text style={styles.placeholderText}>Applicants list will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  // Render Accepted Students Tab
  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Accepted Students</Text>
      <Text style={styles.placeholderText}>Accepted students list will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  // Render Messages Tab
  const renderMessages = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Messages/Chat</Text>
      <Text style={styles.placeholderText}>Messaging feature will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  // Render Interviews Tab
  const renderInterviews = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Interviews</Text>
      <Text style={styles.placeholderText}>Interview scheduling will be available soon.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

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
      {/* Header with Company Info */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.companyAvatar}>
            <Text style={styles.avatarText}>{getInitials(companyData.name || userData?.full_name || 'CO')}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.companyName}>{companyData.name || userData?.full_name || 'Company'}</Text>
            <View style={styles.companyBadge}>
              <Text style={styles.badgeText}>Company</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => handleTabChange('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => handleTabChange('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile & Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
          onPress={() => handleTabChange('post')}
        >
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>
            Post New Internship
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
          onPress={() => handleTabChange('manage')}
        >
          <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
            Manage Internships
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'applicants' && styles.activeTab]}
          onPress={() => handleTabChange('applicants')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'applicants' && styles.activeTabText]}>
              Applicants List
            </Text>
            {newApplicantsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{newApplicantsCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => handleTabChange('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Accepted Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => handleTabChange('messages')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
              Messages/Chat
            </Text>
            {totalUnreadMessages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{totalUnreadMessages}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'interviews' && styles.activeTab]}
          onPress={() => handleTabChange('interviews')}
        >
          <Text style={[styles.tabText, activeTab === 'interviews' && styles.activeTabText]}>
            Interviews
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'meetings' && styles.activeTab]}
          onPress={() => handleTabChange('meetings')}
        >
          <Text style={[styles.tabText, activeTab === 'meetings' && styles.activeTabText]}>
            Meetings
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  companyName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 56,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 120,
  },
  activeTab: {
    borderBottomColor: '#1e3a8a',
    backgroundColor: '#f0f4ff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1e3a8a',
    fontWeight: '700',
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
  contentContainer: {
    flex: 1,
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
});

export default CompanyDashboardScreen;
