import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { auth, db } from '../../firebaseConfig';

type Retrieval = {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  totalCost: number;
};

export default function MyTrips() {
  const router = useRouter();
  const [retrievals, setRetrievals] = useState<Retrieval[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "retrievals"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Retrieval[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          pickupLocation: data.pickupLocation || "Unknown pickup",
          dropoffLocation: data.dropoffLocation || "Unknown dropoff",
          status: data.status || "pending",
          totalCost: data.totalCost || 0,
        };
      });
      setRetrievals(list);
    });

    return () => unsub();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Trips</Text>

      {retrievals.map((r) => (
        <TouchableOpacity
          key={r.id}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/my-trips/[id]",
              params: { id: r.id },
            } as any)
          }
        >
          <Text style={styles.cardTitle}>{r.pickupLocation}</Text>
          <Text style={styles.cardSubtitle}>{r.status.toUpperCase()}</Text>
          <Text style={styles.cardCost}>${r.totalCost.toFixed(2)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#000", flex: 1, padding: 20 },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 20 },
  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "700" },
  cardSubtitle: { color: "#aaa", marginTop: 4 },
  cardCost: { color: "#fff", marginTop: 6, fontSize: 16, fontWeight: "600" },
});






