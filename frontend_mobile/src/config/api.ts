import { Platform } from 'react-native';

// API Configuration
const API_CONFIG = {
  // للتطوير المحلي (Development)
  development: {
    ios: 'http://localhost:5050',
    android: 'http://10.0.2.2:5050',
  },
  // للإنتاج (Production) - استبدل بعنوان السيرفر الحقيقي
  production: {
    ios: 'https://your-production-server.com',
    android: 'https://your-production-server.com',
  },
};

// اختيار البيئة (development أو production)
const ENV = 'development'; // غيّر إلى 'production' عند النشر

// تحديد الـ Base URL بناءً على النظام والبيئة
export const BASE_URL = API_CONFIG[ENV][Platform.OS as 'ios' | 'android'] || API_CONFIG[ENV].ios;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  
  // Students
  STUDENT_BY_ID: (id: number) => `/api/students/${id}`,
  STUDENT_PROFILE: (id: number) => `/api/students/${id}/profile`,
  STUDENT_STATISTICS: (id: number) => `/api/students/${id}/statistics`,
  STUDENT_APPLICATIONS: (id: number) => `/api/students/${id}/applications`,
  STUDENT_TRAINERS: (id: number) => `/api/students/${id}/trainers`,
  
  // AI Matching
  RUN_AI_MATCHING: (userId: number) => `/api/matching/student/${userId}/run`,
  GET_MATCHES: (userId: number) => `/api/matching/student/${userId}`,
  SAVED_INTERNSHIPS: (userId: number) => `/api/matching/student/${userId}/saved`,
  
  // Notifications
  USER_NOTIFICATIONS: (userId: number) => `/api/notifications/user/${userId}`,
  MARK_NOTIFICATION_READ: (notificationId: number) => `/api/notifications/${notificationId}/read`,
  
  // CV
  STUDENT_CV: (studentId: number) => `/api/cvs/student-id/${studentId}`,
  
  // Reports & Plans
  WEEKLY_REPORTS: (studentId: number) => `/api/weekly-reports/student/${studentId}`,
  TRAINING_PLANS: (studentId: number) => `/api/plans/student/${studentId}`,
};

export default {
  BASE_URL,
  API_ENDPOINTS,
};
