import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from "react-native";

export default function DriverPastRetrievals() {
  const router = useRouter();

  // Temporary mock data — will be replaced with Firestore
  const past = [
    {
      id: "101",
      pickup: "123 Main St",
      dropoff: "Home Address",
      status: "completed",
    },
    {
      id: "102",
      pickup: "456 Oak Ave",
      dropoff: "Home Address",
      status: "completed",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Past Retrievals</Text>

      {past.map((r) => (
        <TouchableOpacity
          key={r.id}
          style={styles.card}
          onPress={() => router.push(`../driver/past/${r.id}`)}
        >
          <Text style={styles.cardTitle}>Retrieval #{r.id}</Text>
          <Text style={styles.cardSubtitle}>Pickup: {r.pickup}</Text>
          <Text style={styles.cardSubtitle}>Dropoff: {r.dropoff}</Text>
          <Text style={styles.status}>{r.status.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
    padding: 18,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#aaa",
    marginTop: 4,
  },
  status: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 10,
  },
});





