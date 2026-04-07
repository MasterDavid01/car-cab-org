import { db } from '../firebaseConfig';
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookPickups() {
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [vehicle, setVehicle] = useState("");

  // -----------------------------
  // Create Retrieval in Firestore
  // -----------------------------
  const createRetrieval = async () => {
    try {
      await addDoc(collection(db, "retrieval"), {
        pickup,
        vehicle,
        status: "unassigned",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Your retrieval has been requested.");
      router.push("/tabs/mypickups");
    } catch (err) {
      Alert.alert("Error", "Failed to create retrieval.");
    }
  };

  // -----------------------------
  // Biometric Verification
  // -----------------------------
  const confirmWithBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      // If no biometrics available, proceed normally
      if (!hasHardware || !enrolled) {
        await createRetrieval();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm your identity",
        fallbackLabel: "Use device passcode",
      });

      if (!result.success) {
        Alert.alert("Authentication Failed", "Unable to verify your identity.");
        return;
      }

      await createRetrieval();
    } catch {
      // On error, allow retrieval (you can flip this if you want fail‑closed)
      await createRetrieval();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Pickup</Text>

      <Text style={styles.label}>Pickup Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter pickup address"
        placeholderTextColor="#777"
        value={pickup}
        onChangeText={setPickup}
      />

      <Text style={styles.label}>Vehicle Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Make, model, color"
        placeholderTextColor="#777"
        value={vehicle}
        onChangeText={setVehicle}
      />

      <TouchableOpacity style={styles.button} onPress={confirmWithBiometrics}>
        <Text style={styles.buttonText}>Confirm Pickup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  title: {
    color: "#D4AF37",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});






