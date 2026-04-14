import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

type DriverDocType = "licenseFront" | "licenseBack" | "insurance" | "registration";

export default function DriverOnboardingDocs() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [licenseFrontUri, setLicenseFrontUri] = useState<string | null>(null);
  const [licenseBackUri, setLicenseBackUri] = useState<string | null>(null);
  const [insuranceUri, setInsuranceUri] = useState<string | null>(null);
  const [registrationUri, setRegistrationUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState<DriverDocType | null>(null);

  const hasAllRequiredDocs = useMemo(
    () => Boolean(licenseFrontUri && licenseBackUri && insuranceUri && registrationUri),
    [licenseFrontUri, licenseBackUri, insuranceUri, registrationUri]
  );
  const vehicleMake = String(params.vehicleMake || "").trim();
  const vehicleModel = String(params.vehicleModel || "").trim();
  const vehicleColor = String(params.vehicleColor || "").trim();
  const licensePlate = String(params.licensePlate || "").trim();

  const requestCameraAndCapture = async (docType: DriverDocType) => {
    try {
      setCapturing(docType);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera Access Needed", "Please allow camera access to upload required documents.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      if (docType === "licenseFront") setLicenseFrontUri(uri);
      if (docType === "licenseBack") setLicenseBackUri(uri);
      if (docType === "insurance") setInsuranceUri(uri);
      if (docType === "registration") setRegistrationUri(uri);
    } catch (error) {
      console.error("Driver document capture failed:", error);
      Alert.alert("Capture Failed", "Unable to capture photo right now. Please try again.");
    } finally {
      setCapturing(null);
    }
  };

  const handleComplete = async () => {
    if (!hasAllRequiredDocs) {
      Alert.alert(
        "Missing Documents",
        "Please upload license front and back, insurance card, and registration before continuing."
      );
      return;
    }

    if (!user?.uid) {
      Alert.alert("Session Error", "Please sign in again to finish onboarding.");
      return;
    }

    if (!vehicleMake || !vehicleModel || !vehicleColor || !licensePlate) {
      Alert.alert("Vehicle Details Missing", "Go back and complete vehicle details before finishing onboarding.");
      return;
    }

    const nowIso = new Date().toISOString();

    try {
      await setDoc(
        doc(db, "drivers", user.uid),
        {
          name: user.displayName || user.email || "Driver",
          email: user.email || null,
          phone: user.phoneNumber || null,
          vehicle: {
            make: vehicleMake,
            model: vehicleModel,
            color: vehicleColor,
            licensePlate,
          },
          onboarding: {
            status: "pending_background_check",
            documentsSubmittedAtIso: nowIso,
            vehicleSubmittedAtIso: nowIso,
          },
          backgroundCheck: {
            status: "pending",
            provider: "unconfigured",
            requestedAtIso: null,
          },
          eligibility: {
            status: "pending",
            driverApproved: false,
            deniedAsDriver: false,
            updatedAtIso: nowIso,
          },
          availability: {
            isAvailable: false,
            updatedAtIso: nowIso,
          },
          documents: {
            licenseFront: { submitted: true, capturedAtIso: nowIso },
            licenseBack: { submitted: true, capturedAtIso: nowIso },
            insurance: { submitted: true, capturedAtIso: nowIso },
            registration: { submitted: true, capturedAtIso: nowIso },
          },
          updatedAt: serverTimestamp(),
          updatedAtIso: nowIso,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Driver onboarding save failed:", error);
      Alert.alert("Save Failed", "Unable to save driver onboarding right now.");
      return;
    }

    router.replace("/driver/home");
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.container}>
      <Text style={styles.title}>Upload Documents</Text>
      <Text style={styles.subtitle}>
        Upload all required documents to activate your driver onboarding.
      </Text>

      <DocumentCard
        title="Driver License (Front)"
        uri={licenseFrontUri}
        onPress={() => requestCameraAndCapture("licenseFront")}
        loading={capturing === "licenseFront"}
      />

      <DocumentCard
        title="Driver License (Back)"
        uri={licenseBackUri}
        onPress={() => requestCameraAndCapture("licenseBack")}
        loading={capturing === "licenseBack"}
      />

      <DocumentCard
        title="Insurance Card"
        uri={insuranceUri}
        onPress={() => requestCameraAndCapture("insurance")}
        loading={capturing === "insurance"}
      />

      <DocumentCard
        title="Vehicle Registration"
        uri={registrationUri}
        onPress={() => requestCameraAndCapture("registration")}
        loading={capturing === "registration"}
      />

      <TouchableOpacity
        style={[styles.primaryButton, !hasAllRequiredDocs && styles.primaryButtonDisabled]}
        onPress={handleComplete}
        disabled={!hasAllRequiredDocs}
      >
        <Text style={styles.primaryButtonText}>Complete Onboarding</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.policyNote}>
        Required: license front, license back, insurance card, and registration.
      </Text>
    </ScrollView>
  );
}

type DocumentCardProps = {
  title: string;
  uri: string | null;
  onPress: () => void;
  loading: boolean;
};

function DocumentCard({ title, uri, onPress, loading }: DocumentCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      {uri ? (
        <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No photo captured yet</Text>
        </View>
      )}

      <TouchableOpacity style={styles.captureButton} onPress={onPress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.captureButtonText}>Take Photo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 34,
  },
  title: {
    color: "#D4AF37",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 18,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#111111",
    borderColor: "#2B2B2B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  placeholderImage: {
    height: 160,
    borderRadius: 10,
    backgroundColor: "#1B1B1B",
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: {
    color: "#B8B8B8",
    fontSize: 13,
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  captureButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  policyNote: {
    color: "#D4AF37",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "center",
    opacity: 0.95,
  },
});
