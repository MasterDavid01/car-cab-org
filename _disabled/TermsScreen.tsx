import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.text}>Your Car Cab Org legal text goes here...</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#ff6600", fontSize: 28, marginBottom: 20 },
  text: { color: "#fff", fontSize: 16, lineHeight: 22 }
});
