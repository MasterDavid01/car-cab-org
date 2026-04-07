import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { useAuth } from "../lib/AuthContext";
import { authJson, jsonBody } from "../lib/backendClient";

type WorkerRegistration = {
  workerName?: string;
  courtCaseNumber?: string;
  courtName?: string;
  sentenceHoursOrdered?: number;
  status?: string;
};

type ShiftItem = {
  id: string;
  role?: string;
  status?: string;
  checkedInAtIso?: string | null;
  checkedOutAtIso?: string | null;
  lastSeenAtIso?: string | null;
  assignedVehicleLabel?: string | null;
  assignmentNote?: string | null;
  totalTrackedSeconds?: number;
  activeSession?: {
    checkedInAtIso?: string | null;
    checkedOutAtIso?: string | null;
    locationLabel?: string | null;
  } | null;
};

type HoursSummary = {
  shiftCount?: number;
  completedShiftCount?: number;
  activeShiftCount?: number;
  totalTrackedHours?: number;
  sentenceHoursOrdered?: number;
  remainingHours?: number;
  byRoleHours?: {
    support_vehicle?: number;
    follow_vehicle?: number;
    observer?: number;
    other?: number;
  } | null;
};

function formatStatus(value?: string | null) {
  return String(value || "unknown").replace(/_/g, " ").toUpperCase();
}

function formatHours(value?: number | null) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDuration(seconds?: number | null) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainderSeconds = total % 60;
  return [hours, minutes, remainderSeconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export default function CommunityServiceShiftScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [registration, setRegistration] = useState<WorkerRegistration | null>(null);
  const [hoursSummary, setHoursSummary] = useState<HoursSummary | null>(null);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [screenLoading, setScreenLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [role, setRole] = useState("support_vehicle");
  const [assignedVehicleLabel, setAssignedVehicleLabel] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const heartbeatInFlight = useRef(false);

  const activeShift = useMemo(
    () => shifts.find((item) => item.status === "active" && item.activeSession?.checkedInAtIso && !item.activeSession?.checkedOutAtIso) || null,
    [shifts]
  );

  async function getLocationPayload() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Location permission is required for GPS-tracked community service hours.");
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    let locationLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = reverse[0];
      if (first) {
        locationLabel = [first.name, first.street, first.city, first.region].filter(Boolean).join(", ");
      }
    } catch {
      // Keep coordinate fallback.
    }

    return {
      latitude,
      longitude,
      locationLabel,
      capturedAtIso: new Date().toISOString(),
    };
  }

  async function loadData() {
    if (!user) {
      setRegistration(null);
      setHoursSummary(null);
      setShifts([]);
      setScreenLoading(false);
      return;
    }

    try {
      setScreenLoading(true);
      const [registrationPayload, hoursPayload, shiftsPayload] = await Promise.all([
        authJson(user, "/community-service/my-registration"),
        authJson(user, "/community-service/my-hours?limit=25"),
        authJson(user, "/community-service/my-shifts?limit=10"),
      ]);
      setRegistration(registrationPayload?.item || null);
      setHoursSummary(hoursPayload?.summary || null);
      setShifts(shiftsPayload?.items || []);
    } catch (error: any) {
      Alert.alert("Community Service Shift", error?.message || "Unable to load your shift data.");
    } finally {
      setScreenLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !activeShift) return;

    const interval = setInterval(() => {
      if (heartbeatInFlight.current) return;
      heartbeatInFlight.current = true;
      sendHeartbeat(activeShift.id)
        .catch(() => undefined)
        .finally(() => {
          heartbeatInFlight.current = false;
        });
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.uid, activeShift?.id]);

  async function startShift() {
    if (!user) {
      Alert.alert("Sign In Required", "Sign in before starting a shift.");
      return;
    }

    setWorking(true);
    try {
      const location = await getLocationPayload();
      await authJson(user, "/community-service/sign-in", {
        method: "POST",
        body: jsonBody({
          role,
          assignedVehicleLabel: assignedVehicleLabel.trim(),
          assignmentNote: assignmentNote.trim(),
          sentenceHoursOrdered: registration?.sentenceHoursOrdered || 0,
          courtCaseNumber: registration?.courtCaseNumber || "",
          courtName: registration?.courtName || "",
          ...location,
        }),
      });
      await loadData();
      Alert.alert("Shift Started", "GPS tracking is active. Keep this screen available so heartbeats continue during the shift.");
    } catch (error: any) {
      Alert.alert("Unable To Start Shift", error?.message || "Shift sign-in failed.");
    } finally {
      setWorking(false);
    }
  }

  async function sendHeartbeat(shiftId?: string) {
    if (!user || !shiftId) return;

    const location = await getLocationPayload();
    await authJson(user, `/community-service/${shiftId}/heartbeat`, {
      method: "POST",
      body: jsonBody(location),
    });
    const hoursPayload = await authJson(user, "/community-service/my-hours?limit=25");
    const shiftsPayload = await authJson(user, "/community-service/my-shifts?limit=10");
    setHoursSummary(hoursPayload?.summary || null);
    setShifts(shiftsPayload?.items || []);
  }

  async function signOutShift() {
    if (!user || !activeShift?.id) return;

    setWorking(true);
    try {
      const location = await getLocationPayload();
      await authJson(user, `/community-service/${activeShift.id}/sign-out`, {
        method: "POST",
        body: jsonBody(location),
      });
      await loadData();
      Alert.alert("Shift Completed", "The shift was signed out and the tracked time has been saved to your record.");
    } catch (error: any) {
      Alert.alert("Unable To Sign Out", error?.message || "Shift sign-out failed.");
    } finally {
      setWorking(false);
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
        <Text style={styles.title}>Community Service Shift Screen</Text>
        <Text style={styles.helperText}>Sign in first to start or manage a tracked shift.</Text>
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

      <Text style={styles.title}>Community Service Shift Tracking</Text>
      <Text style={styles.subtitle}>
        Start the shift on site, allow GPS access, keep the screen available, and sign out at the end so the court record stays current.
      </Text>

      {!registration ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Registration Required</Text>
          <Text style={styles.cardLine}>Complete registration and upload documents before starting tracked hours.</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/community-service") }>
            <Text style={styles.secondaryButtonText}>Open Registration</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {registration ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Worker Status</Text>
          <Text style={styles.cardLine}>Status: {formatStatus(registration.status)}</Text>
          <Text style={styles.cardLine}>Case ID: {registration.courtCaseNumber || "Not set"}</Text>
          <Text style={styles.cardLine}>Court: {registration.courtName || "Not set"}</Text>
          <Text style={styles.cardLine}>Hours Ordered: {registration.sentenceHoursOrdered || 0}</Text>
          {registration.status !== "approved" ? (
            <Text style={styles.blockedText}>Admin approval is required before a shift can be started.</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Tracked Hours</Text>
          <Text style={styles.metricValue}>{formatHours(hoursSummary?.totalTrackedHours)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Remaining</Text>
          <Text style={styles.metricValue}>{formatHours(hoursSummary?.remainingHours)}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Completed Shifts</Text>
          <Text style={styles.metricValue}>{hoursSummary?.completedShiftCount || 0}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Shifts</Text>
          <Text style={styles.metricValue}>{hoursSummary?.activeShiftCount || 0}</Text>
        </View>
      </View>

      {activeShift ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Active Shift Running</Text>
          <Text style={styles.cardLine}>Role: {formatStatus(activeShift.role)}</Text>
          <Text style={styles.cardLine}>Checked In: {formatDate(activeShift.checkedInAtIso || activeShift.activeSession?.checkedInAtIso)}</Text>
          <Text style={styles.cardLine}>Last GPS Ping: {formatDate(activeShift.lastSeenAtIso)}</Text>
          <Text style={styles.cardLine}>Location: {activeShift.activeSession?.locationLabel || "Live coordinate captured"}</Text>
          <Text style={styles.cardLine}>Vehicle: {activeShift.assignedVehicleLabel || "Not assigned"}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} disabled={working} onPress={() => sendHeartbeat(activeShift.id).catch((error: any) => Alert.alert("Heartbeat Failed", error?.message || "Unable to refresh GPS heartbeat."))}>
              <Text style={styles.secondaryButtonText}>Send GPS Heartbeat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} disabled={working} onPress={signOutShift}>
              <Text style={styles.dangerButtonText}>{working ? "Saving..." : "Sign Out Shift"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start New Shift</Text>
          <Text style={styles.cardLine}>Choose the role and optional assignment details, then sign in on site with GPS enabled.</Text>
          <View style={styles.roleRow}>
            {(["support_vehicle", "follow_vehicle", "observer", "other"] as const).map((value) => (
              <TouchableOpacity key={value} style={[styles.roleButton, role === value && styles.roleButtonActive]} onPress={() => setRole(value)}>
                <Text style={styles.roleButtonText}>{formatStatus(value)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={assignedVehicleLabel} onChangeText={setAssignedVehicleLabel} placeholder="Assigned vehicle label" placeholderTextColor="#777" />
          <TextInput style={styles.input} value={assignmentNote} onChangeText={setAssignmentNote} placeholder="Assignment note" placeholderTextColor="#777" multiline />
          <TouchableOpacity style={[styles.primaryButton, (working || registration?.status !== "approved") && styles.buttonDisabled]} disabled={working || registration?.status !== "approved"} onPress={startShift}>
            {working ? <ActivityIndicator color="#111" /> : <Text style={styles.primaryButtonText}>Start GPS Shift</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Shifts</Text>
        {shifts.length === 0 ? <Text style={styles.cardLine}>No shifts recorded yet.</Text> : null}
        {shifts.map((item) => (
          <View key={item.id} style={styles.shiftRow}>
            <Text style={styles.shiftTitle}>{formatStatus(item.role)}</Text>
            <Text style={styles.cardLine}>Status: {formatStatus(item.status)}</Text>
            <Text style={styles.cardLine}>Started: {formatDate(item.checkedInAtIso)}</Text>
            <Text style={styles.cardLine}>Ended: {formatDate(item.checkedOutAtIso)}</Text>
            <Text style={styles.cardLine}>Tracked: {formatDuration(item.totalTrackedSeconds)}</Text>
          </View>
        ))}
      </View>
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
    paddingBottom: 40,
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
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  activeCard: {
    backgroundColor: "#15261A",
    borderWidth: 1,
    borderColor: "#3F7C4A",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  warningCard: {
    backgroundColor: "#2A1A12",
    borderWidth: 1,
    borderColor: "#865C24",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  warningTitle: {
    color: "#FFC978",
    fontSize: 18,
    fontWeight: "800",
  },
  activeTitle: {
    color: "#9EF08A",
    fontSize: 18,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
  },
  cardLine: {
    color: "#E7E0D0",
    fontSize: 14,
  },
  blockedText: {
    color: "#FF8C78",
    fontSize: 14,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#121212",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    padding: 16,
  },
  metricLabel: {
    color: "#AAA28F",
    fontSize: 12,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#F6E7B8",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  roleButtonActive: {
    backgroundColor: "#23354F",
    borderColor: "#4F7AB3",
  },
  roleButtonText: {
    color: "#F1E6C8",
    fontWeight: "700",
    fontSize: 12,
  },
  input: {
    backgroundColor: "#0D0D0D",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#23354F",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#EAF3FF",
    fontWeight: "800",
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#5A1F1F",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#FFDCDC",
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  helperText: {
    color: "#CBC3B0",
    textAlign: "center",
    lineHeight: 21,
    marginVertical: 14,
  },
  shiftRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    gap: 4,
  },
  shiftTitle: {
    color: "#F3E6B8",
    fontSize: 15,
    fontWeight: "700",
  },
});