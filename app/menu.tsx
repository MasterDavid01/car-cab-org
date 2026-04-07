import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const router = useRouter();
  const showDevTools = __DEV__;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/donate')}>
        <Text style={styles.buttonText}>Donate</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/community-service')}>
        <Text style={styles.buttonText}>Community Service Registration</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/community-service-shift')}>
        <Text style={styles.buttonText}>Community Service Shift</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/court-portal')}>
        <Text style={styles.buttonText}>Court Portal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/admin/login')}>
        <Text style={styles.buttonText}>Admin</Text>
      </TouchableOpacity>

      {showDevTools && (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle}>Developer Quick Access</Text>

          <TouchableOpacity
            style={styles.devButton}
            onPress={() => router.push({ pathname: '/customer/home', params: { devBypass: '1' } })}
          >
            <Text style={styles.devButtonText}>Open Customer Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.devButton}
            onPress={() => router.push({ pathname: '/driver/home', params: { devBypass: '1' } })}
          >
            <Text style={styles.devButtonText}>Open Driver Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.devButton}
            onPress={() => router.push({ pathname: '/customer/verify', params: { devBypass: '1' } })}
          >
            <Text style={styles.devButtonText}>Open Verify Screen</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 110,
    gap: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },

  // All three buttons same width, same height
  button: {
    backgroundColor: '#D4AF37',
    width: 260,          // FIXED WIDTH FOR ALL BUTTONS
    height: 60,          // FIXED HEIGHT FOR ALL BUTTONS
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  devPanel: {
    marginTop: 20,
    width: 300,
    borderWidth: 1,
    borderColor: '#2f2f2f',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#0f0f0f',
    gap: 10,
  },
  devTitle: {
    color: '#D4AF37',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 2,
  },
  devButton: {
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  devButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
