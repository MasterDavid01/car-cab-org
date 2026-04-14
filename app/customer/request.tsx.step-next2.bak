import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../firebaseConfig";

export default function RetrievalRequestScreen() {
  const { user } = useAuth();
  const [locationStatus, setLocationStatus] = useState("Locking current GPS location...");
  const [requestCoords, setRequestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [homeAddress, setHomeAddress] = useState<string>("");
  const [homeCoords, setHomeCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [safetyPledge, setSafetyPledge] = useState(false);

  useEffect(() => {
    const lockLocation = async () => {
      try {
        setLoadingPricing(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationStatus("GPS location permission was not granted.");
          setLoadingPricing(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        const currentCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setRequestCoords(currentCoords);
        setLocationStatus(
          `GPS locked at ${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`
        );

        if (!user?.uid) {
          setLoadingPricing(false);
          return;
        }

        const complianceSnap = await getDoc(doc(db, "customerCompliance", user.uid));
        const complianceData = complianceSnap.exists() ? (complianceSnap.data() as any) : null;
        const lockedHome =
          String(complianceData?.retrievalDeliveryAddressLocked || complianceData?.homeAddress || "").trim();

        if (!lockedHome) {
          setHomeAddress("Locked home address not found in profile.");
          setLoadingPricing(false);
          return;
        }

        setHomeAddress(lockedHome);
        const geocoded = await Location.geocodeAsync(lockedHome);
        if (!geocoded.length) {
          setHomeAddress(`${lockedHome} (unable to geocode for distance estimate)`);
          setLoadingPricing(false);
          return;
        }

        const destinationCoords = {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
        setHomeCoords(destinationCoords);

        const miles = haversineMiles(currentCoords.latitude, currentCoords.longitude, destinationCoords.latitude, destinationCoords.longitude);
        setDistanceMiles(miles);
      } catch (error) {
        setLocationStatus("Unable to lock GPS location right now.");
      } finally {
        setLoadingPricing(false);
      }
    };

    lockLocation();
  }, [user?.uid]);

  const fare = calculateFare(distanceMiles || 0);
  const baseCharge = fare.baseCharge;
  const tipCharge = fare.tipCharge;
  const totalCharge = fare.totalCharge;
  const originalEstimatedMinutes = calculateOriginalEstimatedMinutes(distanceMiles || 0);

  const handleSubmit = () => {
    if (!requestCoords || !homeCoords || !homeAddress || distanceMiles === null) {
      return;
    }

    router.push({
      pathname: "/customer/face-verify",
      params: {
        requestLat: String(requestCoords.latitude),
        requestLng: String(requestCoords.longitude),
        homeLat: String(homeCoords.latitude),
        homeLng: String(homeCoords.longitude),
        homeAddress,
        distanceMiles: distanceMiles.toFixed(2),
        originalEstimatedMinutes: String(originalEstimatedMinutes),
        baseCharge: baseCharge.toFixed(2),
        tipCharge: tipCharge.toFixed(2),
        totalCharge: totalCharge.toFixed(2),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Request Vehicle Retrieval</Text>
      <Text style={styles.subtitle}>
        Your vehicle location and registration details are already locked in from your account registration.
      </Text>

      <View style={styles.lockedCard}>
        <Text style={styles.cardTitle}>Locked Vehicle Retrieval Data</Text>
        <Text style={styles.cardItem}>GPS Vehicle Location: {locationStatus}</Text>
        <Text style={styles.cardItem}>Locked Home Address: {homeAddress || "Loading..."}</Text>
        <Text style={styles.cardItem}>Vehicle License: On file from registration</Text>
        <Text style={styles.cardItem}>Vehicle Registration: On file from registration</Text>
        <Text style={styles.cardItem}>Insurance Information: On file from registration</Text>
      </View>

      <View style={styles.lockedCard}>
        <Text style={styles.cardTitle}>Retrieval Pricing Estimate</Text>
        {loadingPricing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFD700" />
            <Text style={styles.cardItem}>Calculating distance and fare...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardItem}>Distance to locked home address: {distanceMiles !== null ? `${distanceMiles.toFixed(2)} miles` : "Unavailable"}</Text>
            <Text style={styles.cardItem}>Estimated direct-route time: {originalEstimatedMinutes} minutes</Text>
            <Text style={styles.cardItem}>Base charge (first mile minimum 30.00 USD): ${baseCharge.toFixed(2)}</Text>
            <Text style={styles.cardItem}>Additional mileage after first mile: $3.00/mile</Text>
            <Text style={styles.cardItem}>Mandatory 20% tip: ${tipCharge.toFixed(2)}</Text>
            <Text style={styles.cardTotal}>Estimated retrieval total: ${totalCharge.toFixed(2)}</Text>
          </>
        )}
      </View>

      <Text style={styles.facePrompt}>
        Next step: face recognition confirmation and request submission for driver assignment.
      </Text>

      {/* ── SAFETY PLEDGE ── */}
      <View style={styles.pledgeCard}>
        <Text style={styles.pledgeTitle}>Safety Pledge — Required</Text>
        <Text style={styles.pledgeBody}>
          Car Cab Org exists to keep you safe. Before requesting a retrieval, please affirm:
        </Text>
        <TouchableOpacity
          style={styles.pledgeRow}
          onPress={() => setSafetyPledge((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, safetyPledge && styles.checkboxChecked]}>
            {safetyPledge ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.pledgeLabel}>
            I understand I am impaired and will NOT attempt to drive myself tonight or return to my vehicle until I am sober.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!requestCoords || !homeCoords || distanceMiles === null || loadingPricing || !safetyPledge) && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
        disabled={!requestCoords || !homeCoords || distanceMiles === null || loadingPricing || !safetyPledge}
      >
        <Text style={styles.primaryButtonText}>Confirm Pricing and Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 24,
  },
  lockedCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  cardTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardItem: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  cardTotal: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  facePrompt: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  pledgeCard: {
    backgroundColor: "#0D1A0D",
    borderWidth: 1,
    borderColor: "#2E8B57",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  pledgeTitle: {
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  pledgeBody: {
    color: "#CCDDCC",
    fontSize: 13,
    marginBottom: 12,
  },
  pledgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#2E8B57",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#2E8B57",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  pledgeLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function calculateFare(distanceMiles: number) {
  const safeMiles = Math.max(0, distanceMiles || 0);
  const baseCharge = 30 + Math.max(0, safeMiles - 1) * 3;
  const tipCharge = baseCharge * 0.2;
  const totalCharge = baseCharge + tipCharge;

  return {
    baseCharge,
    tipCharge,
    totalCharge,
  };
}

function calculateOriginalEstimatedMinutes(distanceMiles: number) {
  const averageRouteSpeedMph = 25;
  const safeMiles = Math.max(0.1, distanceMiles || 0);
  return Math.max(1, Math.ceil((safeMiles / averageRouteSpeedMph) * 60));
}
