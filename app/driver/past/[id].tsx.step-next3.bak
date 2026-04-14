import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function DriverPastRetrievalDetail() {
  const { id } = useLocalSearchParams();

  // Temporary mock data — will be replaced with Firestore
  const retrieval = {
    id,
    pickup: "123 Main St",
    dropoff: "Customer Home Address",
    status: "completed",
    completedAt: "Jan 10, 2026 • 11:42 PM",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retrieval #{retrieval.id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{retrieval.pickup}</Text>

        <Text style={styles.label}>Dropoff (Home)</Text>
        <Text style={styles.value}>{retrieval.dropoff}</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.status}>{retrieval.status.toUpperCase()}</Text>

        <Text style={styles.label}>Completed At</Text>
        <Text style={styles.value}>{retrieval.completedAt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 15,
  },
  value: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 4,
  },
  status: {
    color: "#D4AF37",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
});




