import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';

export default function Register() {
  const router = useRouter();
  const { signUp, error } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'driver' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail || !normalizedPhone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (normalizedPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!userType) {
      Alert.alert('Error', 'Please select if you are a Customer or Driver');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await signUp(normalizedEmail, password, userType);
      Alert.alert('Success', 'Account created. Please verify your phone.');
      router.push({
        pathname: '/customer/verify',
        params: {
          phone: normalizedPhone,
          next: userType === 'customer' ? '/customer/onboarding-docs' : '/driver/home',
        },
      });
    } catch (err: any) {
      const message = err?.message || error || 'Unable to create account. Please try again.';
      const emailInUse =
        err?.code === 'auth/email-already-in-use' ||
        String(message).toLowerCase().includes('email-already-in-use') ||
        String(message).toLowerCase().includes('already registered') ||
        String(message).toLowerCase().includes('already in use');

      if (emailInUse) {
        Alert.alert(
          'Account Already Exists',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: userType === 'driver' ? 'Go to Driver Login' : 'Go to Customer Login',
              onPress: () => router.push(userType === 'driver' ? '/driver-login' : '/customer-login'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>Register as Customer or Driver</Text>

      {/* User Type Selection */}
      <View style={styles.typeSelectionContainer}>
        <TouchableOpacity
          style={[styles.typeButton, userType === 'customer' && styles.typeButtonActive]}
          onPress={() => setUserType('customer')}
          disabled={loading}
        >
          <Text style={[styles.typeButtonText, userType === 'customer' && styles.typeButtonTextActive]}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, userType === 'driver' && styles.typeButtonActive]}
          onPress={() => setUserType('driver')}
          disabled={loading}
        >
          <Text style={[styles.typeButtonText, userType === 'driver' && styles.typeButtonTextActive]}>
            Driver
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#FFFFFF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone (e.g. +15551234567)"
        placeholderTextColor="#FFFFFF"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#FFFFFF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#FFFFFF"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        editable={!loading}
      />

      <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={loading}>
        <Text style={styles.toggleText}>{showPassword ? 'Hide Password' : 'Show Password'}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} disabled={loading}>
        <Text style={styles.backText}>Back to Menu</Text>
      </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    paddingBottom: 36,
    backgroundColor: '#000000',
  },
  title: {
    color: '#D4AF37',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#000000',
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  toggleText: {
    color: '#D4AF37',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 12,
  },
  backText: {
    color: '#D4AF37',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
