/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import StudentDashboardScreen from './src/screens/StudentDashboardScreen';
import CompanyDashboardScreen from './src/screens/CompanyDashboardScreen';
import UniversityDashboardScreen from './src/screens/UniversityDashboardScreen';
import TrainerDashboardScreen from './src/screens/TrainerDashboardScreen';

type Screen = 'splash' | 'login' | 'signup' | 'studentDashboard' | 'companyDashboard' | 'universityDashboard' | 'trainerDashboard';

function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [userData, setUserData] = useState<any>(null);

  console.log('📱 App.tsx: Current screen:', screen);
  console.log('📱 App.tsx: Current userData:', userData);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {screen === 'splash' && (
          <SplashScreen onFinish={() => setScreen('login')} />
        )}
        {screen === 'login' && (
          <LoginScreen
            onGoToSignUp={() => setScreen('signup')}
            onStudentLogin={(user) => {
              setUserData(user);
              setScreen('studentDashboard');
            }}
            onCompanyLogin={(user) => {
              console.log('🏢 App.tsx: onCompanyLogin called with user:', user);
              setUserData(user);
              console.log('🏢 App.tsx: Setting screen to companyDashboard');
              setScreen('companyDashboard');
            }}
            onUniversityLogin={(user) => {
              console.log('🎓 App.tsx: onUniversityLogin called with user:', user);
              setUserData(user);
              console.log('🎓 App.tsx: Setting screen to universityDashboard');
              setScreen('universityDashboard');
            }}
            onTrainerLogin={(user) => {
              setUserData(user);
              setScreen('trainerDashboard');
            }}
          />
        )}
        {screen === 'signup' && (
          <SignUpScreen onGoToLogin={() => setScreen('login')} />
        )}
        {screen === 'studentDashboard' && (
          <StudentDashboardScreen 
            userData={userData}
            onLogout={() => {
              setUserData(null);
              setScreen('login');
            }} 
          />
        )}
        {screen === 'companyDashboard' && (
          <CompanyDashboardScreen 
            userData={userData}
            onLogout={() => {
              setUserData(null);
              setScreen('login');
            }} 
          />
        )}
        {screen === 'universityDashboard' && (
          <UniversityDashboardScreen 
            userData={userData}
            onLogout={() => {
              setUserData(null);
              setScreen('login');
            }} 
          />
        )}
        {screen === 'trainerDashboard' && (
          <TrainerDashboardScreen 
            userData={userData}
            onLogout={() => {
              setUserData(null);
              setScreen('login');
            }} 
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
});

export default App;
