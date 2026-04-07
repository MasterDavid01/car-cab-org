import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ConfirmPickup() {
  const params = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Pickup</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/customer/book")}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#fff", fontSize: 30, fontWeight: "700", marginBottom: 30 },
  button: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});

