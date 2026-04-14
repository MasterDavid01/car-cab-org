import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../../firebaseConfig";

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams();
  const [retrieval, setRetrieval] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIXED: collection name must be "retrieval" (singular)
    const ref = doc(db, "retrieval", String(id));

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setRetrieval(snap.data());
        }
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [id]);

  if (loading || !retrieval || !retrieval.receipt) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading receipt…</Text>
      </View>
    );
  }

  const { baseFee, mileageRate, mileageCost, total } = retrieval.receipt;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Retrieval Receipt</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Retrieval ID</Text>
        <Text style={styles.value}>{id}</Text>

        <Text style={styles.label}>Completed</Text>
        <Text style={styles.value}>
          {retrieval.completedAt?.toDate
            ? retrieval.completedAt.toDate().toLocaleString()
            : "—"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>Base Fee</Text>
        <Text style={styles.rowValue}>${baseFee.toFixed(2)}</Text>

        <Text style={styles.rowLabel}>
          Mileage ({retrieval.finalMiles} mi @ ${mileageRate.toFixed(2)})
        </Text>
        <Text style={styles.rowValue}>${mileageCost.toFixed(2)}</Text>

        <View style={styles.divider} />

        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>

      <Text style={styles.footer}>Thank you for supporting Car Cab Org.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  rowLabel: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 10,
  },
  rowValue: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 16,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    color: "#D4AF37",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  footer: {
    color: "#777",
    fontSize: 14,
    marginTop: 30,
    textAlign: "center",
  },
});




