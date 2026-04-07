import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../lib/AuthContext";
import { setAdminBypass } from "../../lib/adminBypass";
import { db, storage } from "../../firebaseConfig";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type DocType = "license" | "insurance" | "registration";

export default function CustomerOnboardingDocsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const next = String(params.next || "/customer/home");

  const [homeAddress, setHomeAddress] = useState("");
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [insuranceUri, setInsuranceUri] = useState<string | null>(null);
  const [registrationUri, setRegistrationUri] = useState<string | null>(null);

  const [licenseAddress, setLicenseAddress] = useState("");
  const [insuranceAddress, setInsuranceAddress] = useState("");
  const [registrationAddress, setRegistrationAddress] = useState("");

  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");

  const [capturing, setCapturing] = useState<DocType | null>(null);
  const [saving, setSaving] = useState(false);
  const canUseAdminBypass = __DEV__;

  const hasAllDocs = Boolean(
    homeAddress.trim() &&
      licenseUri &&
      insuranceUri &&
      registrationUri &&
      licenseAddress.trim() &&
      insuranceAddress.trim() &&
      registrationAddress.trim() &&
      licenseExpiry.trim() &&
      insuranceExpiry.trim() &&
      registrationExpiry.trim()
  );

  const normalizedHomeAddress = useMemo(() => normalizeAddress(homeAddress), [homeAddress]);

  const requestCameraAndCapture = async (docType: DocType) => {
    try {
      setCapturing(docType);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera Access Needed", "Please allow camera access to upload your documents.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      if (docType === "license") setLicenseUri(uri);
      if (docType === "insurance") setInsuranceUri(uri);
      if (docType === "registration") setRegistrationUri(uri);
    } catch (error) {
      console.error("Document capture failed:", error);
      Alert.alert("Error", "Unable to capture photo right now. Please try again.");
    } finally {
      setCapturing(null);
    }
  };

  const handleContinue = async () => {
    if (!user?.uid) {
      Alert.alert("Session Error", "Please sign in again to continue.");
      return;
    }

    if (!hasAllDocs) {
      Alert.alert("Missing Documents", "Please capture all required documents before continuing.");
      return;
    }

    const docs = [
      {
        key: "license",
        title: "Driver's License",
        uri: licenseUri!,
        address: licenseAddress,
        expiry: licenseExpiry,
      },
      {
        key: "insurance",
        title: "Insurance Card",
        uri: insuranceUri!,
        address: insuranceAddress,
        expiry: insuranceExpiry,
      },
      {
        key: "registration",
        title: "Vehicle Registration",
        uri: registrationUri!,
        address: registrationAddress,
        expiry: registrationExpiry,
      },
    ] as const;

    for (const d of docs) {
      if (normalizeAddress(d.address) !== normalizedHomeAddress) {
        Alert.alert(
          "Address Mismatch",
          `${d.title} address must match the home address used for retrieval delivery.`
        );
        return;
      }

      const parsedExpiry = parseDate(d.expiry);
      if (!parsedExpiry) {
        Alert.alert("Invalid Date", `${d.title} expiration date must be in YYYY-MM-DD format.`);
        return;
      }

      if (parsedExpiry.getTime() < Date.now()) {
        Alert.alert(
          "Document Expired",
          `${d.title} is expired. Service is suspended until updated valid documents are uploaded.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const uploadResult = await Promise.all(
        docs.map(async (d) => {
          const storagePath = `customerDocuments/${user.uid}/${d.key}.jpg`;
          const fileRef = ref(storage, storagePath);
          const response = await fetch(d.uri);
          const blob = await response.blob();
          await uploadBytes(fileRef, blob);
          const downloadURL = await getDownloadURL(fileRef);

          const expiryDate = parseDate(d.expiry)!;
          return {
            addressOnDocument: d.address.trim(),
            expiryDate: d.expiry,
            expiryMs: expiryDate.getTime(),
            reminderSchedule: reminderDatesFor(expiryDate),
            fileURL: downloadURL,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const complianceRecord = {
        uid: user.uid,
        userEmail: user.email || null,
        userName: user.displayName || "Customer",
        homeAddress: homeAddress.trim(),
        retrievalDeliveryAddressLocked: homeAddress.trim(),
        policyVersion: "2026-04-01",
        serviceStatus: "active",
        suspensionReason: null,
        docs: {
          license: uploadResult[0],
          insurance: uploadResult[1],
          registration: uploadResult[2],
        },
        membershipBillingContinuesWhenSuspended: true,
        remindersPolicyDays: [60, 30, 14, 7, 1],
        termsPendingFormalization: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "customerCompliance", user.uid), complianceRecord, { merge: true });

      Alert.alert("Documents Saved", "Compliance documents verified and locked to your home address.", [
        { text: "Continue", onPress: () => router.push(next) },
      ]);
    } catch (error) {
      console.error("Failed to save compliance documents:", error);
      Alert.alert("Save Failed", "Could not save documents. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdminBypass = async () => {
    if (!user?.uid) {
      Alert.alert("Session Error", "Please sign in again to continue.");
      return;
    }

    const lockedAddress = homeAddress.trim() || "Admin Test Address";
    const futureExpiry = "2099-12-31";
    const futureDate = parseDate(futureExpiry);

    try {
      setSaving(true);
      const complianceRecord = {
        uid: user.uid,
        userEmail: user.email || null,
        userName: user.displayName || "Admin Test Customer",
        homeAddress: lockedAddress,
        retrievalDeliveryAddressLocked: lockedAddress,
        policyVersion: "2026-04-01",
        serviceStatus: "active",
        suspensionReason: null,
        docs: {
          license: {
            addressOnDocument: lockedAddress,
            expiryDate: futureExpiry,
            expiryMs: futureDate.getTime(),
            reminderSchedule: reminderDatesFor(futureDate),
            fileURL: "admin-test-bypass",
            updatedAt: new Date().toISOString(),
            bypassed: true,
          },
          insurance: {
            addressOnDocument: lockedAddress,
            expiryDate: futureExpiry,
            expiryMs: futureDate.getTime(),
            reminderSchedule: reminderDatesFor(futureDate),
            fileURL: "admin-test-bypass",
            updatedAt: new Date().toISOString(),
            bypassed: true,
          },
          registration: {
            addressOnDocument: lockedAddress,
            expiryDate: futureExpiry,
            expiryMs: futureDate.getTime(),
            reminderSchedule: reminderDatesFor(futureDate),
            fileURL: "admin-test-bypass",
            updatedAt: new Date().toISOString(),
            bypassed: true,
          },
        },
        membershipBillingContinuesWhenSuspended: true,
        remindersPolicyDays: [60, 30, 14, 7, 1],
        termsPendingFormalization: true,
        adminTestBypass: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "customerCompliance", user.uid), complianceRecord, { merge: true });
      setAdminBypass(user.uid, lockedAddress);
      Alert.alert("Admin Test Bypass Applied", "Test compliance record created so you can continue through the customer flow.", [
        { text: "Continue", onPress: () => router.push(next) },
      ]);
    } catch (error) {
      console.error("Admin bypass failed:", error);
      try {
        setAdminBypass(user.uid, lockedAddress);
        Alert.alert(
          "Admin Test Bypass Applied",
          "Firestore write failed, but local test bypass is now enabled for this session.",
          [{ text: "Continue", onPress: () => router.push(next) }]
        );
      } catch (storageError) {
        console.error("Local admin bypass fallback failed:", storageError);
        Alert.alert("Bypass Failed", "Could not create the test compliance record.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.container}>
      <Text style={styles.title}>Upload Required Documents</Text>
      <Text style={styles.subtitle}>
        Before account access, please take photos of your driver&apos;s license, insurance card, and
        vehicle registration. The same home address must appear on all three documents.
      </Text>

      <Text style={styles.inputLabel}>Locked Home Address (for retrieval delivery)</Text>
      <TextInput
        style={styles.input}
        value={homeAddress}
        onChangeText={setHomeAddress}
        placeholder="123 Main St, City, State ZIP"
        placeholderTextColor="#888888"
      />

      <DocumentCard
        title="Driver's License"
        uri={licenseUri}
        onPress={() => requestCameraAndCapture("license")}
        loading={capturing === "license"}
        address={licenseAddress}
        onChangeAddress={setLicenseAddress}
        expiry={licenseExpiry}
        onChangeExpiry={setLicenseExpiry}
      />

      <DocumentCard
        title="Insurance Card"
        uri={insuranceUri}
        onPress={() => requestCameraAndCapture("insurance")}
        loading={capturing === "insurance"}
        address={insuranceAddress}
        onChangeAddress={setInsuranceAddress}
        expiry={insuranceExpiry}
        onChangeExpiry={setInsuranceExpiry}
      />

      <DocumentCard
        title="Vehicle Registration"
        uri={registrationUri}
        onPress={() => requestCameraAndCapture("registration")}
        loading={capturing === "registration"}
        address={registrationAddress}
        onChangeAddress={setRegistrationAddress}
        expiry={registrationExpiry}
        onChangeExpiry={setRegistrationExpiry}
      />

      <TouchableOpacity
        style={[styles.continueButton, !hasAllDocs && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!hasAllDocs || saving}
      >
        {saving ? <ActivityIndicator color="#000000" /> : <Text style={styles.continueButtonText}>Continue to Dashboard</Text>}
      </TouchableOpacity>

      {canUseAdminBypass && (
        <TouchableOpacity style={styles.bypassButton} onPress={handleAdminBypass} disabled={saving}>
          <Text style={styles.bypassButtonText}>Admin Test Bypass</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.policyNote}>
        Compliance policy: reminders are scheduled for 60, 30, 14, 7, and 1 day before expiry. If
        any required document expires or is not updated, retrieval service is suspended until valid
        documents are uploaded. Membership billing continues.
      </Text>
    </ScrollView>
  );
}

type DocumentCardProps = {
  title: string;
  uri: string | null;
  onPress: () => void;
  loading: boolean;
  address: string;
  onChangeAddress: (value: string) => void;
  expiry: string;
  onChangeExpiry: (value: string) => void;
};

function DocumentCard({
  title,
  uri,
  onPress,
  loading,
  address,
  onChangeAddress,
  expiry,
  onChangeExpiry,
}: DocumentCardProps) {
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
        <Text style={styles.captureButtonText}>{loading ? "Opening Camera..." : "Take Photo"}</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.docInput}
        value={address}
        onChangeText={onChangeAddress}
        placeholder="Address shown on this document"
        placeholderTextColor="#8E8E8E"
      />

      <TextInput
        style={styles.docInput}
        value={expiry}
        onChangeText={onChangeExpiry}
        placeholder="Expiration date (YYYY-MM-DD)"
        placeholderTextColor="#8E8E8E"
      />
    </View>
  );
}

function normalizeAddress(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function reminderDatesFor(expiryDate: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return [60, 30, 14, 7, 1].map((daysBefore) => {
    const reminderDate = new Date(expiryDate.getTime() - daysBefore * dayMs);
    return {
      daysBefore,
      sendOn: reminderDate.toISOString(),
    };
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 21,
  },
  inputLabel: {
    color: "#D4AF37",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#101010",
    borderColor: "#343434",
    borderWidth: 1,
    borderRadius: 8,
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#111111",
    borderColor: "#2B2B2B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  placeholderImage: {
    height: 170,
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
    height: 170,
    borderRadius: 10,
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  captureButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  docInput: {
    marginTop: 10,
    backgroundColor: "#0D0D0D",
    borderColor: "#303030",
    borderWidth: 1,
    borderRadius: 8,
    color: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  continueButton: {
    marginTop: 8,
    backgroundColor: "#D4AF37",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  bypassButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  bypassButtonText: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
  },
  policyNote: {
    color: "#D4AF37",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    textAlign: "center",
    opacity: 0.95,
  },
});
