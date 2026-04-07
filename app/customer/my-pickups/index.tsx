import { db } from '../../../firebaseConfig';
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CustomerMyPickupsScreen() {
  const [retrievals, setRetrievals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const customerId = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "retrievals"),
      where("customerId", "==", customerId),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) =>
        list.push({ id: docSnap.id, ...docSnap.data() }),
      );
      list.sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
      );
      setRetrievals(list);
      setLoading(false);
    });

    return () => unsub();
  }, [customerId]);

  if (!customerId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>
          You must be logged in to view pickups.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const timeline = [
      { key: "pending", label: "Requested" },
      { key: "assigned", label: "Driver Assigned" },
      { key: "arrived_at_pickup", label: "Driver Arrived" },
      { key: "in_progress", label: "In Transit" },
      { key: "completed", label: "Completed" },
    ];

    const currentIndex = timeline.findIndex((t) => t.key === item.status);

    return (
      <View
        style={{
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#FFD700", fontSize: 20, fontWeight: "bold" }}>
          Pickup #{item.id}
        </Text>

        <Text style={{ color: "#fff", marginTop: 8 }}>
          Pickup: {item.pickupAddress ?? "N/A"}
        </Text>

        <Text style={{ color: "#fff", marginTop: 4 }}>
          Dropoff: {item.dropoffAddress ?? "N/A"}
        </Text>

        {item.assignedDriverId && (
          <Text style={{ color: "#FFD700", marginTop: 8 }}>
            Driver Assigned: {item.assignedDriverId}
          </Text>
        )}

        {/* TIMELINE */}
        <View style={{ marginTop: 16 }}>
          {timeline.map((step, index) => {
            const isActive = index <= currentIndex;

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
                    backgroundColor: isActive ? "#FFD700" : "#555",
                    marginRight: 10,
                  }}
                />
                <Text style={{ color: isActive ? "#FFD700" : "#888" }}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* RECEIPT BUTTON (future) */}
        {item.status === "completed" && (
          <TouchableOpacity
            style={{
              backgroundColor: "#FFD700",
              padding: 12,
              borderRadius: 10,
              marginTop: 16,
            }}
          >
            <Text
              style={{
                color: "#000",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              View Receipt
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        My Pickups
      </Text>

      {retrievals.length === 0 ? (
        <Text style={{ fontSize: 18, color: "#555" }}>
          You have no pickups yet.
        </Text>
      ) : (
        <FlatList
          data={retrievals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}






