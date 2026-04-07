import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Donate() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donate</Text>

      <Text style={styles.mission}>
        Car Cab Org is a 100% nonprofit service.  
        Your donation helps keep impaired drivers and their vehicles safe,  
        supports community education, and strengthens our mission.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderWidth: 6,
    borderColor: "#D4AF37",
    borderRadius: 20,
    margin: 10,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.9,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 30
  },
  title: {
    color: "#ffcc33",
    fontSize: 32,
    marginBottom: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  mission: {
    color: "#ffcc33",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 10,
    lineHeight: 22
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    width: 260
  },
  buttonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  }
});
