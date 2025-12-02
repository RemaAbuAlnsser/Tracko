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

type Screen = 'splash' | 'login' | 'signup' | 'studentDashboard' | 'companyDashboard';

function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [userData, setUserData] = useState<any>(null);

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
              setUserData(user);
              setScreen('companyDashboard');
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
