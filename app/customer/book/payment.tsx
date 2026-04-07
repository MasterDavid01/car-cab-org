import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Payment() {
  const params = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/customer/book/confirm")}
      >
        <Text style={styles.buttonText}>Confirm</Text>
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

