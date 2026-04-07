import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";

import { buildApiUrl } from "../../lib/apiBase";
import { useAuth } from "../../lib/AuthContext";

type AttendanceItem = {
  id: string;
  attendanceMode?: string | null;
  lastStatus?: string | null;
  totalTrackedSeconds?: number;
  totalTrackedMinutes?: number;
  certificateEligible?: boolean;
  lastSeenAtIso?: string | null;
  activeSession?: {
    checkedInAtIso?: string | null;
    checkedOutAtIso?: string | null;
    attendanceMode?: string | null;
  } | null;
  raw?: any;
};

type ClassItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  deliveryMode?: string | null;
  startsAtIso?: string | null;
  endsAtIso?: string | null;
  requiredAttendanceMinutes?: number | null;
  locationName?: string | null;
  locationAddress?: string | null;
  onlineJoinUrl?: string | null;
  raw?: any;
  myAttendance?: AttendanceItem | null;
};

function formatStatus(value?: string | null) {
  return String(value || "unknown").replace(/_/g, " ").toUpperCase();
}

function formatElapsed(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatIso(value?: string | null) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function CustomerDuiClassScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function customerApi(path: string, options?: RequestInit) {
    if (!user) {
      throw new Error("customer_auth_required");
    }

    const idToken = await user.getIdToken();
    let response: Response;
    try {
      response = await fetch(buildApiUrl(path), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      throw new Error("class_api_unreachable");
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.reason || payload?.error || `class_api_${response.status}`);
    }

    return payload;
  }

  async function loadData() {
    try {
      setLoading(true);
      const payload = await customerApi("/dui-classes/active");
      setEligibility(payload?.eligibility || null);
      setItems(payload?.items || []);
    } catch (error: any) {
      Alert.alert("DUI Class", error?.message || "Unable to load DUI class information right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [user?.uid]);

  const membershipSummary = useMemo(() => {
    const membership = eligibility?.membership || {};
    return {
      active: Boolean(membership.active),
      contractMonths: Number(membership.contractMonths || 0),
      startedAtIso: membership.startedAtIso || null,
      cancellationLockedUntilIso: membership.cancellationLockedUntilIso || null,
    };
  }, [eligibility]);

  async function readLocation(required: boolean) {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      if (required) {
        throw new Error("GPS permission is required for in-person class attendance.");
      }
      return {};
    }

    const current = await Location.getCurrentPositionAsync({});
    return {
      coordinate: {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      },
      accuracyMeters: current.coords.accuracy || undefined,
    };
  }

  function getDisplayedTrackedSeconds(attendance?: AttendanceItem | null) {
    if (!attendance) return 0;

    const closedSeconds = Number(attendance?.raw?.totalTrackedSeconds || attendance.totalTrackedSeconds || 0);
    const activeCheckedInAtIso = attendance.activeSession?.checkedInAtIso;
    const activeCheckedOutAtIso = attendance.activeSession?.checkedOutAtIso;
    if (!activeCheckedInAtIso || activeCheckedOutAtIso) {
      return closedSeconds;
    }

    const startedMs = Date.parse(activeCheckedInAtIso);
    if (!Number.isFinite(startedMs)) {
      return closedSeconds;
    }

    return closedSeconds + Math.max(0, Math.floor((nowMs - startedMs) / 1000));
  }

  async function performAction(item: ClassItem, action: "check-in" | "heartbeat" | "check-out", attendanceMode: "in_person" | "online") {
    try {
      setSyncingId(item.id);
      const requiresGps = attendanceMode === "in_person" && item.raw?.attendancePolicy?.requireGpsEvidence !== false;
      const locationPayload = await readLocation(requiresGps);
      const payload = {
        attendanceMode,
        ...locationPayload,
        onlineProof: attendanceMode === "online" ? { source: "customer_app", capturedAtIso: new Date().toISOString() } : undefined,
      };

      await customerApi(`/dui-classes/${item.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await loadData();
    } catch (error: any) {
      Alert.alert("Attendance Update Failed", error?.message || "Unable to update class attendance right now.");
    } finally {
      setSyncingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#D4AF37" />
        <Text style={styles.loadingText}>Loading DUI class access...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DUI Class Attendance</Text>
      <Text style={styles.subtitle}>
        Active 12-month members can check in for Car Cab Org DUI classes here and keep attendance evidence for certification.
      </Text>

      <View style={[styles.card, eligibility?.eligible ? styles.cardOk : styles.cardWarning]}>
        <Text style={styles.cardTitle}>Membership Eligibility</Text>
        <Text style={styles.cardLine}>Eligible: {eligibility?.eligible ? "YES" : "NO"}</Text>
        <Text style={styles.cardLine}>Contract Length: {membershipSummary.contractMonths || 0} months</Text>
        {membershipSummary.startedAtIso ? <Text style={styles.cardLine}>Membership Started: {formatIso(membershipSummary.startedAtIso)}</Text> : null}
        {membershipSummary.cancellationLockedUntilIso ? (
          <Text style={styles.cardLine}>Cancellation Lock Until: {formatIso(membershipSummary.cancellationLockedUntilIso)}</Text>
        ) : null}
        {!eligibility?.eligible ? <Text style={styles.cardLine}>{eligibility?.reason || "Active 12-month membership is required."}</Text> : null}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={() => loadData()}>
        <Text style={styles.refreshButtonText}>Refresh Class Status</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No Classes Published</Text>
          <Text style={styles.cardLine}>Classes will appear here when Car Cab Org opens a new DUI class.</Text>
        </View>
      ) : (
        items.map((item) => {
          const attendance = item.myAttendance || null;
          const checkedIn = attendance?.lastStatus === "checked_in";
          const trackedSeconds = getDisplayedTrackedSeconds(attendance);
          const canUseOnline = item.deliveryMode === "online" || item.deliveryMode === "hybrid";
          const canUseInPerson = item.deliveryMode === "in_person" || item.deliveryMode === "hybrid";

          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || "DUI Class"}</Text>
              {item.description ? <Text style={styles.cardLine}>{item.description}</Text> : null}
              <Text style={styles.cardLine}>Status: {formatStatus(item.status)}</Text>
              <Text style={styles.cardLine}>Format: {formatStatus(item.deliveryMode || "hybrid")}</Text>
              <Text style={styles.cardLine}>Starts: {formatIso(item.startsAtIso)}</Text>
              <Text style={styles.cardLine}>Ends: {formatIso(item.endsAtIso)}</Text>
              <Text style={styles.cardLine}>Required Attendance: {Number(item.requiredAttendanceMinutes || 0)} minutes</Text>
              {item.locationName || item.locationAddress ? (
                <Text style={styles.cardLine}>Location: {[item.locationName, item.locationAddress].filter(Boolean).join(" - ")}</Text>
              ) : null}
              {item.onlineJoinUrl ? <Text style={styles.cardLine}>Online Link Configured: YES</Text> : null}

              <View style={styles.divider} />

              <Text style={styles.cardLine}>Your Status: {formatStatus(attendance?.lastStatus || "not_started")}</Text>
              <Text style={styles.cardLine}>Tracked Time: {formatElapsed(trackedSeconds)}</Text>
              <Text style={styles.cardLine}>Certification Ready: {attendance?.certificateEligible ? "YES" : "NO"}</Text>
              {attendance?.lastSeenAtIso ? <Text style={styles.cardLine}>Last Evidence Ping: {formatIso(attendance.lastSeenAtIso)}</Text> : null}

              {!eligibility?.eligible ? null : checkedIn ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => performAction(item, "heartbeat", (attendance?.attendanceMode as "in_person" | "online") || "in_person")}
                    disabled={syncingId === item.id}
                  >
                    <Text style={styles.buttonText}>{syncingId === item.id ? "Working..." : "Send Attendance Ping"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => performAction(item, "check-out", (attendance?.attendanceMode as "in_person" | "online") || "in_person")}
                    disabled={syncingId === item.id}
                  >
                    <Text style={styles.buttonText}>{syncingId === item.id ? "Working..." : "Check Out"}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  {canUseInPerson ? (
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={() => performAction(item, "check-in", "in_person")}
                      disabled={syncingId === item.id || !["open", "active"].includes(String(item.status || "").toLowerCase())}
                    >
                      <Text style={styles.buttonText}>{syncingId === item.id ? "Working..." : "Check In In Person"}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {canUseOnline ? (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={() => performAction(item, "check-in", "online")}
                      disabled={syncingId === item.id || !["open", "active"].includes(String(item.status || "").toLowerCase())}
                    >
                      <Text style={styles.buttonText}>{syncingId === item.id ? "Working..." : "Check In Online"}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#D4AF37",
  },
  title: {
    color: "#D4AF37",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2F2F2F",
    padding: 16,
    marginBottom: 14,
  },
  cardOk: {
    borderColor: "#2E8B57",
  },
  cardWarning: {
    borderColor: "#B56A00",
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardLine: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 7,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: "#2E8B57",
  },
  secondaryButton: {
    backgroundColor: "#1F6FEB",
  },
  refreshButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 11,
    marginBottom: 14,
  },
  refreshButtonText: {
    color: "#D4AF37",
    fontWeight: "700",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
});