import { View, Text, StyleSheet, Switch } from "react-native";
import { useState } from "react";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Notifications</Text>
          <Text style={styles.sub}>Trip updates and safety alerts</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ true: "#FFD166", false: "#444" }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Share Location</Text>
          <Text style={styles.sub}>Used only during active retrievals</Text>
        </View>
        <Switch
          value={shareLocation}
          onValueChange={setShareLocation}
          trackColor={{ true: "#FFD166", false: "#444" }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#FFD166", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: { color: "#fff", fontSize: 15 },
  sub: { color: "#888", fontSize: 12 },
});
