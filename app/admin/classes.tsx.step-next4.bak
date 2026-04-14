import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { buildApiUrl } from "../../lib/apiBase";
import { useAuth } from "../../lib/AuthContext";

type DuiClassItem = {
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
  participantCount?: number | null;
  activeParticipantCount?: number | null;
  certificateEligibleCount?: number | null;
  raw?: any;
};

function formatStatus(value?: string | null) {
  return String(value || "unknown").replace(/_/g, " ").toUpperCase();
}

export default function AdminClassesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { focusClassId } = useLocalSearchParams<{ focusClassId?: string }>();
  const rosterScrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<DuiClassItem[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [rosterClassTitle, setRosterClassTitle] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "DUI Class",
    description: "Court-support DUI education session included for active 12-month members.",
    startsAtIso: new Date().toISOString(),
    endsAtIso: "",
    deliveryMode: "hybrid",
    requiredAttendanceMinutes: "60",
    locationName: "",
    locationAddress: "",
    onlineJoinUrl: "",
  });

  async function adminApi(path: string, options?: RequestInit) {
    if (!user) {
      throw new Error("admin_auth_required");
    }

    const idToken = await user.getIdToken();
    let response: Response;
    try {
      response = await fetch(buildApiUrl(path), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "x-admin-user": user.email || user.uid,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      throw new Error("admin_class_api_unreachable");
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || `admin_class_api_${response.status}`);
    }

    return payload;
  }

  async function loadClasses() {
    try {
      setLoading(true);
      const payload = await adminApi("/admin/dui-classes?limit=25");
      setItems(payload?.items || []);
    } catch (error: any) {
      Alert.alert("DUI Class Manager", error?.message || "Unable to load DUI class records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses().catch(() => undefined);
  }, [user?.uid]);

  function classPayload(source?: Partial<DuiClassItem>) {
    return {
      title: source?.title || form.title,
      description: source?.description || form.description,
      deliveryMode: source?.deliveryMode || form.deliveryMode,
      startsAtIso: source?.startsAtIso || form.startsAtIso,
      endsAtIso: source?.endsAtIso || form.endsAtIso || undefined,
      requiredAttendanceMinutes: Number(source?.requiredAttendanceMinutes || form.requiredAttendanceMinutes || 60),
      locationName: source?.locationName || form.locationName,
      locationAddress: source?.locationAddress || form.locationAddress,
      onlineJoinUrl: source?.onlineJoinUrl || form.onlineJoinUrl,
      status: source?.status || "scheduled",
    };
  }

  async function createClass() {
    try {
      setSaving(true);
      await adminApi("/admin/dui-classes", {
        method: "POST",
        body: JSON.stringify(classPayload()),
      });

      setForm((current) => ({
        ...current,
        title: "DUI Class",
        description: "Court-support DUI education session included for active 12-month members.",
        startsAtIso: new Date().toISOString(),
        endsAtIso: "",
        locationName: "",
        locationAddress: "",
        onlineJoinUrl: "",
      }));
      await loadClasses();
    } catch (error: any) {
      Alert.alert("Create Class Failed", error?.message || "Unable to create the DUI class.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: DuiClassItem, status: string) {
    try {
      await adminApi(`/admin/dui-classes/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          classData: {
            ...classPayload(item),
            status,
          },
          note: `Status changed to ${status}`,
        }),
      });
      await loadClasses();
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update the class right now.");
    }
  }

  async function loadParticipants(classId: string, classTitle?: string | null) {
    try {
      const payload = await adminApi(`/admin/dui-classes/${classId}/participants`);
      setReport(payload);
      setRosterClassTitle(classTitle || payload?.classItem?.title || null);
    } catch (error: any) {
      Alert.alert("Participant Report Failed", error?.message || "Unable to load class participants.");
    }
  }

  // Auto-load roster when navigated here from Control Board with a focusClassId param
  useEffect(() => {
    if (!focusClassId || loading) return;
    const match = items.find((i) => i.id === focusClassId);
    loadParticipants(focusClassId, match?.title)
      .then(() => {
        // Give the layout a moment to render the roster card before scrolling
        setTimeout(() => rosterScrollRef.current?.scrollToEnd({ animated: true }), 300);
      })
      .catch(() => undefined);
  }, [focusClassId, loading]);

  return (
    <ScrollView ref={rosterScrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>DUI Class Manager</Text>
      <Text style={styles.subtitle}>
        Create DUI classes, open or complete attendance windows, and review participant rosters for certification.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create New Class</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Class title" placeholderTextColor="#888888" />
        <TextInput style={styles.input} value={form.description} onChangeText={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="Description" placeholderTextColor="#888888" multiline />
        <TextInput style={styles.input} value={form.startsAtIso} onChangeText={(value) => setForm((current) => ({ ...current, startsAtIso: value }))} placeholder="Starts ISO" placeholderTextColor="#888888" autoCapitalize="none" />
        <TextInput style={styles.input} value={form.endsAtIso} onChangeText={(value) => setForm((current) => ({ ...current, endsAtIso: value }))} placeholder="Ends ISO" placeholderTextColor="#888888" autoCapitalize="none" />
        <TextInput style={styles.input} value={form.requiredAttendanceMinutes} onChangeText={(value) => setForm((current) => ({ ...current, requiredAttendanceMinutes: value }))} placeholder="Required attendance minutes" placeholderTextColor="#888888" keyboardType="numeric" />
        <TextInput style={styles.input} value={form.locationName} onChangeText={(value) => setForm((current) => ({ ...current, locationName: value }))} placeholder="Location name" placeholderTextColor="#888888" />
        <TextInput style={styles.input} value={form.locationAddress} onChangeText={(value) => setForm((current) => ({ ...current, locationAddress: value }))} placeholder="Location address" placeholderTextColor="#888888" />
        <TextInput style={styles.input} value={form.onlineJoinUrl} onChangeText={(value) => setForm((current) => ({ ...current, onlineJoinUrl: value }))} placeholder="Online join URL" placeholderTextColor="#888888" autoCapitalize="none" />

        <View style={styles.modeRow}>
          {(["in_person", "online", "hybrid"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeButton, form.deliveryMode === mode && styles.modeButtonSelected]}
              onPress={() => setForm((current) => ({ ...current, deliveryMode: mode }))}
            >
              <Text style={styles.modeButtonText}>{formatStatus(mode)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={createClass} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? "Creating..." : "Create DUI Class"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Published Classes</Text>
        {loading ? <Text style={styles.cardLine}>Loading classes...</Text> : null}
        {!loading && items.length === 0 ? <Text style={styles.cardLine}>No classes created yet.</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={styles.classCard}>
            <Text style={styles.classTitle}>{item.title || "DUI Class"}</Text>
            <Text style={styles.cardLine}>Status: {formatStatus(item.status)}</Text>
            <Text style={styles.cardLine}>Format: {formatStatus(item.deliveryMode || "hybrid")}</Text>
            <Text style={styles.cardLine}>Starts: {item.startsAtIso || "Not set"}</Text>
            <Text style={styles.cardLine}>Participants: {Number(item.participantCount || 0)}</Text>
            <Text style={styles.cardLine}>Checked In: {Number(item.activeParticipantCount || 0)}</Text>
            <Text style={styles.cardLine}>Certification Ready: {Number(item.certificateEligibleCount || 0)}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, styles.openButton]} onPress={() => updateStatus(item, "open")}>
                <Text style={styles.actionButtonText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={() => updateStatus(item, "closed")}>
                <Text style={styles.actionButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => updateStatus(item, "completed")}>
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => loadParticipants(item.id, item.title)}>
              <Text style={styles.secondaryButtonText}>Load Participant Roster</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {report ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Attendee Roster{rosterClassTitle ? ` — ${rosterClassTitle}` : ""}
          </Text>
          <Text style={styles.cardLine}>Class: {report?.classItem?.title || "DUI Class"}</Text>
          <Text style={styles.cardLine}>Participants: {Number(report?.summary?.participantCount || 0)}</Text>
          <Text style={styles.cardLine}>Checked In Now: {Number(report?.summary?.checkedInNow || 0)}</Text>
          <Text style={styles.cardLine}>Certification Ready: {Number(report?.summary?.certificateEligibleCount || 0)}</Text>
          <Text style={styles.cardLine}>Total Tracked Minutes: {Number(report?.summary?.totalTrackedMinutes || 0)}</Text>

          {(report?.items || []).length === 0 ? (
            <Text style={[styles.cardLine, { marginTop: 8, fontStyle: "italic" }]}>No attendees have checked in to this class yet.</Text>
          ) : null}

          {(report?.items || []).map((item: any) => (
            <View key={item.id} style={styles.participantCard}>
              <Text style={styles.classTitle}>{item.customerName || item.customerEmail || item.userId}</Text>
              {item.attendeeId ? (
                <Text style={[styles.cardLine, { color: "#D4AF37", fontWeight: "700" }]}>Attendee ID: {item.attendeeId}</Text>
              ) : null}
              {item.customerEmail ? <Text style={styles.cardLine}>Email: {item.customerEmail}</Text> : null}
              <Text style={styles.cardLine}>Status: {formatStatus(item.lastStatus)}</Text>
              <Text style={styles.cardLine}>Mode: {formatStatus(item.attendanceMode)}</Text>
              <Text style={styles.cardLine}>Tracked Minutes: {Number(item.totalTrackedMinutes || 0)}</Text>
              <Text style={styles.cardLine}>Sessions: {Number(item.sessionCount || 0)}</Text>
              <Text style={styles.cardLine}>Certification Ready: {item.certificateEligible ? "YES — Certificate Eligible" : "NO"}</Text>
              {item.lastSeenAtIso ? <Text style={styles.cardLine}>Last Seen: {item.lastSeenAtIso}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#D4AF37",
    fontSize: 28,
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
  input: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeButtonSelected: {
    borderColor: "#D4AF37",
    backgroundColor: "#1A1A1A",
  },
  modeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#1F6FEB",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  classCard: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 12,
    marginTop: 12,
  },
  classTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  openButton: {
    backgroundColor: "#2E8B57",
  },
  closeButton: {
    backgroundColor: "#B56A00",
  },
  completeButton: {
    backgroundColor: "#8B0000",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  secondaryButtonText: {
    color: "#D4AF37",
    fontWeight: "700",
    fontSize: 13,
  },
  participantCard: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 12,
    marginTop: 12,
  },
});