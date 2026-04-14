import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../lib/AuthContext";
import { auth } from "../../firebaseConfig";
import { isAuthorizedAdmin, isConfiguredAdminEmail } from "../../lib/adminAccess";
import { RESET_PASSWORD_COOLDOWN_SECONDS } from '../../lib/authConstants';

export default function AdminLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { user, signIn, resetPassword, signOut, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  useEffect(() => {
    if (isAuthorizedAdmin(user)) {
      router.replace("/admin/dashboard");
    }
  }, [router, user]);

  useEffect(() => {
    const prefilled = String(params.email || "")
      .trim()
      .toLowerCase();
    if (prefilled) {
      setEmail(prefilled);
    }
  }, [params.email]);

  useEffect(() => {
    if (user && !isAuthorizedAdmin(user)) {
      signOut().catch(() => undefined);
    }
  }, [user, signOut]);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert("Missing Fields", "Enter your admin email and password.");
      return;
    }

    if (!isConfiguredAdminEmail(normalizedEmail)) {
      Alert.alert("Access Denied", "This account is not authorized for admin control.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(normalizedEmail, password);
      const nextUser = auth.currentUser;

      if (!isAuthorizedAdmin(nextUser)) {
        await signOut();
        Alert.alert("Access Denied", "This account is not authorized for admin control.");
        return;
      }

      router.replace("/admin/dashboard");
    } catch (loginError: any) {
      Alert.alert("Admin Login Failed", loginError?.message || error || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (resetCooldown > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert("Reset Password", "Enter your admin email first, then tap Forgot Password.");
      return;
    }

    try {
      await resetPassword(normalizedEmail);
      setResetCooldown(RESET_PASSWORD_COOLDOWN_SECONDS);
      router.push({ pathname: '/reset-password-sent', params: { email: normalizedEmail, role: 'admin' } });
    } catch (resetError: any) {
      Alert.alert("Reset Failed", resetError?.message || error || "Unable to send reset email right now.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>Only the configured admin account can enter the control board.</Text>

            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
            />

            <TouchableOpacity style={styles.showPasswordRow} onPress={() => setShowPassword((value) => !value)}>
              <View style={[styles.checkboxBox, showPassword && styles.checkboxBoxChecked]}>
                {showPassword ? <Text style={styles.checkboxMark}>X</Text> : null}
              </View>
              <Text style={styles.showPasswordText}>Show password</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={submitting || resetCooldown > 0}>
              <Text style={[styles.forgotPasswordText, (submitting || resetCooldown > 0) && styles.forgotPasswordTextDisabled]}>
                {resetCooldown > 0 ? `Forgot Password? (${resetCooldown}s)` : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
              <Text style={styles.buttonText}>{submitting ? "Signing In..." : "Admin Login"}</Text>
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
    backgroundColor: "#000000",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#111111",
  },
  title: {
    color: "#D4AF37",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#FFF",
    backgroundColor: "#000",
    marginBottom: 10,
  },
  showPasswordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#000",
  },
  checkboxBoxChecked: {
    borderColor: "#D4AF37",
    backgroundColor: "#1A1A1A",
  },
  checkboxMark: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  showPasswordText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  forgotPasswordText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "right",
  },
  forgotPasswordTextDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: "#D4AF37",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
