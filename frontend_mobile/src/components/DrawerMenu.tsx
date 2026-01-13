import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';

interface DrawerMenuProps {
  userType: 'student' | 'company' | 'university' | 'trainer' | 'admin';
  userData?: any;
  activeMenu?: string;
  activeTab?: string;
  onMenuSelect?: (menu: string) => void;
  onTabChange?: (tab: string) => void;
  onLogout: () => void;
  unreadCount?: number;
  pendingCount?: number;
  notificationCount?: number;
  userName?: string;
  userEmail?: string;
  visible?: boolean;
  onClose?: () => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  userType,
  userData,
  activeMenu,
  activeTab,
  onMenuSelect,
  onTabChange,
  onLogout,
  unreadCount = 0,
  pendingCount = 0,
  notificationCount = 0,
  userName,
  userEmail,
  visible,
  onClose,
}) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMenuItems = () => {
    switch (userType) {
      case 'university':
        return [
          { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { key: 'profile', label: 'Profile & Edit', icon: 'user' },
          { key: 'partnerships', label: 'Company Partnerships', icon: 'users' },
          { key: 'students', label: 'Students Management', icon: 'graduation' },
          { key: 'internships', label: 'Internship Opportunities', icon: 'briefcase' },
          { key: 'reports', label: 'Reports & Analytics', icon: 'chart' },
          { key: 'notifications', label: 'Notifications', icon: 'bell', badge: notificationCount },
          { key: 'messages', label: 'Messages/Chat', icon: 'message', badge: unreadCount },
          { key: 'requests', label: 'Registration Requests', icon: 'clipboard', badge: pendingCount },
        ];
      case 'company':
        return [
          { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { key: 'profile', label: 'Profile & Edit', icon: 'user' },
          { key: 'post', label: 'Post Internship', icon: 'plus' },
          { key: 'manage', label: 'Manage Internships', icon: 'list' },
          { key: 'applicants', label: 'View Applicants', icon: 'users' },
          { key: 'details', label: 'Applicant Details', icon: 'file' },
          { key: 'messages', label: 'Messages/Chat', icon: 'message', badge: unreadCount },
          { key: 'interviews', label: 'Interviews', icon: 'calendar' },
        ];
      case 'student':
        return [
          { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { key: 'profile', label: 'Profile & Edit', icon: 'user' },
          { key: 'cv-upload', label: 'CV Upload & Analysis', icon: 'file' },
          { key: 'internships', label: 'AI-Matched Internships', icon: 'briefcase' },
          { key: 'saved', label: 'Saved Internships', icon: 'bookmark' },
          { key: 'notifications', label: 'Notifications', icon: 'bell', badge: notificationCount },
          { key: 'messages', label: 'Messages', icon: 'message', badge: unreadCount },
          { key: 'plans', label: 'Training Plans', icon: 'calendar' },
        ];
      case 'trainer':
        return [
          { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { key: 'profile', label: 'Profile & Edit', icon: 'user' },
          { key: 'internships', label: 'My Internships', icon: 'briefcase' },
          { key: 'students', label: 'My Students', icon: 'users' },
          { key: 'reports', label: 'Student Reports', icon: 'file' },
          { key: 'schedule', label: 'Schedule & Events', icon: 'calendar' },
          { key: 'notifications', label: 'Notifications', icon: 'bell', badge: notificationCount },
          { key: 'messages', label: 'Messages', icon: 'message', badge: unreadCount },
          { key: 'plans', label: 'Training Plans', icon: 'clipboard' },
        ];
      case 'admin':
        return [
          { key: 'overview', label: 'Overview', icon: 'grid' },
          { key: 'users', label: 'All Users', icon: 'users' },
          { key: 'companies', label: 'Companies', icon: 'briefcase' },
          { key: 'universities', label: 'Universities', icon: 'graduation' },
          { key: 'students', label: 'Students', icon: 'user' },
          { key: 'trainers', label: 'Trainers', icon: 'users' },
          { key: 'internships', label: 'Internships', icon: 'briefcase' },
          { key: 'partnerships', label: 'Partnerships', icon: 'users' },
          { key: 'notifications', label: 'Notifications', icon: 'bell', badge: pendingCount },
        ];
      default:
        return [];
    }
  };

  // No icons needed

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'university':
        return 'University';
      case 'company':
        return 'Company';
      case 'student':
        return 'Student';
      case 'trainer':
        return 'Trainer';
      case 'admin':
        return 'Administrator';
      default:
        return '';
    }
  };

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

  // Get user image based on user type
  const getUserImage = () => {
    if (!userData) return null;
    
    switch (userType) {
      case 'company':
      case 'university':
        return userData.logo;
      case 'student':
        return userData.profile_picture || userData.student_img;
      case 'trainer':
        return userData.profile_image;
      case 'admin':
        return userData.profile_picture;
      default:
        return null;
    }
  };

  const userImage = getUserImage();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {userImage ? (
              <Image
                source={{ uri: `${baseUrl}${userImage}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(userData?.full_name || userData?.name || '')}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={2}>
              {userName || userData?.name || userData?.full_name || 'User'}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getUserTypeLabel()}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Menu */}
        <View style={styles.nav}>
          {getMenuItems().map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, (activeMenu === item.key || activeTab === item.key) && styles.navItemActive]}
              onPress={() => {
                if (onMenuSelect) {
                  onMenuSelect(item.key);
                } else if (onTabChange) {
                  onTabChange(item.key);
                }
              }}
            >
              <View style={styles.navItemContent}>
                <Text style={[styles.navText, activeMenu === item.key && styles.navTextActive]}>
                  {item.label}
                </Text>
              </View>
              {item.badge && item.badge > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{String(item.badge)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Logout Section */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  nav: {
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#dbeafe',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    flex: 1,
  },
  navTextActive: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  navBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  navBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
});

export default DrawerMenu;
