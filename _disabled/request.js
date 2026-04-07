import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";

export default function RequestPickupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Pickup</Text>

      <Text style={styles.label}>Pickup Location</Text>
      <TextInput style={styles.input} placeholder="Address or landmark" placeholderTextColor="#777" />

      <Text style={styles.label}>Vehicle Description</Text>
      <TextInput style={styles.input} placeholder="Make, model, color" placeholderTextColor="#777" />

      <Text style={styles.label}>Notes for Driver</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Anything we should know to keep you safe"
        placeholderTextColor="#777"
        multiline
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Confirm Request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#FFD166", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { color: "#fff", marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
  },
  multiline: { height: 80, textAlignVertical: "top" },
  button: {
    marginTop: 24,
    backgroundColor: "#FFD166",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
