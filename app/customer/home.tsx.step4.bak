import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/AuthContext";
import { hasAdminBypass } from "../../lib/adminBypass";
import { isAuthorizedAdmin } from "../../lib/adminAccess";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { buildApiUrl } from "../../lib/apiBase";

export default function CustomerHomeScreen() {
  const { signOut, user } = useAuth();
  const params = useLocalSearchParams<{ devBypass?: string }>();
  const allowDevBypass = __DEV__ && String(params.devBypass || "") === "1";
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<"checking" | "active" | "suspended">("checking");
  const [complianceReason, setComplianceReason] = useState<string>("");
  const [impactCount, setImpactCount] = useState<number | null>(null);

  useEffect(() => {
    const validateCompliance = async () => {
      if (!user?.uid) return;

      try {
        if (hasAdminBypass(user.uid) || (allowDevBypass && isAuthorizedAdmin(user))) {
          setComplianceStatus("active");
          setComplianceReason("");
          return;
        }

        const snapshot = await getDoc(doc(db, "customerCompliance", user.uid));
        if (!snapshot.exists()) {
          setComplianceStatus("suspended");
          setComplianceReason("Required compliance documents are missing.");
          Alert.alert(
            "Compliance Required",
            "Upload your driver's license, insurance, and registration to continue retrieval service.",
            [{ text: "Upload Now", onPress: () => router.replace("/customer/onboarding-docs") }]
          );
          return;
        }

        const data = snapshot.data() as any;
        const homeAddress = normalizeAddress(data.homeAddress || "");
        const docs = data.docs || {};
        const required = ["license", "insurance", "registration"];

        for (const key of required) {
          const item = docs[key];
          if (!item || !item.expiryDate || !item.addressOnDocument) {
            setComplianceStatus("suspended");
            setComplianceReason("A required document is missing required verification fields.");
            return;
          }

          const expiry = new Date(`${item.expiryDate}T23:59:59.000Z`);
          if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
            setComplianceStatus("suspended");
            setComplianceReason("One or more compliance documents are expired.");
            return;
          }

          if (normalizeAddress(item.addressOnDocument) !== homeAddress) {
            setComplianceStatus("suspended");
            setComplianceReason("Address mismatch across required compliance documents.");
            return;
          }
        }

        setComplianceStatus("active");
        setComplianceReason("");
      } catch (error) {
        console.error("Compliance check failed:", error);
        setComplianceStatus("suspended");
        setComplianceReason("Unable to verify compliance documents right now.");
      }
    };

    validateCompliance();

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission not granted.");
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        setCoords({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch (err) {
        setLocationError("Unable to read GPS location.");
      }
    };

    loadLocation();

    // Load community impact counter from backend stats endpoint
    fetch(buildApiUrl("/stats/public"))
      .then((r) => r.json())
      .then((payload) => {
        const count = payload?.stats?.completedRetrievals ?? payload?.stats?.totalRetrievals ?? null;
        if (count !== null) setImpactCount(Number(count));
      })
      .catch(() => undefined);
  }, [user?.uid, allowDevBypass]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/menu");
    } catch (err) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Car Cab Org</Text>
        {user && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>

      <Text style={styles.subtitle}>
        Nonprofit vehicle retrieval focused on safety, clarity, and community.
      </Text>

      {/* Community impact counter */}
      {impactCount !== null ? (
        <View style={styles.impactCard}>
          <Text style={styles.impactNumber}>{impactCount.toLocaleString()}</Text>
          <Text style={styles.impactLabel}>Safe Rides Completed — Lives Protected</Text>
        </View>
      ) : null}

      {complianceStatus !== "active" && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Service Suspended</Text>
          <Text style={styles.alertBody}>
            {complianceReason || "Compliance documents need updates before retrieval service resumes."}
          </Text>
          <Text style={styles.alertBody}>
            Membership billing continues while suspended until valid documents are uploaded.
          </Text>
          <TouchableOpacity style={styles.alertButton} onPress={() => router.push("/customer/onboarding-docs")}>
            <Text style={styles.alertButtonText}>Update Documents</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Your GPS Locator</Text>
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
            <Marker coordinate={coords} title="You" pinColor="gold" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>{locationError || "Getting your current location..."}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/customer/request")}
        disabled={complianceStatus !== "active"}
      >
        <Text style={styles.primaryButtonText}>Request Retrieval</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/customer/status")}
        disabled={complianceStatus !== "active"}
      >
        <Text style={styles.secondaryButtonText}>View Retrieval Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/customer/membership")}
      >
        <Text style={styles.secondaryButtonText}>Membership</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/customer/dui-class")}
      >
        <Text style={styles.secondaryButtonText}>DUI Class Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/terms-accept")}
      >
        <Text style={styles.secondaryButtonText}>Terms & Conditions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.safetyResourcesButton}
        onPress={() => router.push("/safety-resources")}
      >
        <Text style={styles.safetyResourcesButtonText}>🛡️ Safety & Support Resources</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contractButton}
        onPress={() => router.push("/membership-contract")}
      >
        <Text style={styles.contractButtonText}>📄 My Membership Contract</Text>
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 30,
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
    marginBottom: 16,
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
    marginBottom: 14,
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
    height: 170,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  signOutButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    marginTop: 14,
  },
  signOutButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  impactCard: {
    backgroundColor: "#0A1A0A",
    borderWidth: 1,
    borderColor: "#2E8B57",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  impactNumber: {
    color: "#4CAF50",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 1,
  },
  impactLabel: {
    color: "#A0D8A0",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  safetyResourcesButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginBottom: 8,
    backgroundColor: "#0D0D00",
  },
  safetyResourcesButtonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },
  contractButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    marginBottom: 8,
    backgroundColor: "#1a1a1a",
  },
  contractButtonText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },
});

function normalizeAddress(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
