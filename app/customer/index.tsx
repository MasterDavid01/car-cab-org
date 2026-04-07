import { View, Text, StyleSheet } from "react-native";

export default function CustomerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Dashboard</Text>
      <Text style={styles.subtitle}>Request retrievals and track progress.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", paddingHorizontal: 30 },
  title: { color: "#D4AF37", fontSize: 28, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  subtitle: { color: "#ccc", fontSize: 16, textAlign: "center" },
});
