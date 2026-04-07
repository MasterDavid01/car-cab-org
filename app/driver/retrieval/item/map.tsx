import { db } from "../../../../firebaseConfig";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function DriverMapScreen() {
  const { id } = useLocalSearchParams();
  const retrievalId = Array.isArray(id) ? id[0] : id;

  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [retrieval, setRetrieval] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Replace with real auth context later
  const driverId = "DRIVER_AUTH_UID";

  // Subscribe to retrieval data
  useEffect(() => {
    if (!retrievalId) return;

    const ref = doc(db, "retrievals", retrievalId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setRetrieval({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [retrievalId]);

  // Track driver GPS
  useEffect(() => {
    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 3,
        },
        async (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
            updatedAt: serverTimestamp(),
          };

          setDriverLocation(coords);

          await setDoc(
            doc(db, "drivers", driverId, "location", "current"),
            coords,
            {
              merge: true,
            },
          );
        },
      );
    }

    startTracking();
  }, []);

  if (loading || !retrieval) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const pickup = retrieval.pickupCoords;
  const dropoff = retrieval.dropoffCoords;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: driverLocation?.latitude ?? pickup?.latitude ?? 37.7749,
          longitude:
            driverLocation?.longitude ?? pickup?.longitude ?? -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Your Location"
            pinColor="gold"
          />
        )}

        {pickup && (
          <Marker coordinate={pickup} title="Pickup" pinColor="green" />
        )}

        {dropoff && (
          <Marker coordinate={dropoff} title="Dropoff" pinColor="red" />
        )}
      </MapView>
    </View>
  );
}




