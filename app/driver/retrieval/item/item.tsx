import { db } from "../../../../firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { acceptRetrieval } from "../../../../utils/acceptRetrieval";
import { arrivalAtPickup } from "../../../../utils/arrivalAtPickup";
import { completeRetrieval } from "../../../../utils/completeRetrieval";
import { startRetrieval } from "../../../../utils/startRetrieval";

export default function DriverRetrievalScreen() {
  const { id } = useLocalSearchParams();
  const [retrieval, setRetrieval] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Replace with real auth context later
  const driverId = "DRIVER_AUTH_UID";

  useEffect(() => {
    const retrievalId = Array.isArray(id) ? id[0] : id;
    if (!retrievalId) return;

    const ref = doc(db, "retrievals", retrievalId);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setRetrieval({ id: snap.id, ...snap.data() });
      } else {
        setRetrieval(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  async function handleDriverAction() {
    if (!retrieval) return;

    const retrievalId = retrieval.id;

    switch (retrieval.status) {
      case "pending":
        return await acceptRetrieval(retrievalId, driverId);
      case "assigned":
        return await arrivalAtPickup(retrievalId, driverId);
      case "arrived_at_pickup":
        return await startRetrieval(retrievalId, driverId);
      case "in_progress":
        return await completeRetrieval(retrievalId, driverId);
      default:
        return;
    }
  }

  function getButtonLabel() {
    if (!retrieval) return null;

    switch (retrieval.status) {
      case "pending":
        return "Accept Retrieval";
      case "assigned":
        return "Arrived at Pickup";
      case "arrived_at_pickup":
        return "Start Retrieval";
      case "in_progress":
        return "Complete Retrieval";
      default:
        return null;
    }
  }

  if (loading || !retrieval) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const label = getButtonLabel();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Retrieval Details
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 4 }}>
        Pickup: {retrieval.pickupAddress ?? "N/A"}
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 4 }}>
        Dropoff: {retrieval.dropoffAddress ?? "N/A"}
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Status: {retrieval.status}
      </Text>

      {/* TIMELINE */}
      <View style={{ marginTop: 20, marginBottom: 20 }}>
        {[
          { key: "assigned", label: "Assigned" },
          { key: "arrived_at_pickup", label: "Arrived at Pickup" },
          { key: "in_progress", label: "In Progress" },
          { key: "completed", label: "Completed" },
        ].map((step, index) => {
          const order = [
            "assigned",
            "arrived_at_pickup",
            "in_progress",
            "completed",
          ];
          const currentIndex = order.indexOf(retrieval.status);
          const stepIndex = index;
          const isActive = stepIndex <= currentIndex;

          return (
            <View
              key={step.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: isActive ? "#FFD700" : "#ccc",
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 16, color: isActive ? "#000" : "#777" }}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ACTION BUTTON */}
      {label && (
        <TouchableOpacity
          onPress={handleDriverAction}
          style={{
            backgroundColor: "#000",
            padding: 16,
            borderRadius: 12,
            marginTop: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}




