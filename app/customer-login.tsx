import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { isConfiguredAdminEmail } from '../lib/adminAccess';
import { RESET_PASSWORD_COOLDOWN_SECONDS } from '../lib/authConstants';

export default function CustomerLogin() {
  const router = useRouter();
  const { signIn, resetPassword, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!loading && isConfiguredAdminEmail(normalizedEmail)) {
      router.replace({ pathname: '/admin/login', params: { email: normalizedEmail } });
    }
  }, [email, loading, router]);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isConfiguredAdminEmail(normalizedEmail)) {
      router.replace({ pathname: '/admin/login', params: { email: normalizedEmail } });
      return;
    }

    if (!normalizedEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(normalizedEmail, password);
      router.push('/customer/home');
    } catch (err) {
      Alert.alert('Login Failed', error || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetCooldown > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Reset Password', 'Enter your email first, then tap Forgot Password.');
      return;
    }

    try {
      await resetPassword(normalizedEmail);
      setResetCooldown(RESET_PASSWORD_COOLDOWN_SECONDS);
      router.push({ pathname: '/reset-password-sent', params: { email: normalizedEmail, role: 'customer' } });
    } catch (err) {
      Alert.alert('Reset Failed', error || 'Unable to send reset email right now. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.inner}>
            <Text style={styles.title}>Customer Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity style={styles.showPasswordRow} onPress={() => setShowPassword((value) => !value)}>
              <View style={[styles.checkboxBox, showPassword && styles.checkboxBoxChecked]}>
                {showPassword ? <Text style={styles.checkboxMark}>X</Text> : null}
              </View>
              <Text style={styles.showPasswordText}>Show password</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading || resetCooldown > 0}>
              <Text style={[styles.forgotPasswordText, (loading || resetCooldown > 0) && styles.forgotPasswordTextDisabled]}>
                {resetCooldown > 0 ? `Forgot Password? (${resetCooldown}s)` : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  inner: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  showPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#000000',
  },
  checkboxBoxChecked: {
    borderColor: '#D4AF37',
    backgroundColor: '#1A1A1A',
  },
  checkboxMark: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  showPasswordText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  forgotPasswordTextDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 12,
  },
});
