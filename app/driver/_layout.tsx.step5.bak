import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, usePathname } from 'expo-router';

import { useAuth } from '../../lib/AuthContext';
import { isAuthorizedAdmin } from '../../lib/adminAccess';

export default function DriverLayout() {
  const { user, loading, profileLoading, driverProfile } = useAuth();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ devBypass?: string }>();
  const allowDevBypass = __DEV__ && String(params.devBypass || '') === '1';
  const onboardingAllowed = new Set([
    '/driver/onboarding-intro',
    '/driver/onboarding-vehicle',
    '/driver/onboarding-docs',
  ]);
  const isOnboardingPath = onboardingAllowed.has(pathname);
  const approvalStatus = String(
    driverProfile?.eligibility?.status || driverProfile?.backgroundCheck?.status || driverProfile?.onboarding?.status || ''
  ).toLowerCase();
  const isDriverApproved =
    driverProfile?.eligibility?.driverApproved === true ||
    approvalStatus === 'approved' ||
    approvalStatus === 'cleared';

  if (loading || profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#D4AF37" />
        <Text style={styles.loadingText}>Checking driver access...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/driver-login" />;
  }

  if (isAuthorizedAdmin(user) && !allowDevBypass) {
    return <Redirect href="/admin/dashboard" />;
  }

  if (!allowDevBypass && !driverProfile && !isOnboardingPath) {
    return <Redirect href="/driver/onboarding-intro" />;
  }

  if (!allowDevBypass && driverProfile && !isDriverApproved && !isOnboardingPath && pathname !== '/driver/home') {
    return <Redirect href="/driver/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#D4AF37',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name='home'
        options={{
          title: 'Driver Dashboard',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='assigned'
        options={{
          title: 'Assigned Jobs',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='new-jobs'
        options={{
          title: 'New Jobs',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='past'
        options={{
          title: 'Past Jobs',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='onboarding-intro'
        options={{
          title: 'Onboarding',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name='onboarding-vehicle'
        options={{
          title: 'Vehicle Information',
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
        name='DriverFaceID'
        options={{
          title: 'Face ID Verification',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#D4AF37',
    fontSize: 14,
  },
});
