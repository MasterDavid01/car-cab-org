import { db } from "../../../firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PHASES = [
  "en_route",
  "arrived",
  "pickup_started",
  "pickup_complete",
  "returning_home",
  "complete",
];

export default function DriverRetrieval() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [retrieval, setRetrieval] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Load Retrieval
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "retrieval", id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        Alert.alert("Error", "Retrieval not found.");
        router.back();
        return;
      }

      setRetrieval({ id: snap.id, ...snap.data() });
      setLoading(false);
    };

    load();
  }, []);

  if (loading || !retrieval) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading…</Text>
      </View>
    );
  }

  const currentPhase = retrieval.status;
  const currentIndex = PHASES.indexOf(currentPhase);

  const nextPhase = PHASES[currentIndex + 1];

  // -----------------------------
  // Advance Timeline
  // -----------------------------
  const advance = async () => {
    if (!nextPhase) {
      Alert.alert("Complete", "This retrieval is already finished.");
      return;
    }

    try {
      const ref = doc(db, "retrieval", retrieval.id);

      await updateDoc(ref, {
        status: nextPhase,
        [`timestamps.${nextPhase}`]: serverTimestamp(),
      });

      // Reset idle time when retrieval is complete
      if (nextPhase === "complete") {
        const driverRef = doc(db, "drivers", retrieval.assignedDriverId);
        await updateDoc(driverRef, {
          idleStartAt: new Date(),
          activeRetrievalStatus: "idle",
        });
      } else {
        // Update driver’s active status
        const driverRef = doc(db, "drivers", retrieval.assignedDriverId);
        await updateDoc(driverRef, {
          activeRetrievalStatus: nextPhase,
        });
      }

      setRetrieval((prev: any) => ({
        ...prev,
        status: nextPhase,
      }));
    } catch {
      Alert.alert("Error", "Unable to update retrieval.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Retrieval</Text>

      <Text style={styles.label}>Pickup</Text>
      <Text style={styles.value}>{retrieval.pickup}</Text>

      <Text style={styles.label}>Dropoff</Text>
      <Text style={styles.value}>{retrieval.dropoff}</Text>

      <Text style={styles.status}>Status: {currentPhase}</Text>

      {nextPhase && (
        <TouchableOpacity style={styles.button} onPress={advance}>
          <Text style={styles.buttonText}>
            {currentPhase === "en_route" && "Mark Arrived"}
            {currentPhase === "arrived" && "Start Pickup"}
            {currentPhase === "pickup_started" && "Pickup Complete"}
            {currentPhase === "pickup_complete" && "Returning Home"}
            {currentPhase === "returning_home" && "Complete Retrieval"}
          </Text>
        </TouchableOpacity>
      )}

      {!nextPhase && <Text style={styles.complete}>Retrieval Complete</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#D4AF37",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 20,
  },
  value: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  status: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 40,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  complete: {
    color: "#0f0",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 40,
    textAlign: "center",
  },
  text: {
    color: "#fff",
    fontSize: 18,
  },
});




