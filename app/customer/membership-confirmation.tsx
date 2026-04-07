import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function MembershipConfirmationScreen() {
  const params = useLocalSearchParams();
  const status = String(params.status || "pending");
  const isActive = status === "active";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isActive ? "Active Member" : "Membership Confirmation"}</Text>
      <Text style={styles.subtitle}>
        {isActive
          ? "Thank you for supporting Car Cab Org and its mission."
          : "Your membership will show as Active Member only after registration and successful membership payment."}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/customer/home")}>
        <Text style={styles.primaryButtonText}>{isActive ? "Back to Home" : "Return Home"}</Text>
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
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#FFD700",
    fontSize: 15,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
