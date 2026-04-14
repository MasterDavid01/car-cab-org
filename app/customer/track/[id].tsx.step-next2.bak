import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { db } from "../../../firebaseConfig";

type Retrieval = {
  pickup: string;
  dropoff: string;
  status?: string;
};

export default function TrackDriver() {
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : undefined;

  const [retrieval, setRetrieval] = useState<Retrieval | null>(null);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "retrievals", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setRetrieval(snap.data() as Retrieval);
      }
    });

    return () => unsub();
  }, [id]);

  if (!retrieval) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracking Driver</Text>
      <Text style={styles.subtitle}>Retrieval #{id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{retrieval.pickup}</Text>

        <Text style={styles.label}>Dropoff (Home)</Text>
        <Text style={styles.value}>{retrieval.dropoff}</Text>

        <Text style={styles.label}>Driver Status</Text>
        <Text style={styles.status}>{retrieval.status?.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
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
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },
});




