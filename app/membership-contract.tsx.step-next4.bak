import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { buildApiUrl } from "../lib/apiBase";
import { useAuth } from "../lib/AuthContext";

type ContractRecord = {
  signedName: string;
  signedAtIso: string;
  contractVersion: string;
  accepted: boolean;
};

const CONTRACT_TEXT = `CAR CAB ORG — MEMBERSHIP AGREEMENT

Effective upon electronic signature.

1. PURPOSE
Car Cab Org is a community safety organization that provides sober transportation services to individuals who are impaired and would otherwise operate a motor vehicle. Our mission is to prevent drunk driving, save lives, and support recovery.

2. MEMBER RESPONSIBILITIES
By becoming a member, you agree to:
a) Use Car Cab Org transportation services when impaired rather than driving yourself or allowing others to drive impaired.
b) Provide accurate personal information including name, address, and contact details.
c) Treat all drivers and staff with respect and dignity.
d) Refrain from any conduct that endangers drivers, other passengers, or the public.

3. DRIVER BACKGROUND CHECKS
All Car Cab Org drivers undergo thorough background checks prior to being cleared for service. By using our service, you acknowledge and consent to being transported by drivers who have passed our screening process.

4. DUI CLASS ATTENDANCE
Active 12-month members are eligible to attend DUI education sessions at no additional cost. Attendance records and certificates are maintained in your member profile.

5. PRIVACY & DATA
We collect and store personal information solely to facilitate safe transportation and compliance tracking. Your data is never sold to third parties. GPS coordinates collected during active rides are used exclusively for routing and safety.

6. LIMITATION OF LIABILITY
Car Cab Org operates as a community service organization. While we take every reasonable precaution to ensure safety, members use transportation services at their own risk. Car Cab Org is not liable for delays caused by traffic, weather, or events beyond our control.

7. ACKNOWLEDGMENT OF IMPAIRMENT
By requesting a ride, members acknowledge that they are impaired and voluntarily choosing safe transportation over driving. This acknowledgment may be used as evidence of responsible decision-making if relevant to any legal proceeding.

8. AGREEMENT
By signing below, you confirm that you have read and understood this Membership Agreement, and that you agree to all terms and conditions set forth herein.`;

export default function MembershipContractScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isReview = mode === "review";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingContract, setExistingContract] = useState<ContractRecord | null>(null);
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!user) return;
    user
      .getIdToken()
      .then((idToken) =>
        fetch(buildApiUrl("/membership/my-contract"), {
          headers: { Authorization: `Bearer ${idToken}` },
        })
      )
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.contract) setExistingContract(payload.contract);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSign() {
    if (!signedName.trim()) {
      Alert.alert("Name Required", "Please type your full name to sign.");
      return;
    }
    if (!agreed) {
      Alert.alert("Agreement Required", "Please check the box to agree to the terms.");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(buildApiUrl("/membership/sign-contract"), {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ signedName: signedName.trim() }),
      });
      const payload = await resp.json();
      if (!resp.ok || !payload.success) {
        throw new Error(payload.error || "Failed to sign contract");
      }
      setExistingContract(payload.contract);
      Alert.alert("Contract Signed", "Your membership agreement has been recorded. Thank you for your commitment to safety.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Unable to sign contract. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Membership Agreement</Text>
      <Text style={styles.subtitle}>Car Cab Org — Version 1.0</Text>

      <View style={styles.contractBox}>
        <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
      </View>

      {existingContract ? (
        <View style={styles.signedCard}>
          <Text style={styles.signedTitle}>✓ Agreement Signed</Text>
          <Text style={styles.signedDetail}>Signed as: {existingContract.signedName}</Text>
          <Text style={styles.signedDetail}>Date: {formatDate(existingContract.signedAtIso)}</Text>
          <Text style={styles.signedDetail}>Version: {existingContract.contractVersion}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : isReview ? (
        <View style={styles.reviewNote}>
          <Text style={styles.reviewNoteText}>You have not yet signed this agreement.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.signSection}>
          <Text style={styles.signLabel}>Type your full legal name to sign:</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={signedName}
            onChangeText={setSignedName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed((v) => !v)} activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              I have read, understand, and agree to be bound by this Membership Agreement.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signButton, (!signedName.trim() || !agreed || submitting) && styles.signButtonDisabled]}
            onPress={handleSign}
            disabled={!signedName.trim() || !agreed || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.signButtonText}>Sign Agreement</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  centered: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#D4AF37",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  contractBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 24,
  },
  contractText: {
    color: "#ddd",
    fontSize: 13,
    lineHeight: 20,
  },
  signedCard: {
    backgroundColor: "#1e3a1e",
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2e7d32",
    marginBottom: 20,
  },
  signedTitle: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  signedDetail: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 4,
  },
  reviewNote: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  reviewNoteText: {
    color: "#aaa",
    fontSize: 15,
    marginBottom: 16,
  },
  signSection: {
    marginBottom: 20,
  },
  signLabel: {
    color: "#ccc",
    fontSize: 15,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#D4AF37",
  },
  checkmark: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkLabel: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  signButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  signButtonDisabled: {
    opacity: 0.4,
  },
  signButtonText: {
    color: "#1a1a1a",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  backButtonText: {
    color: "#ccc",
    fontSize: 15,
  },
  cancelText: {
    color: "#888",
    textAlign: "center",
    fontSize: 14,
    padding: 8,
  },
});
