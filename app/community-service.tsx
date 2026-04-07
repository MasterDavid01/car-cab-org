import React, { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../firebaseConfig";
import { useAuth } from "../lib/AuthContext";
import { authJson, jsonBody } from "../lib/backendClient";

type RegistrationRecord = {
  workerName?: string;
  workerEmail?: string;
  workerPhone?: string;
  homeAddress?: string;
  courtCaseNumber?: string;
  courtName?: string;
  courtContactEmail?: string;
  sentenceHoursOrdered?: number;
  status?: string;
  contract?: {
    signedName?: string;
    signedAtIso?: string;
    version?: string;
  } | null;
  documents?: {
    driversLicense?: RegistrationDocument | null;
    insurance?: RegistrationDocument | null;
    registration?: RegistrationDocument | null;
  } | null;
  contractEmailDelivery?: {
    accepted?: boolean;
    skipped?: boolean;
    reason?: string;
  } | null;
};

type RegistrationDocument = {
  documentUrl?: string;
  addressOnDocument?: string;
  licenseNumber?: string;
  policyNumber?: string;
  registrationNumber?: string;
  expiryDate?: string;
};

type DocumentKey = "driversLicense" | "insurance" | "registration";

type RegistrationForm = {
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  homeAddress: string;
  courtCaseNumber: string;
  courtName: string;
  courtContactEmail: string;
  sentenceHoursOrdered: string;
  signedName: string;
  agreed: boolean;
  documents: Record<DocumentKey, RegistrationDocument>;
};

const LIABILITY_STATEMENT =
  "I understand and agree that Car Cab Org is not liable for any damages or injuries that may occur while performing community service.";

const emptyDocument = (): RegistrationDocument => ({
  documentUrl: "",
  addressOnDocument: "",
  expiryDate: "",
});

function buildInitialForm(email?: string | null, fullName?: string | null): RegistrationForm {
  return {
    workerName: fullName || "",
    workerEmail: email || "",
    workerPhone: "",
    homeAddress: "",
    courtCaseNumber: "",
    courtName: "",
    courtContactEmail: "",
    sentenceHoursOrdered: "",
    signedName: fullName || "",
    agreed: false,
    documents: {
      driversLicense: { ...emptyDocument(), licenseNumber: "" },
      insurance: { ...emptyDocument(), policyNumber: "" },
      registration: { ...emptyDocument(), registrationNumber: "" },
    },
  };
}

function formatStatus(value?: string | null) {
  return String(value || "not_started").replace(/_/g, " ").toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function mapRegistrationToForm(record: RegistrationRecord, fallback: RegistrationForm): RegistrationForm {
  return {
    ...fallback,
    workerName: record.workerName || fallback.workerName,
    workerEmail: record.workerEmail || fallback.workerEmail,
    workerPhone: record.workerPhone || "",
    homeAddress: record.homeAddress || "",
    courtCaseNumber: record.courtCaseNumber || "",
    courtName: record.courtName || "",
    courtContactEmail: record.courtContactEmail || "",
    sentenceHoursOrdered: record.sentenceHoursOrdered ? String(record.sentenceHoursOrdered) : "",
    signedName: record.contract?.signedName || record.workerName || fallback.signedName,
    agreed: Boolean(record.contract?.signedName),
    documents: {
      driversLicense: {
        ...fallback.documents.driversLicense,
        ...(record.documents?.driversLicense || {}),
      },
      insurance: {
        ...fallback.documents.insurance,
        ...(record.documents?.insurance || {}),
      },
      registration: {
        ...fallback.documents.registration,
        ...(record.documents?.registration || {}),
      },
    },
  };
}

export default function CommunityServiceRegistrationScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<RegistrationForm>(() => buildInitialForm());
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null);
  const [screenLoading, setScreenLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<DocumentKey | null>(null);

  useEffect(() => {
    if (!user) {
      setForm(buildInitialForm());
      setRegistration(null);
      setScreenLoading(false);
      return;
    }

    let cancelled = false;
    const fallback = buildInitialForm(user.email, user.displayName);
    setForm(fallback);

    authJson(user, "/community-service/my-registration")
      .then((payload: any) => {
        if (cancelled) return;
        setRegistration(payload?.item || null);
        setForm(mapRegistrationToForm(payload?.item || {}, fallback));
      })
      .catch((error: any) => {
        if (!cancelled) {
          Alert.alert("Community Service", error?.message || "Unable to load your registration.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setScreenLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  function updateField<K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDocument(docKey: DocumentKey, patch: Partial<RegistrationDocument>) {
    setForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [docKey]: {
          ...current.documents[docKey],
          ...patch,
        },
      },
    }));
  }

  async function pickDocument(docKey: DocumentKey) {
    if (!user) {
      Alert.alert("Sign In Required", "Sign in before uploading community service documents.");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Allow photo library access to attach the document image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingDocument(docKey);
        const asset = result.assets[0];
        const sourceUri = asset.uri;
        const extensionFromName = String(asset.fileName || "").split(".").pop();
        const extensionFromType = String(asset.mimeType || "").split("/").pop();
        const extension = extensionFromName || extensionFromType || "jpg";
        const blob = await (await fetch(sourceUri)).blob();
        const path = `community-service-documents/${user.uid}/${docKey}-${Date.now()}.${extension}`;
        const uploadRef = ref(storage, path);
        await uploadBytes(uploadRef, blob, {
          contentType: asset.mimeType || "image/jpeg",
        });
        const downloadUrl = await getDownloadURL(uploadRef);
        updateDocument(docKey, { documentUrl: downloadUrl });
      }
    } catch {
      Alert.alert("Document Upload", "Unable to upload this document right now.");
    } finally {
      setUploadingDocument(null);
    }
  }

  async function submitRegistration() {
    if (!user) {
      Alert.alert("Sign In Required", "Sign in before submitting community service registration.");
      return;
    }

    if (!form.agreed) {
      Alert.alert("Contract Required", "Accept the liability contract before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = await authJson(user, "/community-service/register", {
        method: "POST",
        body: jsonBody({
          workerName: form.workerName.trim(),
          workerEmail: form.workerEmail.trim(),
          workerPhone: form.workerPhone.trim(),
          homeAddress: form.homeAddress.trim(),
          courtCaseNumber: form.courtCaseNumber.trim(),
          courtName: form.courtName.trim(),
          courtContactEmail: form.courtContactEmail.trim(),
          sentenceHoursOrdered: Number(form.sentenceHoursOrdered || 0),
          hasValidDriverPrivileges: true,
          documents: form.documents,
          contract: {
            accepted: true,
            signedName: form.signedName.trim(),
            signedAtIso: new Date().toISOString(),
            version: "1.0",
            liabilityStatement: LIABILITY_STATEMENT,
          },
        }),
      });

      setRegistration(payload?.item || null);
      setForm((current) => mapRegistrationToForm(payload?.item || {}, current));
      Alert.alert(
        "Registration Submitted",
        "Your documents and signed contract were submitted for review. Once approved, you can start tracked community service shifts.",
        [{ text: "Open Shift Screen", onPress: () => router.push("/community-service-shift") }, { text: "Stay Here" }]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error?.message || "Unable to submit registration right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || screenLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Community Service Registration</Text>
        <Text style={styles.emptyBody}>Sign in first so your registration attaches to your account and court case.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/login") }>
          <Text style={styles.primaryButtonText}>Go To Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Community Service Worker Registration</Text>
      <Text style={styles.subtitle}>
        Submit court details, license, insurance, registration, and your signed liability contract before you start GPS-tracked hours.
      </Text>

      {registration ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Status: {formatStatus(registration.status)}</Text>
          <Text style={styles.statusLine}>Case ID: {registration.courtCaseNumber || "Not set"}</Text>
          <Text style={styles.statusLine}>Hours Ordered: {registration.sentenceHoursOrdered || 0}</Text>
          <Text style={styles.statusLine}>Signed Contract: {formatDate(registration.contract?.signedAtIso)}</Text>
          <Text style={styles.statusLine}>
            Contract Email: {registration.contractEmailDelivery?.accepted ? "Delivered" : registration.contractEmailDelivery?.skipped ? `Skipped (${registration.contractEmailDelivery?.reason || "unknown"})` : "Pending"}
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/community-service-shift") }>
            <Text style={styles.secondaryButtonText}>Open Shift Screen</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Worker Details</Text>
        <TextInput style={styles.input} value={form.workerName} onChangeText={(value) => updateField("workerName", value)} placeholder="Full legal name" placeholderTextColor="#777" />
        <TextInput style={styles.input} value={form.workerEmail} onChangeText={(value) => updateField("workerEmail", value)} placeholder="Email" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} value={form.workerPhone} onChangeText={(value) => updateField("workerPhone", value)} placeholder="Phone" placeholderTextColor="#777" keyboardType="phone-pad" />
        <TextInput style={styles.input} value={form.homeAddress} onChangeText={(value) => updateField("homeAddress", value)} placeholder="Home address" placeholderTextColor="#777" multiline />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Court Assignment</Text>
        <TextInput style={styles.input} value={form.courtCaseNumber} onChangeText={(value) => updateField("courtCaseNumber", value)} placeholder="Court case ID" placeholderTextColor="#777" autoCapitalize="characters" />
        <TextInput style={styles.input} value={form.courtName} onChangeText={(value) => updateField("courtName", value)} placeholder="Court name" placeholderTextColor="#777" />
        <TextInput style={styles.input} value={form.courtContactEmail} onChangeText={(value) => updateField("courtContactEmail", value)} placeholder="Court contact email" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} value={form.sentenceHoursOrdered} onChangeText={(value) => updateField("sentenceHoursOrdered", value)} placeholder="Sentence hours ordered" placeholderTextColor="#777" keyboardType="numeric" />
      </View>

      {([
        ["driversLicense", "Driver's License", "licenseNumber"],
        ["insurance", "Insurance", "policyNumber"],
        ["registration", "Vehicle Registration", "registrationNumber"],
      ] as Array<[DocumentKey, string, "licenseNumber" | "policyNumber" | "registrationNumber"]>).map(([docKey, label, numberKey]) => {
        const doc = form.documents[docKey];
        const isUploading = uploadingDocument === docKey;
        return (
          <View key={docKey} style={styles.card}>
            <Text style={styles.cardTitle}>{label}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(docKey)} disabled={Boolean(uploadingDocument)}>
              <Text style={styles.uploadButtonText}>{isUploading ? "Uploading..." : doc.documentUrl ? "Replace Document Image" : "Attach Document Image"}</Text>
            </TouchableOpacity>
            {isUploading ? <ActivityIndicator color="#D4AF37" /> : null}
            {doc.documentUrl ? <Image source={{ uri: doc.documentUrl }} style={styles.previewImage} /> : null}
            <TextInput
              style={styles.input}
              value={String(doc[numberKey] || "")}
              onChangeText={(value) => updateDocument(docKey, { [numberKey]: value })}
              placeholder={`${label} number`}
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.input}
              value={doc.addressOnDocument || ""}
              onChangeText={(value) => updateDocument(docKey, { addressOnDocument: value })}
              placeholder="Address shown on document"
              placeholderTextColor="#777"
              multiline
            />
            <TextInput
              style={styles.input}
              value={doc.expiryDate || ""}
              onChangeText={(value) => updateDocument(docKey, { expiryDate: value })}
              placeholder="Expiry date (YYYY-MM-DD)"
              placeholderTextColor="#777"
              autoCapitalize="none"
            />
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Liability Contract</Text>
        <Text style={styles.contractText}>{LIABILITY_STATEMENT}</Text>
        <TextInput style={styles.input} value={form.signedName} onChangeText={(value) => updateField("signedName", value)} placeholder="Type full name to sign" placeholderTextColor="#777" />
        <TouchableOpacity style={styles.checkRow} onPress={() => updateField("agreed", !form.agreed)} activeOpacity={0.8}>
          <View style={[styles.checkbox, form.agreed && styles.checkboxChecked]}>
            {form.agreed ? <Text style={styles.checkboxText}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>I confirm the address on all uploaded documents matches my home address and I accept this liability contract.</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} disabled={submitting} onPress={submitRegistration}>
        {submitting ? <ActivityIndicator color="#111" /> : <Text style={styles.primaryButtonText}>{registration ? "Resubmit Registration" : "Submit Registration"}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#F4E7B2",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#BEB8A5",
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#151515",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    gap: 10,
  },
  statusCard: {
    backgroundColor: "#1A2417",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3C5E33",
    gap: 8,
  },
  statusTitle: {
    color: "#9AE06E",
    fontSize: 18,
    fontWeight: "800",
  },
  statusLine: {
    color: "#E4E1D8",
    fontSize: 14,
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#303030",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  uploadButton: {
    backgroundColor: "#23354F",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#E8F1FF",
    fontWeight: "700",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#0D0D0D",
  },
  contractText: {
    color: "#D8D1BF",
    lineHeight: 21,
    fontSize: 14,
  },
  checkRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#D4AF37",
  },
  checkboxText: {
    color: "#111",
    fontWeight: "800",
  },
  checkLabel: {
    flex: 1,
    color: "#D8D1BF",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#223B24",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#C8F3AF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  emptyBody: {
    color: "#C8C2B2",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 14,
    lineHeight: 22,
  },
});