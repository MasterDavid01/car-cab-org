import { View, Text, StyleSheet } from "react-native";

const items = [
  "Driver identity verified before dispatch",
  "Vehicle and route logged for every trip",
  "Emergency escalation path on every request",
  "Zero-tolerance policy for unsafe behavior",
];

export default function DriverSafetyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Safety Protocol</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#FFD166", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 8 },
  bullet: { color: "#FFD166", marginRight: 8, fontSize: 18 },
  text: { color: "#fff", flex: 1 },
});
