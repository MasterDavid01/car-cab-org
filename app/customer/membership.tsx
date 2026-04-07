import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function MembershipScreen() {
  const handleActivate = () => {
    router.push("/membership/upgrade");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membership</Text>
      <Text style={styles.subtitle}>
        Join Car Cab Org for $24.99 per month with a 12-month commitment beginning after your first payment.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleActivate}>
        <Text style={styles.primaryButtonText}>Review Membership Plan</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#FFD700",
    fontSize: 15,
    marginBottom: 32,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFD700",
    fontSize: 14,
    textAlign: "center",
  },
});
