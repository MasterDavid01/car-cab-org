import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function DriverOnboardingIntro() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Onboarding</Text>
      <Text style={styles.subtitle}>
        Welcome to Car Cab Org. We focus on safe, nonprofit vehicle retrieval.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/driver/onboarding-vehicle")}
      >
        <Text style={styles.primaryButtonText}>Start Onboarding</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
