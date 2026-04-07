import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../lib/apiBase";

function maskPhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return value;
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

export default function CustomerVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = String(params.phone || "");
  const next = String(params.next || "/customer/home");
  const [sending, setSending] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  const handleSendCode = async () => {
    try {
      if (!phone) {
        Alert.alert("Missing Phone", "Phone number was not provided. Please register again.");
        return;
      }

      setSending(true);

      const response = await fetch(buildApiUrl("/") , {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ phone: phone }),
      });

      const data = await response.json();
      if (!response.ok || data?.success !== true) {
        const reason = data?.error || "Unable to send verification code.";
        throw new Error(reason);
      }

      console.log("Verification sent:", data);
      setSentOnce(true);
      Alert.alert("Verification Sent", `6-digit code sent to ${maskPhone(phone)}.`);

      router.push({
        pathname: "/customer/confirm-code",
        params: { phone, next },
      });
    } catch (error) {
      console.error("Error sending verification:", error);
      Alert.alert("Verification Error", String((error as any)?.message || "Unable to send verification code."));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!sentOnce && !sending) {
      handleSendCode();
    }
    // Intentionally only on initial screen mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Account</Text>

      <Text style={styles.subtitle}>
        Press the button below to send a verification code to your phone ({maskPhone(phone)}).
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode} disabled={sending}>
        <Text style={styles.primaryButtonText}>{sending ? "Sending..." : "Resend Verification Code"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  title: {
    color: "#D4AF37",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    color: "#D4AF37",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 40,
    width: "90%",
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "700",
  },
});
