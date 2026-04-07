import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function DriverConsole() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Console</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/driver/new-jobs")}
      >
        <Text style={styles.buttonText}>New Jobs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/driver/active")}
      >
        <Text style={styles.buttonText}>Active Retrievals</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/driver/past")}
      >
        <Text style={styles.buttonText}>Past Retrievals</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 18,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
