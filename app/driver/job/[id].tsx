import React from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

export default function DriverJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Job Detail</Text>
      <Text style={styles.sub}>Job ID: {String(id || "unknown")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { color: "#D4AF37", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  sub: { color: "#fff", fontSize: 14 }
});