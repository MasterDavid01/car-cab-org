import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, usePathname } from 'expo-router';

import { useAuth } from '../../lib/AuthContext';
import { isAuthorizedAdmin } from '../../lib/adminAccess';

export default function CustomerLayout() {
  const { user, loading, profileLoading, customerProfile } = useAuth();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ devBypass?: string }>();
  const allowDevBypass = __DEV__ && String(params.devBypass || '') === '1';
  const onboardingAllowed = new Set([
    '/customer/onboarding-docs',
    '/customer/verify',
    '/customer/confirm-code',
    '/customer/membership',
    '/customer/membership-confirmation',
  ]);

  if (loading || profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#D4AF37" />
        <Text style={styles.loadingText}>Checking customer access...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/customer-login" />;
  }

  if (isAuthorizedAdmin(user) && !allowDevBypass) {
    return <Redirect href="/admin/dashboard" />;
  }

  if (!allowDevBypass && !customerProfile && !onboardingAllowed.has(pathname)) {
    return <Redirect href="/customer/onboarding-docs" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'black' },
        headerTintColor: '#D4AF37',
        headerTitleStyle: { color: '#D4AF37', fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name='home'
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='request'
        options={{
          title: 'Request Vehicle Retrieval',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='membership'
        options={{
          title: 'Membership',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='face-verify'
        options={{
          title: 'Face Verification',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='onboarding-docs'
        options={{
          title: 'Upload Documents',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='membership-confirmation'
        options={{
          title: 'Membership Confirmation',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='verify'
        options={{
          title: 'Back',
          headerShown: true,
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: '#D4AF37',
          headerTitleStyle: { color: '#D4AF37', fontWeight: 'bold' }
        }}
      />
      <Stack.Screen
        name='confirm-code'
        options={{
          title: 'Confirm Code',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='status'
        options={{
          title: 'Retrieval Status',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='dui-class'
        options={{
          title: 'DUI Class Attendance',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#D4AF37',
    fontSize: 14,
  },
});
