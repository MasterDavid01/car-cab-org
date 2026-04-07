import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TermsScreen from '../screens/TermsScreen';
import ClientRegister from '../screens/ClientRegister';
import DocumentUpload from '../screens/DocumentUpload';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='Home' component={HomeScreen} />
        <Stack.Screen name='Login' component={LoginScreen} />
        <Stack.Screen name='Register' component={RegisterScreen} />
        <Stack.Screen name='Terms' component={TermsScreen} />
        <Stack.Screen name='ClientRegister' component={ClientRegister} />
        <Stack.Screen name='DocumentUpload' component={DocumentUpload} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
