import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { db } from "../../../firebaseConfig";

function getDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const [retrieval, setRetrieval] = useState<any>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    const ref = doc(db, "retrievals", String(id));

    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setRetrieval(data);

      if (
        data.driverLocation &&
        data.pickupCoords &&
        data.customerPushToken &&
        !data.nearbyNotified
      ) {
        const miles = getDistanceMiles(
          data.driverLocation.lat,
          data.driverLocation.lng,
          data.pickupCoords.latitude,
          data.pickupCoords.longitude,
        );

        const minutesAway = Math.round((miles / 30) * 60);

        if (minutesAway <= 5 && !notifiedRef.current) {
          notifiedRef.current = true;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Driver is almost there",
              body: "Your driver is about 5 minutes away.",
            },
            trigger: null,
          });

          await updateDoc(ref, {
            nearbyNotified: true,
          });
        }
      }
    });

    return () => unsub();
  }, []);

  if (!retrieval || !retrieval.driverLocation) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Waiting for driver location…</Text>
      </View>
    );
  }

  const driver = {
    latitude: retrieval.driverLocation.lat,
    longitude: retrieval.driverLocation.lng,
  };

  const pickup = retrieval.pickupCoords;
  const dropoff = retrieval.dropoffCoords;

  const routeCoords = [
    driver,
    ...(pickup ? [pickup] : []),
    ...(dropoff ? [dropoff] : []),
  ];

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: driver.latitude,
        longitude: driver.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      <Marker coordinate={driver} title="Driver" pinColor="gold" />

      {pickup && <Marker coordinate={pickup} title="Pickup" pinColor="green" />}

      {dropoff && (
        <Marker coordinate={dropoff} title="Dropoff" pinColor="red" />
      )}

      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#D4AF37"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
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
});




