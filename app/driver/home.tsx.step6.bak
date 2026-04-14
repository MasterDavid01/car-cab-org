import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/AuthContext";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function DriverHomeScreen() {
  const { signOut, user, driverProfile } = useAuth();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const approvalStatus = String(
    driverProfile?.eligibility?.status || driverProfile?.backgroundCheck?.status || driverProfile?.onboarding?.status || "pending"
  ).toLowerCase();
  const isDriverApproved =
    driverProfile?.eligibility?.driverApproved === true || approvalStatus === "approved" || approvalStatus === "cleared";

  const syncDriverPresence = async (
    nextCoords: { latitude: number; longitude: number } | null,
    nextAvailable: boolean
  ) => {
    if (!user?.uid || !nextCoords) return;

    await setDoc(
      doc(db, "drivers", user.uid),
      {
        availability: {
          isAvailable: nextAvailable,
          updatedAt: serverTimestamp(),
        },
        currentLocation: {
          latitude: nextCoords.latitude,
          longitude: nextCoords.longitude,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "drivers", user.uid, "location", "current"),
      {
        latitude: nextCoords.latitude,
        longitude: nextCoords.longitude,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission not granted.");
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        const currentCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setCoords(currentCoords);
        await syncDriverPresence(currentCoords, true);
      } catch (err) {
        setLocationError("Unable to read GPS location.");
      }
    };

    loadLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const current = await Location.getCurrentPositionAsync({});
        const currentCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setCoords(currentCoords);
        await syncDriverPresence(currentCoords, isAvailable);
      } catch {
        // Keep existing location and continue retrying on next interval tick.
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isAvailable, user?.uid]);

  const handleSignOut = async () => {
    try {
      if (user?.uid) {
        await setDoc(
          doc(db, "drivers", user.uid),
          {
            availability: {
              isAvailable: false,
              updatedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await signOut();
      router.replace("/menu");
    } catch (err) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const toggleAvailability = async () => {
    if (!coords) {
      Alert.alert("Location Required", "Waiting for a GPS fix before changing availability.");
      return;
    }

    const nextAvailable = !isAvailable;
    setIsAvailable(nextAvailable);

    try {
      await syncDriverPresence(coords, nextAvailable);
    } catch (error) {
      setIsAvailable(!nextAvailable);
      Alert.alert("Update Failed", "Could not update driver availability right now.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Console</Text>
        {user && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>

      <Text style={styles.subtitle}>
        View assigned retrievals, update status, and stay aligned with Car Cab Org safety rules.
      </Text>

      {!isDriverApproved ? (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Driver Access Pending</Text>
          <Text style={styles.alertBody}>
            Complete onboarding and wait for background clearance before taking live retrieval work.
          </Text>
          <TouchableOpacity style={styles.alertButton} onPress={() => router.push("/driver/onboarding-intro")}>
            <Text style={styles.alertButtonText}>Continue Onboarding</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Driver GPS Locator</Text>
        {coords ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker coordinate={coords} title="Driver Location" pinColor="gold" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>{locationError || "Getting your current location..."}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/driver/onboarding-intro")}
      >
        <Text style={styles.primaryButtonText}>Complete Onboarding</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/driver/assigned")}
        disabled={!isDriverApproved}
      >
        <Text style={styles.secondaryButtonText}>View Assignments</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, isAvailable ? styles.availableButton : styles.unavailableButton]}
        onPress={toggleAvailability}
        disabled={!isDriverApproved}
      >
        <Text style={styles.secondaryButtonText}>
          {isAvailable ? "Set As Unavailable" : "Set As Available"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: "#D4AF37", backgroundColor: "#0D0D00", marginBottom: 8 }]}
        onPress={() => router.push("/safety-resources")}
      >
        <Text style={[styles.secondaryButtonText, { color: "#D4AF37", fontWeight: "700" }]}>🛡️ Safety & Support Resources</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: "#555", backgroundColor: "#1a1a1a", marginBottom: 8 }]}
        onPress={() => router.push("/membership-contract")}
      >
        <Text style={[styles.secondaryButtonText, { color: "#aaa" }]}>📄 My Membership Contract</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  userEmail: {
    color: "#AAAAAA",
    fontSize: 12,
    marginBottom: 16,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 24,
  },
  alertCard: {
    backgroundColor: "#221212",
    borderWidth: 1,
    borderColor: "#9F3A3A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertTitle: {
    color: "#FF9090",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  alertBody: {
    color: "#FFD3D3",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertButton: {
    alignSelf: "flex-start",
    backgroundColor: "#D4AF37",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  alertButtonText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 13,
  },
  mapCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#111111",
  },
  mapTitle: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  map: {
    width: "100%",
    height: 220,
  },
  mapPlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  mapPlaceholderText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 10,
  },
  availableButton: {
    borderColor: "#2E8B57",
  },
  unavailableButton: {
    borderColor: "#8B2E2E",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  signOutButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    marginTop: 24,
  },
  signOutButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
});
