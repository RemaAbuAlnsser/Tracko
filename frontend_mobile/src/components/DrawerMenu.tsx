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
  userType: 'student' | 'company' | 'university' | 'trainer';
  userData: any;
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
  onLogout: () => void;
  unreadCount?: number;
  pendingCount?: number;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  userType,
  userData,
  activeMenu,
  onMenuSelect,
  onLogout,
  unreadCount = 0,
  pendingCount = 0,
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
          { key: 'reports', label: 'Reports & Analytics', icon: 'chart', badge: pendingCount },
          { key: 'notifications', label: 'Notifications', icon: 'bell' },
          { key: 'messages', label: 'Messages/Chat', icon: 'message', badge: unreadCount },
          { key: 'requests', label: 'Registration Requests', icon: 'clipboard' },
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
          { key: 'meetings', label: 'Meetings', icon: 'video' },
        ];
      case 'student':
        return [
          { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { key: 'profile', label: 'Profile & Edit', icon: 'user' },
          { key: 'cv-upload', label: 'CV Upload & Analysis', icon: 'file' },
          { key: 'internships', label: 'AI-Matched Internships', icon: 'briefcase' },
          { key: 'saved', label: 'Saved Internships', icon: 'bookmark' },
          { key: 'status', label: 'Applications Status', icon: 'list' },
          { key: 'notifications', label: 'Notifications', icon: 'bell', badge: unreadCount },
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
          { key: 'notifications', label: 'Notifications', icon: 'bell' },
          { key: 'messages', label: 'Messages', icon: 'message', badge: unreadCount },
          { key: 'videocall', label: 'Video Calls', icon: 'video' },
          { key: 'plans', label: 'Training Plans', icon: 'clipboard' },
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
      default:
        return '';
    }
  };

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {userData?.logo ? (
              <Image
                source={{ uri: `${baseUrl}${userData.logo}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(userData?.full_name || userData?.name || '')}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={2}>
              {userData?.name || userData?.full_name || 'User'}
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
              style={[styles.navItem, activeMenu === item.key && styles.navItemActive]}
              onPress={() => onMenuSelect(item.key)}
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
