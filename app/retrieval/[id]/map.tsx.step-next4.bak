import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { getFirestore, doc, onSnapshot, collection } from "firebase/firestore";

type PickupDoc = {
  pickupLocationLat: number;
  pickupLocationLng: number;
  pickupLocationAddress?: string;
};

type DriverLocation = {
  lat: number;
  lng: number;
};

export default function RetrievalMap() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [pickup, setPickup] = useState<PickupDoc | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pickupId, setPickupId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const ref = doc(collection(getFirestore(), "retrieval"), id as string);

    const unsub = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) {
          setError("Retrieval not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() || {};
        setPickupId(data.pickupId || null);
        setDriverId(data.driverId || null);
      },
      err => {
        console.error(err);
        setError("Failed to load retrieval.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!pickupId) return;

    const ref = doc(collection(getFirestore(), "pickups"), pickupId);

    const unsub = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) {
          setError("Pickup not found.");
          return;
        }
        const data = snap.data() as any;
        if (
          typeof data.pickupLocationLat === "number" &&
          typeof data.pickupLocationLng === "number"
        ) {
          setPickup({
            pickupLocationLat: data.pickupLocationLat,
            pickupLocationLng: data.pickupLocationLng,
            pickupLocationAddress: data.pickupLocationAddress
          });
          setLoading(false);
        } else {
          setError("Pickup is missing coordinates.");
          setLoading(false);
        }
      },
      err => {
        console.error(err);
        setError("Failed to load pickup.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [pickupId]);

  useEffect(() => {
    if (!driverId) return;

    const ref = doc(collection(getFirestore(), "drivers"), driverId);

    const unsub = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) return;
        const data = snap.data() as any;
        const loc = data.location;
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          setDriverLocation({ lat: loc.lat, lng: loc.lng });
        }
      },
      err => {
        console.error(err);
      }
    );

    return () => unsub();
  }, [driverId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading map…</Text>
      </View>
    );
  }

  if (error || !pickup) {
    return (
      <View style={styles.center}>
        <Text>{error || "No pickup data available."}</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: pickup.pickupLocationLat,
    longitude: pickup.pickupLocationLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  };

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        <Marker
          coordinate={{
            latitude: pickup.pickupLocationLat,
            longitude: pickup.pickupLocationLng
          }}
          title="Pickup location"
          description={pickup.pickupLocationAddress || "Vehicle location"}
        />
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.lat,
              longitude: driverLocation.lng
            }}
            icon={require("../../../assets/logo.png")}
            title="Driver"
            description="Current driver position"
          />
        )}
      </MapView>
      {!driverLocation && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Waiting for driver location… (will appear once assigned and moving)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  banner: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8
  },
  bannerText: { color: "white", textAlign: "center", fontSize: 14 }
});





