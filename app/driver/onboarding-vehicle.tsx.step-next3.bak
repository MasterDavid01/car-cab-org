import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";

export default function DriverOnboardingVehicle() {
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const hasAllVehicleFields = Boolean(
    vehicleMake.trim() && vehicleModel.trim() && vehicleColor.trim() && licensePlate.trim()
  );

  const handleNext = () => {
    if (!hasAllVehicleFields) {
      return;
    }

    router.push({
      pathname: "/driver/onboarding-docs",
      params: {
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleColor: vehicleColor.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vehicle Details</Text>
      <Text style={styles.subtitle}>
        We use this to help customers safely identify you on retrieval.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Vehicle Make"
        placeholderTextColor="#CCCCCC"
        value={vehicleMake}
        onChangeText={setVehicleMake}
      />
      <TextInput
        style={styles.input}
        placeholder="Vehicle Model"
        placeholderTextColor="#CCCCCC"
        value={vehicleModel}
        onChangeText={setVehicleModel}
      />
      <TextInput
        style={styles.input}
        placeholder="Vehicle Color"
        placeholderTextColor="#CCCCCC"
        value={vehicleColor}
        onChangeText={setVehicleColor}
      />
      <TextInput
        style={styles.input}
        placeholder="License Plate"
        placeholderTextColor="#CCCCCC"
        value={licensePlate}
        onChangeText={setLicensePlate}
      />

      <TouchableOpacity
        style={[styles.primaryButton, !hasAllVehicleFields && styles.primaryButtonDisabled]}
        onPress={handleNext}
        disabled={!hasAllVehicleFields}
      >
        <Text style={styles.primaryButtonText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#333333",
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
