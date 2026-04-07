import { View, Text, StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>Your Name</Text>

        <Text style={styles.label}>Vehicle</Text>
        <Text style={styles.value}>Year • Make • Model</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>Active • Safety-first</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#FFD166", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  card: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: { color: "#888", marginTop: 8, fontSize: 12 },
  value: { color: "#fff", fontSize: 16 },
});
