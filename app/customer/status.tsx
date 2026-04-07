import React from "react";
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { buildApiUrl } from "../../lib/apiBase";

type RetrievalDetails = {
  status?: string;
  statusTimestamps?: {
    retrievalTimerStartedAtIso?: string | null;
    inProgressAtIso?: string | null;
    completedAtIso?: string | null;
  };
  pricing?: {
    distanceMiles?: number;
  };
  tracking?: {
    liveMileageMiles?: number;
  };
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverProfilePhotoUrl?: string | null;
  customerPhone?: string | null;
  detour?: {
    status?: string;
    reason?: string;
    startedAtIso?: string | null;
    endedAtIso?: string | null;
  };
};

function formatElapsed(startIso?: string | null, endIso?: string | null, nowMs?: number) {
  if (!startIso) return "00:00";
  const startMs = new Date(startIso).getTime();
  const endMs = endIso ? new Date(endIso).getTime() : nowMs || Date.now();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return "00:00";

  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }
  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function RetrievalStatusScreen() {
  const params = useLocalSearchParams();
  const requestId = String(params.requestId || "");
  const requestLat = parseFloat(String(params.requestLat || "0")) || null;
  const requestLng = parseFloat(String(params.requestLng || "0")) || null;
  const [status, setStatus] = React.useState("Pending Driver Assignment");
  const [assignedDriver, setAssignedDriver] = React.useState("Unassigned");
  const [assignedDriverPhotoUrl, setAssignedDriverPhotoUrl] = React.useState<string | null>(null);
  const [retrieval, setRetrieval] = React.useState<RetrievalDetails | null>(null);
  const [detourCode, setDetourCode] = React.useState("");
  const [verifyingDetour, setVerifyingDetour] = React.useState(false);
  const [nowMs, setNowMs] = React.useState(Date.now());
  const [arrivalConfirmed, setArrivalConfirmed] = React.useState(false);

  const handleCall911 = () => {
    Linking.openURL("tel:911").catch(() =>
      Alert.alert("Unable to call", "Please dial 911 directly from your phone keypad.")
    );
  };

  const handleTextLocation = () => {
    const lat = requestLat || 0;
    const lng = requestLng || 0;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const body = encodeURIComponent(
      `HELP — I am in a Car Cab Org vehicle and need assistance. My GPS location when I booked: ${mapsLink} | Request ID: ${requestId.slice(0, 8)}`
    );
    Linking.openURL(`sms:?&body=${body}`).catch(() =>
      Alert.alert("SMS failed", "Unable to open messaging. Please call 911 directly.")
    );
  };

  const handleConfirmArrival = async () => {
    if (!requestId) return;
    try {
      await updateDoc(doc(db, "retrieval", requestId), {
        "customerArrival.confirmedByCustomer": true,
        "customerArrival.confirmedAtIso": new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      setArrivalConfirmed(true);
      Alert.alert("Safe Arrival Confirmed", "Thank you! We are glad you made it home safely. Car Cab Org cares about you.");
    } catch {
      Alert.alert("Could not confirm", "Please try again or contact us at david@carcab.org.");
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!requestId) return;

    const unsub = onSnapshot(
      doc(db, "retrieval", requestId),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data() as RetrievalDetails;
        setRetrieval(data);
        const rawStatus = data.status || "pending_assignment";
        setStatus(humanizeStatus(rawStatus));
        setAssignedDriver(data.assignedDriverName || data.assignedDriverId || "Unassigned");
        setAssignedDriverPhotoUrl(data.assignedDriverProfilePhotoUrl || null);
      },
      (error) => {
        console.error("Failed to watch retrieval status:", error);
      }
    );

    return () => unsub();
  }, [requestId]);

  const handleBackHome = () => {
    router.replace("/customer/home");
  };

  const handleApproveDetour = async () => {
    if (!requestId || !retrieval?.customerPhone) {
      Alert.alert("Missing Phone", "Customer phone number is required to approve the detour.");
      return;
    }
    if (!detourCode.trim()) {
      Alert.alert("Verification Code Required", "Enter the code sent to your phone.");
      return;
    }

    try {
      setVerifyingDetour(true);
      const response = await fetch(buildApiUrl("/check-code"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: retrieval.customerPhone,
          code: detourCode.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Verification code is invalid or expired.");
      }

      await updateDoc(doc(db, "retrieval", requestId), {
        "detour.status": "approved",
        "detour.startedAt": serverTimestamp(),
        "detour.startedAtIso": new Date().toISOString(),
        "detour.customerApprovedAt": serverTimestamp(),
        "detour.customerApprovedAtIso": new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      setDetourCode("");
      Alert.alert("Detour Approved", "The detour timer is now running for both dashboards.");
    } catch (error: any) {
      console.error("Detour approval failed:", error);
      Alert.alert("Approval Failed", error?.message || "Unable to approve the detour.");
    } finally {
      setVerifyingDetour(false);
    }
  };

  const detourStatus = String(retrieval?.detour?.status || "idle");
  const detourTimerLabel = formatElapsed(retrieval?.detour?.startedAtIso || null, retrieval?.detour?.endedAtIso || null, nowMs);
  const retrievalTimerLabel = formatElapsed(
    retrieval?.statusTimestamps?.retrievalTimerStartedAtIso || retrieval?.statusTimestamps?.inProgressAtIso || null,
    retrieval?.statusTimestamps?.completedAtIso || null,
    nowMs
  );
  const liveMileageMiles = Math.max(
    0,
    Number(retrieval?.tracking?.liveMileageMiles || retrieval?.pricing?.distanceMiles || 0)
  );

  const isCompleted = String(retrieval?.status || "").includes("complete");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Retrieval Status</Text>
      <Text style={styles.subtitle}>
        Your retrieval request is being processed. Face recognition is complete and assignment is in progress.
      </Text>

      {/* ── EMERGENCY SOS ── */}
      <View style={styles.sosCard}>
        <Text style={styles.sosTitle}>🚨 Emergency</Text>
        <Text style={styles.sosBody}>If you feel unsafe or need immediate help, act now:</Text>
        <TouchableOpacity style={styles.sosCallButton} onPress={handleCall911}>
          <Text style={styles.sosCallText}>📞 Call 911</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sosTextButton} onPress={handleTextLocation}>
          <Text style={styles.sosTextBtnText}>📍 Text My Location for Help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{status}</Text>
        <Text style={styles.statusLabel}>Assigned Driver</Text>
        <Text style={styles.statusSecondary}>{assignedDriver}</Text>
        {assignedDriver !== "Unassigned" ? (
          <View style={styles.clearedBadge}>
            <Text style={styles.clearedBadgeText}>✓ Background Cleared — Verified by Car Cab Org</Text>
          </View>
        ) : null}
        <Text style={styles.statusLabel}>Retrieval Timer</Text>
        <Text style={styles.statusSecondary}>{retrievalTimerLabel}</Text>
        <Text style={styles.statusLabel}>Live Mileage</Text>
        <Text style={styles.statusSecondary}>{liveMileageMiles.toFixed(2)} miles</Text>
        {assignedDriverPhotoUrl ? (
          <Image source={{ uri: assignedDriverPhotoUrl }} style={styles.driverPhoto} />
        ) : (
          <Text style={styles.photoWarning}>Driver profile photo pending. Assignment may wait until available.</Text>
        )}
        {detourStatus !== "idle" ? (
          <View style={styles.detourCard}>
            <Text style={styles.statusLabel}>Detour Status</Text>
            <Text style={styles.detourStatus}>{detourStatus.replace(/_/g, " ").toUpperCase()}</Text>
            {retrieval?.detour?.reason ? <Text style={styles.detourReason}>Reason: {retrieval.detour.reason}</Text> : null}
            <Text style={styles.statusLabel}>Detour Timer</Text>
            <Text style={styles.detourTimer}>{detourTimerLabel}</Text>
            {detourStatus === "pending_customer_verification" ? (
              <>
                <TextInput
                  value={detourCode}
                  onChangeText={setDetourCode}
                  placeholder="Enter SMS verification code"
                  placeholderTextColor="#777777"
                  style={styles.input}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.secondaryButton, verifyingDetour && styles.disabledButton]}
                  disabled={verifyingDetour}
                  onPress={handleApproveDetour}
                >
                  <Text style={styles.secondaryButtonText}>
                    {verifyingDetour ? "Verifying..." : "Approve Detour"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        ) : null}
        {requestId ? <Text style={styles.requestId}>Request ID: {requestId.slice(0, 8)}</Text> : null}
      </View>

      {/* ── SAFE ARRIVAL CONFIRMATION ── shown when retrieval is completed */}
      {isCompleted && !arrivalConfirmed ? (
        <TouchableOpacity style={styles.arrivalButton} onPress={handleConfirmArrival}>
          <Text style={styles.arrivalButtonText}>✅ Confirm Safe Arrival Home</Text>
        </TouchableOpacity>
      ) : null}
      {arrivalConfirmed ? (
        <View style={styles.arrivalConfirmedCard}>
          <Text style={styles.arrivalConfirmedText}>You confirmed safe arrival. Thank you for trusting Car Cab Org. ❤️</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.primaryButton} onPress={handleBackHome}>
        <Text style={styles.primaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  sosCard: {
    backgroundColor: "#1A0000",
    borderWidth: 1,
    borderColor: "#CC2222",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  sosTitle: {
    color: "#FF4444",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  sosBody: {
    color: "#FFCCCC",
    fontSize: 13,
    marginBottom: 10,
  },
  sosCallButton: {
    backgroundColor: "#CC2222",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  sosCallText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  sosTextButton: {
    borderWidth: 1,
    borderColor: "#CC2222",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  sosTextBtnText: {
    color: "#FF8888",
    fontSize: 14,
    fontWeight: "700",
  },
  clearedBadge: {
    backgroundColor: "#0A1F0A",
    borderWidth: 1,
    borderColor: "#2E8B57",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  clearedBadgeText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "700",
  },
  arrivalButton: {
    backgroundColor: "#1B4332",
    borderWidth: 1,
    borderColor: "#2E8B57",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  arrivalButtonText: {
    color: "#48BB78",
    fontSize: 16,
    fontWeight: "800",
  },
  arrivalConfirmedCard: {
    backgroundColor: "#0A1F12",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2E8B57",
  },
  arrivalConfirmedText: {
    color: "#A0F0B0",
    fontSize: 14,
    textAlign: "center",
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
  statusCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#333333",
  },
  statusLabel: {
    color: "#AAAAAA",
    fontSize: 13,
    marginBottom: 4,
  },
  statusValue: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  statusSecondary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  driverPhoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "#444444",
    marginBottom: 10,
  },
  photoWarning: {
    color: "#FFCC66",
    fontSize: 13,
    marginBottom: 10,
  },
  detourCard: {
    backgroundColor: "#141414",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333333",
    padding: 14,
    marginBottom: 10,
  },
  detourStatus: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  detourReason: {
    color: "#DDDDDD",
    fontSize: 14,
    marginBottom: 8,
  },
  detourTimer: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    backgroundColor: "#101010",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  requestId: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

function humanizeStatus(status: string) {
  if (status === "pending_assignment") return "Pending Driver Assignment";
  if (status === "assigned") return "Assigned";
  if (status === "en_route") return "Driver En Route";
  if (status === "arrived") return "Driver Arrived";
  if (status === "in_progress") return "Retrieval In Progress";
  if (status === "completed") return "Completed";
  if (status === "admin_diverted") return "Admin Diverted";
  return status;
}
