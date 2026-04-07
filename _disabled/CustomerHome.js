import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CustomerHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Home</Text>
      <Text style={styles.subtitle}>Welcome to Car Cab Org</Text>
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
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 20
  },
  subtitle: {
    color: "#ffcc33",
    fontSize: 20,
    fontWeight: "500",
    marginTop: 10
  }
});
