import React, { useEffect, useMemo, useState } from "react";
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

import { useAuth } from "../../lib/AuthContext";
import { adminJson, jsonBody } from "../../lib/backendClient";

type WorkerItem = {
  userId?: string;
  workerName?: string;
  workerEmail?: string;
  courtCaseNumber?: string;
  courtName?: string;
  status?: string;
  sentenceHoursOrdered?: number;
  updatedAtIso?: string;
};

type WorkerDetail = {
  item?: WorkerItem | null;
  summary?: {
    totalTrackedHours?: number;
    remainingHours?: number;
    completedShiftCount?: number;
    activeShiftCount?: number;
  } | null;
  shifts?: Array<{
    id: string;
    role?: string;
    status?: string;
    checkedInAtIso?: string;
    checkedOutAtIso?: string;
    totalTrackedSeconds?: number;
  }>;
};

type DashboardSummary = {
  communityServiceWorkersPendingReview?: number;
  communityServiceWorkersApproved?: number;
  communityServiceWorkersSuspended?: number;
  communityServiceActiveShifts?: number;
  communityServiceTrackedHours?: number;
  duiClassTrackedHours?: number;
};

type CaseLookup = {
  caseId?: string;
  totalIndividuals?: number;
  items?: Array<{
    worker?: {
      workerId?: string;
      workerName?: string;
      status?: string;
      sentenceHoursOrdered?: number;
    } | null;
    summary?: {
      combined?: {
        totalTrackedHours?: number;
      } | null;
    } | null;
  }>;
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
  return `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m`;
}

export default function AdminCommunityServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetail | null>(null);
  const [caseId, setCaseId] = useState("");
  const [caseLookup, setCaseLookup] = useState<CaseLookup | null>(null);

  const pendingWorkers = useMemo(() => workers.filter((item) => item.status === "pending_review"), [workers]);
  const recentWorkers = useMemo(() => workers.slice(0, 10), [workers]);

  async function loadWorkers() {
    if (!user) return;
    const [dashboardPayload, workersPayload] = await Promise.all([
      adminJson(user, "/admin/dashboard?limit=20"),
      adminJson(user, "/admin/community-service/workers?limit=100"),
    ]);
    setDashboardSummary(dashboardPayload?.summary || null);
    setWorkers(workersPayload?.items || []);
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadWorkers()
      .catch((error: any) => Alert.alert("Community Service Admin", error?.message || "Unable to load worker data."))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  async function openWorker(workerId: string) {
    if (!user) return;
    setSelectedWorkerId(workerId);
    try {
      const payload = await adminJson(user, `/admin/community-service/workers/${encodeURIComponent(workerId)}`);
      setSelectedWorker(payload);
    } catch (error: any) {
      Alert.alert("Worker Record", error?.message || "Unable to load the worker record.");
    }
  }

  async function runAction(workerId: string, action: string, note: string) {
    if (!user) return;
    setWorking(true);
    try {
      await adminJson(user, `/admin/community-service/workers/${encodeURIComponent(workerId)}/action`, {
        method: "POST",
        body: jsonBody({ action, note }),
      });
      await loadWorkers();
      if (selectedWorkerId === workerId) {
        await openWorker(workerId);
      }
    } catch (error: any) {
      Alert.alert("Worker Action Failed", error?.message || "Unable to update the worker.");
    } finally {
      setWorking(false);
    }
  }

  async function lookupCase() {
    if (!user || !caseId.trim()) return;
    setWorking(true);
    try {
      const payload = await adminJson(user, `/admin/community-service/case/${encodeURIComponent(caseId.trim())}`);
      setCaseLookup(payload);
    } catch (error: any) {
      Alert.alert("Case Lookup Failed", error?.message || "Unable to load that case.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Community Service Admin</Text>
      <Text style={styles.subtitle}>
        Review worker registrations, approve or suspend participants, inspect tracked shift hours, and look up court records by case ID.
      </Text>

      <View style={styles.metricsRow}>
        <MetricCard label="Pending Review" value={String(dashboardSummary?.communityServiceWorkersPendingReview || 0)} />
        <MetricCard label="Approved" value={String(dashboardSummary?.communityServiceWorkersApproved || 0)} />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Suspended" value={String(dashboardSummary?.communityServiceWorkersSuspended || 0)} />
        <MetricCard label="Active Shifts" value={String(dashboardSummary?.communityServiceActiveShifts || 0)} />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Tracked Hours" value={formatHours(dashboardSummary?.communityServiceTrackedHours)} />
        <MetricCard label="DUI Hours" value={formatHours(dashboardSummary?.duiClassTrackedHours)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Case Lookup</Text>
        <TextInput style={styles.input} value={caseId} onChangeText={setCaseId} placeholder="Enter case ID" placeholderTextColor="#777" autoCapitalize="characters" />
        <TouchableOpacity style={styles.primaryButton} disabled={working} onPress={lookupCase}>
          <Text style={styles.primaryButtonText}>Lookup Case Record</Text>
        </TouchableOpacity>
        {caseLookup ? (
          <View style={styles.caseCard}>
            <Text style={styles.caseTitle}>Case {caseLookup.caseId}</Text>
            <Text style={styles.cardLine}>Individuals: {caseLookup.totalIndividuals || 0}</Text>
            {(caseLookup.items || []).map((entry, index) => (
              <View key={entry.worker?.workerId || `${caseLookup.caseId || "case"}-${index}`} style={styles.caseRow}>
                <Text style={styles.caseName}>{entry.worker?.workerName || "Participant"}</Text>
                <Text style={styles.cardLine}>Status: {formatStatus(entry.worker?.status)}</Text>
                <Text style={styles.cardLine}>Combined Hours: {formatHours(entry.summary?.combined?.totalTrackedHours)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workers Pending Review</Text>
        {pendingWorkers.length === 0 ? <Text style={styles.cardLine}>No worker registrations are waiting for review.</Text> : null}
        {pendingWorkers.map((worker) => (
          <View key={worker.userId} style={styles.workerCard}>
            <Text style={styles.workerTitle}>{worker.workerName || worker.workerEmail || worker.userId}</Text>
            <Text style={styles.cardLine}>Case ID: {worker.courtCaseNumber || "Not set"}</Text>
            <Text style={styles.cardLine}>Court: {worker.courtName || "Not set"}</Text>
            <Text style={styles.cardLine}>Hours Ordered: {worker.sentenceHoursOrdered || 0}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.approveButton} disabled={working} onPress={() => runAction(String(worker.userId), "approve", "Approved from community-service dashboard") }>
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} disabled={working} onPress={() => runAction(String(worker.userId), "reject", "Rejected from community-service dashboard") }>
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} disabled={working} onPress={() => openWorker(String(worker.userId)) }>
                <Text style={styles.secondaryButtonText}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Worker Records</Text>
        {recentWorkers.map((worker) => (
          <TouchableOpacity key={worker.userId} style={styles.listRow} onPress={() => openWorker(String(worker.userId))}>
            <View style={{ flex: 1 }}>
              <Text style={styles.workerTitle}>{worker.workerName || worker.workerEmail || worker.userId}</Text>
              <Text style={styles.cardLine}>Status: {formatStatus(worker.status)}</Text>
              <Text style={styles.cardLine}>Updated: {formatDate(worker.updatedAtIso)}</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedWorker?.item ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Worker Detail</Text>
          <Text style={styles.workerTitle}>{selectedWorker.item.workerName || selectedWorker.item.workerEmail || selectedWorker.item.userId}</Text>
          <Text style={styles.cardLine}>Status: {formatStatus(selectedWorker.item.status)}</Text>
          <Text style={styles.cardLine}>Case ID: {selectedWorker.item.courtCaseNumber || "Not set"}</Text>
          <Text style={styles.cardLine}>Tracked Hours: {formatHours(selectedWorker.summary?.totalTrackedHours)}</Text>
          <Text style={styles.cardLine}>Remaining Hours: {formatHours(selectedWorker.summary?.remainingHours)}</Text>
          <Text style={styles.cardLine}>Completed Shifts: {selectedWorker.summary?.completedShiftCount || 0}</Text>
          <Text style={styles.cardLine}>Active Shifts: {selectedWorker.summary?.activeShiftCount || 0}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.approveButton} disabled={working} onPress={() => runAction(String(selectedWorker.item?.userId), "approve", "Approved from worker detail") }>
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} disabled={working} onPress={() => runAction(String(selectedWorker.item?.userId), "unsuspend", "Unsuspended from worker detail") }>
              <Text style={styles.secondaryButtonText}>Unsuspend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.suspendButton} disabled={working} onPress={() => runAction(String(selectedWorker.item?.userId), "suspend", "Suspended from worker detail") }>
              <Text style={styles.suspendButtonText}>Suspend</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Shift Log</Text>
          {(selectedWorker.shifts || []).slice(0, 8).map((shift) => (
            <View key={shift.id} style={styles.shiftRow}>
              <Text style={styles.cardLine}>Role: {formatStatus(shift.role)}</Text>
              <Text style={styles.cardLine}>Status: {formatStatus(shift.status)}</Text>
              <Text style={styles.cardLine}>Start: {formatDate(shift.checkedInAtIso)}</Text>
              <Text style={styles.cardLine}>End: {formatDate(shift.checkedOutAtIso)}</Text>
              <Text style={styles.cardLine}>Tracked: {formatDuration(shift.totalTrackedSeconds)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    gap: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: "#080808",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#C3BDAF",
    fontSize: 14,
    lineHeight: 21,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 16,
    padding: 16,
  },
  metricLabel: {
    color: "#ACA48F",
    fontSize: 12,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#F3E6B7",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 18,
    padding: 16,
    gap: 10,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },
  cardLine: {
    color: "#E5DFD1",
    fontSize: 14,
  },
  caseCard: {
    marginTop: 8,
    backgroundColor: "#101F11",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#355A39",
    padding: 14,
    gap: 8,
  },
  caseTitle: {
    color: "#A6ED8E",
    fontSize: 18,
    fontWeight: "800",
  },
  caseRow: {
    borderTopWidth: 1,
    borderTopColor: "#29422C",
    paddingTop: 8,
    gap: 3,
  },
  caseName: {
    color: "#F5E7B6",
    fontWeight: "700",
  },
  workerCard: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 10,
    gap: 5,
  },
  workerTitle: {
    color: "#F5E7B6",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#214A28",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  approveButtonText: {
    color: "#C9F5C4",
    fontWeight: "800",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#5C2121",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#FFD9D9",
    fontWeight: "800",
  },
  suspendButton: {
    flex: 1,
    backgroundColor: "#70461E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  suspendButtonText: {
    color: "#FFE1B6",
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#23354F",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#EAF3FF",
    fontWeight: "800",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 10,
    gap: 12,
  },
  rowArrow: {
    color: "#7EA7D0",
    fontSize: 20,
  },
  sectionTitle: {
    color: "#D4AF37",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 8,
  },
  shiftRow: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 10,
    gap: 4,
  },
});