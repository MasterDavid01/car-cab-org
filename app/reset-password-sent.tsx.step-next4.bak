import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { RESET_PASSWORD_COOLDOWN_SECONDS } from '../lib/authConstants';

export default function ResetPasswordSentScreen() {
  const router = useRouter();
  const { resetPassword, error } = useAuth();
  const params = useLocalSearchParams<{ email?: string; role?: string }>();
  const email = String(params.email || '').trim();
  const role = String(params.role || '').trim().toLowerCase();
  const [cooldown, setCooldown] = useState(RESET_PASSWORD_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!email) {
      Alert.alert('Missing Email', 'Go back to login and enter your email again.');
      return;
    }

    if (cooldown > 0) return;

    try {
      await resetPassword(email);
      setCooldown(RESET_PASSWORD_COOLDOWN_SECONDS);
      Alert.alert('Email Sent', 'A new password reset email has been sent.');
    } catch (resetErr: any) {
      Alert.alert('Resend Failed', resetErr?.message || error || 'Unable to resend reset email right now.');
    }
  }

  function goBackToLogin() {
    if (role === 'driver') {
      router.replace('/driver-login');
      return;
    }
    if (role === 'admin') {
      router.replace('/admin/login');
      return;
    }
    router.replace('/customer-login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Email Sent</Text>
        <Text style={styles.body}>
          If an account exists for {email || 'that email'}, password reset instructions were sent.
        </Text>
        <Text style={styles.hint}>Please check your inbox and spam folder.</Text>

        <TouchableOpacity
          style={[styles.secondaryButton, cooldown > 0 && styles.secondaryButtonDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0}
        >
          <Text style={styles.secondaryButtonText}>
            {cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goBackToLogin}>
          <Text style={styles.buttonText}>Back To Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 12,
    backgroundColor: '#111111',
    padding: 20,
  },
  title: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  hint: {
    color: '#AAAAAA',
    fontSize: 13,
    marginBottom: 20,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
});
