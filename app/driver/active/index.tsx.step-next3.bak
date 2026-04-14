import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DriverActiveRetrieval() {
  const router = useRouter();

  // Temporary mock data — will be replaced with Firestore
  const retrieval = {
    id: "123",
    pickup: "123 Main St",
    dropoff: "Customer Home Address",
    status: "en_route",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Retrieval</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{retrieval.pickup}</Text>

        <Text style={styles.label}>Dropoff (Home)</Text>
        <Text style={styles.value}>{retrieval.dropoff}</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.status}>{retrieval.status.toUpperCase()}</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Mark Arrived</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Retrieval</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../driver/past")}
      >
        <Text style={styles.buttonText}>Complete Retrieval</Text>
      </TouchableOpacity>
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
    marginBottom: 30,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 10,
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
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});





