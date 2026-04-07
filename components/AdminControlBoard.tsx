import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";

import { buildApiUrl } from "../lib/apiBase";
import { useAuth } from "../lib/AuthContext";

type RetrievalRecord = {
  id: string;
  raw?: any;
  pickup?: string;
  dropoff?: string;
  lockedHomeAddress?: string;
  status?: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
  updatedAt?: { seconds?: number; nanoseconds?: number } | null;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverNumber?: string | null;
  assignedDriverProfilePhotoUrl?: string | null;
  adminReviewStatus?: string;
  diverted?: boolean;
  divertReason?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerProfilePhotoUrl?: string | null;
  evidence?: any;
  pricing?: any;
  detour?: any;
  billing?: any;
  incident?: any;
  adminOverride?: any;
  statusTimestamps?: any;
  tracking?: any;
  assignment?: any;
  currentLocation?: { latitude?: number; longitude?: number } | null;
  pickupLocation?: { latitude?: number; longitude?: number } | null;
  dropoffLocation?: { latitude?: number; longitude?: number } | null;
};

type DriverRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profilePhotoUrl?: string | null;
  employeeDriverNumber?: string | null;
  driverNumber?: string | null;
  backgroundCheck?: any;
  eligibility?: any;
  availability?: any;
  currentLocation?: { latitude?: number; longitude?: number } | null;
  onboarding?: any;
  updatedAt?: { seconds?: number; nanoseconds?: number } | null;
};

type CustomerRecord = {
  id: string;
  userName?: string | null;
  userEmail?: string | null;
  homeAddress?: string | null;
  serviceStatus?: string | null;
  suspensionReason?: string | null;
  docs?: any;
  paymentProfile?: any;
  membershipBilling?: any;
  billingHold?: any;
  updatedAt?: { seconds?: number; nanoseconds?: number } | null;
  updatedAtIso?: string | null;
};

type DuiClassSummary = {
  id: string;
  title?: string | null;
  status?: string | null;
  deliveryMode?: string | null;
  startsAtIso?: string | null;
  endsAtIso?: string | null;
  requiredAttendanceMinutes?: number | null;
  participantCount?: number | null;
  activeParticipantCount?: number | null;
  certificateEligibleCount?: number | null;
  locationName?: string | null;
  locationAddress?: string | null;
  onlineJoinUrl?: string | null;
  raw?: any;
};

type CommunityServiceWorkerSummary = {
  userId?: string | null;
  workerName?: string | null;
  workerEmail?: string | null;
  courtCaseNumber?: string | null;
  status?: string | null;
  sentenceHoursOrdered?: number | null;
};

type CommunityServiceShiftSummary = {
  id: string;
  role?: string | null;
  status?: string | null;
  offenderName?: string | null;
  checkedInAtIso?: string | null;
  totalTrackedSeconds?: number | null;
};

function asMillis(value: any) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

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

function formatStatus(value?: string | null) {
  return String(value || "unknown").replace(/_/g, " ").toUpperCase();
}

function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function fallbackDriverNumber(driverId: string) {
  const normalized = String(driverId || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `DRV-${normalized.slice(0, 8).padEnd(8, "0")}`;
}

function collectVehiclePhotos(request: RetrievalRecord) {
  const before = request.evidence?.vehicle?.before || {};
  const after = request.evidence?.vehicle?.after || {};
  return [
    ["Before Front", before.front?.fileURL || before.front?.localUri || null],
    ["Before Driver Side", before.driverSide?.fileURL || before.driverSide?.localUri || null],
    ["Before Passenger Side", before.passengerSide?.fileURL || before.passengerSide?.localUri || null],
    ["Before Rear", before.rear?.fileURL || before.rear?.localUri || null],
    ["After Front", after.front?.fileURL || after.front?.localUri || null],
    ["After Driver Side", after.driverSide?.fileURL || after.driverSide?.localUri || null],
    ["After Passenger Side", after.passengerSide?.fileURL || after.passengerSide?.localUri || null],
    ["After Rear", after.rear?.fileURL || after.rear?.localUri || null],
  ].filter((item) => Boolean(item[1]));
}

function normalizeCoordinate(candidate: any) {
  if (!candidate) return null;
  const latitude = Number(candidate.latitude ?? candidate.lat ?? candidate._latitude);
  const longitude = Number(candidate.longitude ?? candidate.lng ?? candidate.lon ?? candidate._longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function firstCoordinate(...candidates: any[]) {
  for (const candidate of candidates) {
    const parsed = normalizeCoordinate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function buildMapRegion(points: Array<{ latitude: number; longitude: number }>) {
  if (!points.length) {
    return {
      latitude: 39.0997,
      longitude: -94.5786,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    };
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitudeDelta = Math.max(0.02, (maxLat - minLat) * 1.4 || 0.02);
  const longitudeDelta = Math.max(0.02, (maxLng - minLng) * 1.4 || 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

function markerPinColor(kind: string) {
  switch (kind) {
    case "pickup":
      return "#2E8B57";
    case "dropoff":
      return "#B56A00";
    case "driver":
      return "#1F6FEB";
    case "roster":
      return "#8A63D2";
    default:
      return "#D4AF37";
  }
}

export default function AdminControlBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [retrievals, setRetrievals] = useState<RetrievalRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [duiClasses, setDuiClasses] = useState<DuiClassSummary[]>([]);
  const [communityWorkers, setCommunityWorkers] = useState<CommunityServiceWorkerSummary[]>([]);
  const [communityShifts, setCommunityShifts] = useState<CommunityServiceShiftSummary[]>([]);
  const [communitySummary, setCommunitySummary] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [systemTestRunning, setSystemTestRunning] = useState(false);
  const [systemDiagnostics, setSystemDiagnostics] = useState<any | null>(null);

  const adminUser = process.env.EXPO_PUBLIC_ADMIN_USER || "admin-control-board";
  const adminTestEmail = process.env.EXPO_PUBLIC_ADMIN_TEST_EMAIL || process.env.EXPO_PUBLIC_ADMIN_EMAIL || "";
  const adminTestPhone = process.env.EXPO_PUBLIC_ADMIN_TEST_PHONE || "";

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fromDashboardRetrieval = (item: any): RetrievalRecord => {
      const raw = item?.raw || {};
      return {
        id: String(item?.id || raw?.id || ""),
        ...raw,
        status: raw?.status || item?.status,
        assignedDriverId: raw?.assignedDriverId || item?.assignedDriverId,
        assignedDriverName: raw?.assignedDriverName || item?.assignedDriverName,
        assignedDriverNumber: raw?.assignedDriverNumber || item?.assignedDriverNumber,
        customerId: raw?.customerId || item?.customerId,
        customerName: raw?.customerName || item?.customerName,
      };
    };

    const fromDashboardDriver = (item: any): DriverRecord => {
      const raw = item?.raw || {};
      return {
        id: String(item?.id || raw?.id || ""),
        ...raw,
        name: raw?.name || item?.name,
        email: raw?.email || item?.email,
        phone: raw?.phone || item?.phone,
        employeeDriverNumber: raw?.employeeDriverNumber || item?.employeeDriverNumber,
        backgroundCheck: raw?.backgroundCheck || { status: item?.backgroundStatus || "unknown" },
        eligibility: raw?.eligibility || {
          status: item?.driverApproved ? "approved" : item?.deniedAsDriver ? "denied" : "pending_review",
          driverApproved: Boolean(item?.driverApproved),
          deniedAsDriver: Boolean(item?.deniedAsDriver),
        },
        availability: raw?.availability || { isAvailable: Boolean(item?.availability) },
      };
    };

    const fromDashboardCustomer = (item: any): CustomerRecord => {
      const raw = item?.raw || {};
      return {
        id: String(item?.id || raw?.id || ""),
        ...raw,
        userName: raw?.userName || item?.userName,
        userEmail: raw?.userEmail || item?.userEmail,
        serviceStatus: raw?.serviceStatus || item?.serviceStatus,
        suspensionReason: raw?.suspensionReason || item?.suspensionReason,
        billingHold: raw?.billingHold || { active: Boolean(item?.billingHold) },
      };
    };

    const fromDuiClass = (item: any): DuiClassSummary => ({
      id: String(item?.id || ""),
      title: item?.title,
      status: item?.status,
      deliveryMode: item?.deliveryMode,
      startsAtIso: item?.startsAtIso,
      endsAtIso: item?.endsAtIso,
      requiredAttendanceMinutes: Number(item?.requiredAttendanceMinutes || 0),
      participantCount: Number(item?.participantCount || 0),
      activeParticipantCount: Number(item?.activeParticipantCount || 0),
      certificateEligibleCount: Number(item?.certificateEligibleCount || 0),
      locationName: item?.locationName,
      locationAddress: item?.locationAddress,
      onlineJoinUrl: item?.onlineJoinUrl,
      raw: item?.raw || null,
    });

    const loadDashboard = async () => {
      try {
        const [payload, classesPayload] = await Promise.all([
          adminApi("/admin/dashboard?limit=100"),
          adminApi("/admin/dui-classes?limit=10"),
        ]);
        if (cancelled) return;

        const nextRetrievals = (payload?.recent?.retrievals || []).map(fromDashboardRetrieval);
        const nextDrivers = (payload?.recent?.drivers || []).map(fromDashboardDriver);
        const nextCustomers = (payload?.recent?.customers || []).map(fromDashboardCustomer);
        const nextClasses = (classesPayload?.items || []).map(fromDuiClass);
        const nextCommunityWorkers = (payload?.recent?.communityServiceWorkers || []).map((item: any) => ({
          userId: item?.userId || item?.id || null,
          workerName: item?.workerName || null,
          workerEmail: item?.workerEmail || null,
          courtCaseNumber: item?.courtCaseNumber || null,
          status: item?.status || null,
          sentenceHoursOrdered: Number(item?.sentenceHoursOrdered || 0),
        }));
        const nextCommunityShifts = (payload?.recent?.communityServiceShifts || []).map((item: any) => ({
          id: String(item?.id || ""),
          role: item?.role || null,
          status: item?.status || null,
          offenderName: item?.offenderName || null,
          checkedInAtIso: item?.checkedInAtIso || null,
          totalTrackedSeconds: Number(item?.totalTrackedSeconds || 0),
        }));

        setRetrievals(nextRetrievals);
        setDrivers(nextDrivers);
        setCustomers(nextCustomers);
        setDuiClasses(nextClasses);
        setCommunityWorkers(nextCommunityWorkers);
        setCommunityShifts(nextCommunityShifts);
        setCommunitySummary(payload?.summary || null);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load admin dashboard data:", error);
        }
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, refreshKey]);

  const retrievalMetrics = useMemo(() => {
    const activeStatuses = new Set(["pending_assignment", "en_route", "arrived", "in_progress", "admin_diverted"]);
    return {
      total: retrievals.length,
      active: retrievals.filter((item) => activeStatuses.has(String(item.status || ""))).length,
      detours: retrievals.filter((item) => String(item.detour?.status || "idle") === "approved").length,
      adminReview: retrievals.filter((item) => String(item.adminReviewStatus || "unreviewed") !== "unreviewed").length,
      blockedCharges: retrievals.filter((item) => String(item.billing?.chargeStatus || "") === "blocked_violence_review").length,
    };
  }, [retrievals]);

  const driverMetrics = useMemo(() => ({
    total: drivers.length,
    approved: drivers.filter((item) => String(item.eligibility?.status || item.backgroundCheck?.status || "") === "approved").length,
    pending: drivers.filter((item) => {
      const status = String(item.eligibility?.status || item.backgroundCheck?.status || "pending_review");
      return !["approved", "denied"].includes(status);
    }).length,
    denied: drivers.filter((item) => String(item.eligibility?.status || item.backgroundCheck?.status || "") === "denied").length,
    available: drivers.filter((item) => item.availability?.isAvailable === true).length,
  }), [drivers]);

  const customerMetrics = useMemo(() => ({
    total: customers.length,
    active: customers.filter((item) => String(item.serviceStatus || "") === "active").length,
    suspended: customers.filter((item) => String(item.serviceStatus || "") === "suspended").length,
    billingHold: customers.filter((item) => item.billingHold?.active === true).length,
  }), [customers]);

  const pendingDrivers = useMemo(
    () => drivers.filter((item) => {
      const status = String(item.eligibility?.status || item.backgroundCheck?.status || "pending_review");
      return !["approved", "denied"].includes(status);
    }),
    [drivers]
  );

  const activeRetrievals = useMemo(
    () => retrievals.filter((item) => !["completed", "cancelled"].includes(String(item.status || ""))),
    [retrievals]
  );

  const liveMapMarkers = useMemo(() => {
    const markers: Array<{ id: string; title: string; description?: string; coordinate: { latitude: number; longitude: number }; kind: string }> = [];

    activeRetrievals.forEach((request) => {
      const pickupCoordinate = firstCoordinate(
        request.pickupLocation,
        request.tracking?.pickupLocation,
        request.assignment?.pickupLocation,
        request.raw?.pickupLocation,
        request.raw?.tracking?.pickupLocation,
        request.raw?.assignment?.pickupLocation
      );
      if (pickupCoordinate) {
        markers.push({
          id: `${request.id}-pickup`,
          title: `Pickup ${request.id.slice(0, 6)}`,
          description: request.pickup || request.customerName || "Retrieval pickup",
          coordinate: pickupCoordinate,
          kind: "pickup",
        });
      }

      const dropoffCoordinate = firstCoordinate(
        request.dropoffLocation,
        request.tracking?.dropoffLocation,
        request.assignment?.dropoffLocation,
        request.raw?.dropoffLocation,
        request.raw?.tracking?.dropoffLocation,
        request.raw?.assignment?.dropoffLocation
      );
      if (dropoffCoordinate) {
        markers.push({
          id: `${request.id}-dropoff`,
          title: `Dropoff ${request.id.slice(0, 6)}`,
          description: request.lockedHomeAddress || request.dropoff || "Retrieval dropoff",
          coordinate: dropoffCoordinate,
          kind: "dropoff",
        });
      }

      const driverCoordinate = firstCoordinate(
        request.currentLocation,
        request.tracking?.currentLocation,
        request.assignment?.driverLocation,
        request.raw?.currentLocation,
        request.raw?.tracking?.currentLocation,
        request.raw?.assignment?.driverLocation
      );
      if (driverCoordinate) {
        markers.push({
          id: `${request.id}-driver`,
          title: `Driver ${request.id.slice(0, 6)}`,
          description: request.assignedDriverName || request.assignedDriverId || "Assigned driver",
          coordinate: driverCoordinate,
          kind: "driver",
        });
      }
    });

    drivers.forEach((driver) => {
      const coordinate = firstCoordinate(driver.currentLocation);
      if (!coordinate) return;
      markers.push({
        id: `${driver.id}-driver-roster`,
        title: driver.name || driver.email || `Driver ${driver.id.slice(0, 6)}`,
        description: driver.availability?.isAvailable ? "Available" : "Offline",
        coordinate,
        kind: "roster",
      });
    });

    return markers;
  }, [activeRetrievals, drivers]);

  const liveMapRegion = useMemo(
    () => buildMapRegion(liveMapMarkers.map((marker) => marker.coordinate)),
    [liveMapMarkers]
  );

  const docsReviewCustomers = useMemo(
    () => customers.filter((item) => item.docs || item.serviceStatus === "suspended"),
    [customers]
  );

  async function adminApi(path: string, options?: RequestInit) {
    if (!user) {
      throw new Error("admin_auth_required");
    }

    const idToken = await user.getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      "x-admin-user": adminUser,
      ...(options?.headers as Record<string, string>),
    };

    let response: Response;
    try {
      response = await fetch(buildApiUrl(path), {
        ...options,
        headers,
      });
    } catch (networkError) {
      throw new Error("admin_api_unreachable: unable to reach backend. Check EXPO_PUBLIC_API_BASE_URL and network connection.");
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      if (response.status === 408 || response.status === 503) {
        throw new Error("admin_api_unreachable: backend timed out. Verify the backend URL and tunnel/LAN connectivity.");
      }
      throw new Error(payload?.error || `admin_api_${response.status}`);
    }

    return payload;
  }

  async function patchRetrieval(requestId: string, updates: Record<string, unknown>, successMessage: string) {
    try {
      await adminApi(`/admin/retrievals/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({
          updates,
          note: successMessage,
        }),
      });
      setRefreshKey((value) => value + 1);
      Alert.alert("Updated", successMessage);
    } catch (error: any) {
      console.error("Admin retrieval patch failed:", error);
      Alert.alert("Update Failed", error?.message || "Unable to update this retrieval right now.");
    }
  }

  async function retrievalAction(
    requestId: string,
    action: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    try {
      await adminApi(`/admin/retrievals/${requestId}/action`, {
        method: "POST",
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });
      setRefreshKey((value) => value + 1);
      Alert.alert("Updated", successMessage);
    } catch (error: any) {
      console.error("Admin retrieval action failed:", error);
      Alert.alert("Update Failed", error?.message || "Unable to run this retrieval action right now.");
    }
  }

  async function driverAction(driverId: string, action: string, note: string, successMessage: string) {
    try {
      await adminApi(`/admin/drivers/${driverId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
      setRefreshKey((value) => value + 1);
      Alert.alert("Driver Updated", successMessage);
    } catch (error: any) {
      console.error("Driver action failed:", error);
      Alert.alert("Update Failed", error?.message || "Unable to update this driver right now.");
    }
  }

  async function customerAction(customerId: string, action: string, note: string, successMessage: string) {
    try {
      await adminApi(`/admin/customers/${customerId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
      setRefreshKey((value) => value + 1);
      Alert.alert("Customer Updated", successMessage);
    } catch (error: any) {
      console.error("Customer action failed:", error);
      Alert.alert("Update Failed", error?.message || "Unable to update this customer right now.");
    }
  }

  async function runSystemDiagnostics(sendLiveMessages: boolean) {
    try {
      setSystemTestRunning(true);
      const payload = await adminApi("/admin/testing/run", {
        method: "POST",
        body: JSON.stringify({
          sendLiveMessages,
          testEmail: adminTestEmail || undefined,
          testPhone: adminTestPhone || undefined,
        }),
      });

      setSystemDiagnostics(payload);
      Alert.alert(
        payload?.overallOk ? "Diagnostics Complete" : "Diagnostics Need Attention",
        payload?.overallOk
          ? "All configured integration checks passed."
          : "One or more integrations failed. See System Integration Test results."
      );
    } catch (error: any) {
      console.error("System diagnostics failed:", error);
      Alert.alert("Diagnostics Failed", error?.message || "Unable to run diagnostics right now.");
    } finally {
      setSystemTestRunning(false);
    }
  }

  async function runAdminOverride(
    request: RetrievalRecord,
    options: { chargeCustomer: boolean; violence: boolean; reason: string }
  ) {
    if (options.violence) {
      await retrievalAction(request.id, "violence_hold", { note: options.reason }, "Violence hold applied and charging blocked pending review.");
      return;
    }

    await retrievalAction(
      request.id,
      options.chargeCustomer ? "complete" : "waive_charge",
      {
        note: options.reason,
        chargeCustomer: options.chargeCustomer,
        chargeAmount: Number(request.pricing?.totalCharge || 0),
        currency: String(request.pricing?.currency || "USD"),
      },
      options.chargeCustomer
        ? "Retrieval completed and charge attempted."
        : "Retrieval completed and charge waived."
    );
  }

  function requiresQuitOverride(request: RetrievalRecord) {
    return (
      request.adminOverride?.required === true ||
      request.adminReviewStatus === "driver_quit_review" ||
      request.incident?.type === "driver_quit"
    );
  }

  function clearDriver(driver: DriverRecord) {
    const number = driver.employeeDriverNumber || driver.driverNumber || fallbackDriverNumber(driver.id);
    return driverAction(driver.id, "clear_background", `Cleared as ${number}`, `Driver cleared for assignments as ${number}.`);
  }

  function holdDriver(driver: DriverRecord) {
    return driverAction(driver.id, "hold", "Manual review hold", "Driver moved back into admin review and taken offline.");
  }

  function denyDriver(driver: DriverRecord) {
    return driverAction(driver.id, "deny", "Denied by admin", "Driver denied and removed from availability.");
  }

  function deactivateDriver(driver: DriverRecord) {
    return driverAction(driver.id, "set_unavailable", "Set offline by admin", "Driver marked unavailable.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Control Board</Text>
      <Text style={styles.subtitle}>
        Run retrieval operations end to end, watch every active job, intervene live, and clear or deny driver background reviews.
      </Text>

      <SectionHeader
        title="System Integration Test"
        subtitle="Validate Firebase, Stripe, Twilio, SendGrid, and receipt/identity pipeline from this board."
      />

      <View style={styles.card}>
        <Text style={styles.cardLine}>Safe diagnostics do not send customer-facing messages.</Text>
        <Text style={styles.cardLine}>Live send test can send real Twilio/SENDGRID test messages using configured test contacts.</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.overrideButton]}
            onPress={() => runSystemDiagnostics(false)}
            disabled={systemTestRunning}
          >
            <Text style={styles.actionButtonText}>{systemTestRunning ? "Running..." : "Run Safe Diagnostics"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
            onPress={() => runSystemDiagnostics(true)}
            disabled={systemTestRunning}
          >
            <Text style={styles.actionButtonText}>{systemTestRunning ? "Running..." : "Run Live Send Test"}</Text>
          </TouchableOpacity>
        </View>

        {systemDiagnostics ? (
          <View style={styles.testPanel}>
            <Text style={styles.testTitle}>Last Run: {String(systemDiagnostics.generatedAtIso || "unknown")}</Text>
            <TestRow label="Overall" ok={Boolean(systemDiagnostics.overallOk)} />
            <TestRow label="Firebase" ok={Boolean(systemDiagnostics.integrations?.firebase?.ok)} />
            <TestRow label="Stripe" ok={Boolean(systemDiagnostics.integrations?.stripe?.ok)} />
            <TestRow label="Twilio" ok={Boolean(systemDiagnostics.integrations?.twilio?.ok)} />
            <TestRow label="SendGrid" ok={Boolean(systemDiagnostics.integrations?.sendGrid?.ok)} />
            <TestRow label="Retrieval Pipeline" ok={Boolean(systemDiagnostics.integrations?.retrievalPipeline?.ok)} />
            {!adminTestPhone ? <Text style={styles.helperText}>Tip: set EXPO_PUBLIC_ADMIN_TEST_PHONE for live Twilio tests.</Text> : null}
            {!adminTestEmail ? <Text style={styles.helperText}>Tip: set EXPO_PUBLIC_ADMIN_TEST_EMAIL for live SendGrid tests.</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Active Retrievals" value={String(retrievalMetrics.active)} accent="#FFD700" />
        <MetricCard label="Admin Review" value={String(retrievalMetrics.adminReview)} accent="#FF8C42" />
        <MetricCard label="Approved Drivers" value={String(driverMetrics.approved)} accent="#2E8B57" />
        <MetricCard label="Pending Drivers" value={String(driverMetrics.pending)} accent="#1F6FEB" />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Detours Running" value={String(retrievalMetrics.detours)} accent="#B56A00" />
        <MetricCard label="Blocked Charges" value={String(retrievalMetrics.blockedCharges)} accent="#8B0000" />
        <MetricCard label="Active Customers" value={String(customerMetrics.active)} accent="#A3C957" />
        <MetricCard label="Suspended Customers" value={String(customerMetrics.suspended)} accent="#8B2E2E" />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Available Drivers" value={String(driverMetrics.available)} accent="#57C7FF" />
        <MetricCard label="Denied Drivers" value={String(driverMetrics.denied)} accent="#8B2E2E" />
        <MetricCard label="Customer Billing Holds" value={String(customerMetrics.billingHold)} accent="#5A5A5A" />
        <MetricCard label="Total Customers" value={String(customerMetrics.total)} accent="#FFD700" />
      </View>

      <SectionHeader
        title="Community Service Oversight"
        subtitle="Track worker approvals, live service hours, and case-linked records from the admin dashboard."
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="Pending Workers" value={String(communitySummary?.communityServiceWorkersPendingReview || 0)} accent="#FF8C42" />
        <MetricCard label="Approved Workers" value={String(communitySummary?.communityServiceWorkersApproved || 0)} accent="#2E8B57" />
        <MetricCard label="Active Shifts" value={String(communitySummary?.communityServiceActiveShifts || 0)} accent="#1F6FEB" />
        <MetricCard label="Tracked Hours" value={String(Number(communitySummary?.communityServiceTrackedHours || 0).toFixed(2))} accent="#D4AF37" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLine}>Community service registrations and GPS-tracked shifts are now available in the admin area.</Text>
        <Text style={styles.cardLine}>Use the dedicated screen to approve workers, inspect shift logs, and search by court case number.</Text>
        <TouchableOpacity style={[styles.actionButton, styles.overrideButton]} onPress={() => router.push("/admin/community-service")}>
          <Text style={styles.actionButtonText}>Open Community Service Admin</Text>
        </TouchableOpacity>
      </View>

      {communityWorkers.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Worker Registrations</Text>
          {communityWorkers.slice(0, 4).map((item) => (
            <View key={String(item.userId || item.workerEmail || item.workerName)} style={styles.listLineItem}>
              <Text style={styles.cardLine}>{item.workerName || item.workerEmail || "Worker"}</Text>
              <Text style={styles.cardLine}>Status: {formatStatus(item.status)}</Text>
              <Text style={styles.cardLine}>Case ID: {item.courtCaseNumber || "Not set"}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {communityShifts.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Community Service Shifts</Text>
          {communityShifts.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.listLineItem}>
              <Text style={styles.cardLine}>{item.offenderName || "Participant"}</Text>
              <Text style={styles.cardLine}>Role: {formatStatus(item.role)}</Text>
              <Text style={styles.cardLine}>Status: {formatStatus(item.status)}</Text>
              <Text style={styles.cardLine}>Tracked Hours: {(Number(item.totalTrackedSeconds || 0) / 3600).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionHeader
        title="DUI Class Program"
        subtitle="Create membership-included DUI classes, monitor attendance evidence, and review certification rosters."
      />

      <View style={styles.card}>
        <Text style={styles.cardLine}>Active 12-month members can attend DUI classes at no added tuition when a class is offered.</Text>
        <Text style={styles.cardLine}>Attendance evidence can now be tracked through mobile sign-in, GPS/location sampling, or online session check-ins.</Text>
        <TouchableOpacity style={[styles.actionButton, styles.overrideButton]} onPress={() => router.push("/admin/classes") }>
          <Text style={styles.actionButtonText}>Open DUI Class Manager</Text>
        </TouchableOpacity>
      </View>

      {duiClasses.length === 0 ? (
        <EmptyCard title="No DUI Classes Yet" body="Create the first class in the DUI Class Manager when you are ready to schedule participants." />
      ) : (
        duiClasses.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title || "DUI Class"}</Text>
            <Text style={styles.cardLine}>Status: {formatStatus(item.status || "scheduled")}</Text>
            <Text style={styles.cardLine}>Format: {formatStatus(item.deliveryMode || "hybrid")}</Text>
            <Text style={styles.cardLine}>Required Attendance: {Number(item.requiredAttendanceMinutes || 0)} minutes</Text>
            {item.startsAtIso ? <Text style={styles.cardLine}>Starts: {item.startsAtIso}</Text> : null}
            {item.endsAtIso ? <Text style={styles.cardLine}>Ends: {item.endsAtIso}</Text> : null}
            {item.locationName || item.locationAddress ? (
              <Text style={styles.cardLine}>Location: {[item.locationName, item.locationAddress].filter(Boolean).join(" - ")}</Text>
            ) : null}
            {item.onlineJoinUrl ? <Text style={styles.cardLine}>Online Access Configured: YES</Text> : null}
            <Text style={styles.cardLine}>Participants: {Number(item.participantCount || 0)}</Text>
            <Text style={styles.cardLine}>Checked In Now: {Number(item.activeParticipantCount || 0)}</Text>
            <Text style={styles.cardLine}>Certification Ready: {Number(item.certificateEligibleCount || 0)}</Text>
            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 10, backgroundColor: "#1F6FEB" }]}
              onPress={() => router.push({ pathname: "/admin/classes", params: { focusClassId: item.id } })}
            >
              <Text style={styles.actionButtonText}>View Attendees →</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <SectionHeader
        title="Driver Background Clearance"
        subtitle="Approve, hold, deny, or deactivate drivers before they can take customer work."
      />

      {pendingDrivers.length === 0 ? (
        <EmptyCard
          title="No Drivers Waiting"
          body="All current driver profiles are either approved or already denied."
        />
      ) : (
        pendingDrivers.map((driver) => {
          const backgroundStatus = String(driver.backgroundCheck?.status || driver.eligibility?.status || "pending_review");
          return (
            <View key={driver.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{driver.name || driver.email || `Driver ${driver.id.slice(0, 6)}`}</Text>
                  <Text style={styles.cardLine}>Driver #: {driver.employeeDriverNumber || driver.driverNumber || "Not assigned"}</Text>
                  <Text style={styles.cardLine}>Background: {formatStatus(backgroundStatus)}</Text>
                  <Text style={styles.cardLine}>Availability: {driver.availability?.isAvailable ? "AVAILABLE" : "OFFLINE"}</Text>
                  {driver.phone ? <Text style={styles.cardLine}>Phone: {driver.phone}</Text> : null}
                  {driver.email ? <Text style={styles.cardLine}>Email: {driver.email}</Text> : null}
                  {driver.currentLocation?.latitude && driver.currentLocation?.longitude ? (
                    <Text style={styles.cardLine}>
                      GPS: {Number(driver.currentLocation.latitude).toFixed(5)}, {Number(driver.currentLocation.longitude).toFixed(5)}
                    </Text>
                  ) : null}
                </View>
                {driver.profilePhotoUrl ? <Image source={{ uri: driver.profilePhotoUrl }} style={styles.identityPhotoSmall} /> : null}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.resumeButton]} onPress={() => clearDriver(driver)}>
                  <Text style={styles.actionButtonText}>Clear Background</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.warningButton]} onPress={() => holdDriver(driver)}>
                  <Text style={styles.actionButtonText}>Hold Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.violenceButton]} onPress={() => denyDriver(driver)}>
                  <Text style={styles.actionButtonText}>Deny Driver</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <SectionHeader
        title="Live Retrieval Operations"
        subtitle="Monitor each retrieval, watch timers, inspect evidence, and take over if the field flow breaks."
      />

      <SectionHeader
        title="Live Retrieval Map"
        subtitle="GPS view of live pickups, dropoffs, and driver positions."
      />

      <View style={styles.card}>
        {liveMapMarkers.length ? (
          <>
            <View style={styles.legendRow}>
              <LegendItem color="#2E8B57" label="Pickup" />
              <LegendItem color="#B56A00" label="Dropoff" />
              <LegendItem color="#1F6FEB" label="Assigned Driver" />
              <LegendItem color="#8A63D2" label="Driver Roster" />
            </View>
            <MapView style={styles.map} initialRegion={liveMapRegion} region={liveMapRegion}>
            {liveMapMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                title={marker.title}
                description={marker.description}
                pinColor={markerPinColor(marker.kind)}
              />
            ))}
            </MapView>
          </>
        ) : (
          <Text style={styles.cardLine}>No GPS points available yet for active retrievals.</Text>
        )}
      </View>

      {activeRetrievals.length === 0 ? (
        <EmptyCard title="No Live Retrievals" body="Active customer retrievals will appear here as soon as they are created." />
      ) : (
        activeRetrievals.map((request) => {
          const retrievalTimerLabel = formatElapsed(
            request.statusTimestamps?.retrievalTimerStartedAtIso || request.statusTimestamps?.inProgressAtIso || null,
            request.statusTimestamps?.completedAtIso || null,
            nowMs
          );
          const detourTimerLabel = formatElapsed(
            request.detour?.startedAtIso || null,
            request.detour?.endedAtIso || null,
            nowMs
          );
          const liveMileage = Math.max(0, Number(request.tracking?.liveMileageMiles || request.pricing?.distanceMiles || 0));

          return (
            <View key={request.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Retrieval #{request.id.slice(0, 8)}</Text>
                  <Text style={styles.cardLine}>Customer: {request.customerName || request.customerEmail || "Unknown customer"}</Text>
                  <Text style={styles.cardLine}>
                    Driver: {request.assignedDriverName || request.assignedDriverId || "Unassigned"}
                    {request.assignedDriverNumber ? ` (${request.assignedDriverNumber})` : ""}
                  </Text>
                  <Text style={styles.cardLine}>Status: {formatStatus(request.status)}</Text>
                  <Text style={styles.cardLine}>Admin Review: {formatStatus(request.adminReviewStatus || "unreviewed")}</Text>
                  <Text style={styles.cardLine}>Pickup: {request.pickup || "Not set"}</Text>
                  <Text style={styles.cardLine}>Dropoff: {request.lockedHomeAddress || request.dropoff || "Not set"}</Text>
                  <Text style={styles.cardLine}>Retrieval Timer: {retrievalTimerLabel}</Text>
                  <Text style={styles.cardLine}>Live Mileage: {liveMileage.toFixed(2)} miles</Text>
                  <Text style={styles.cardLine}>Detour: {formatStatus(request.detour?.status || "idle")} ({detourTimerLabel})</Text>
                  <Text style={styles.cardLine}>Charge Status: {formatStatus(request.billing?.chargeStatus || "not_attempted")}</Text>
                  {request.divertReason ? <Text style={styles.cardLine}>Divert Note: {request.divertReason}</Text> : null}
                  {request.incident?.type ? <Text style={styles.cardLine}>Incident: {formatStatus(request.incident.type)}</Text> : null}
                  <Text style={styles.cardLine}>Projected Total: {formatCurrency(Number(request.pricing?.totalCharge || 0))}</Text>
                </View>
                {request.assignedDriverProfilePhotoUrl ? (
                  <Image source={{ uri: request.assignedDriverProfilePhotoUrl }} style={styles.identityPhotoSmall} />
                ) : request.customerProfilePhotoUrl ? (
                  <Image source={{ uri: request.customerProfilePhotoUrl }} style={styles.identityPhotoSmall} />
                ) : null}
              </View>

              {collectVehiclePhotos(request).length ? (
                <View style={styles.photoGrid}>
                  {collectVehiclePhotos(request).map(([label, url]) => (
                    <View key={`${request.id}-${label}`} style={styles.photoCard}>
                      <Text style={styles.photoLabel}>{label}</Text>
                      <Image source={{ uri: String(url) }} style={styles.photoPreview} />
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    patchRetrieval(
                      request.id,
                      { adminReviewStatus: "monitored" },
                      "Retrieval marked as under admin supervision."
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Monitor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={() =>
                    retrievalAction(
                      request.id,
                      "divert",
                      {
                        note: "Diverted by admin control board",
                      },
                      "Retrieval diverted."
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Divert</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.resumeButton]}
                  onPress={() =>
                    retrievalAction(
                      request.id,
                      "resume",
                      {
                        note: "Resumed by admin control board",
                      },
                      "Retrieval resumed."
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Resume</Text>
                </TouchableOpacity>
              </View>

              {requiresQuitOverride(request) ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.overrideButton]}
                    onPress={() => runAdminOverride(request, { chargeCustomer: true, violence: false, reason: "driver_quit_mid_retrieval" })}
                  >
                    <Text style={styles.actionButtonText}>Complete + Charge</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.waiveButton]}
                    onPress={() => runAdminOverride(request, { chargeCustomer: false, violence: false, reason: "driver_quit_admin_waive" })}
                  >
                    <Text style={styles.actionButtonText}>Complete + Waive</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {request.incident?.type === "violence" ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.violenceButton]}
                    onPress={() => runAdminOverride(request, { chargeCustomer: false, violence: true, reason: "violence_reported_by_driver" })}
                  >
                    <Text style={styles.actionButtonText}>Violence Hold</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      <SectionHeader
        title="Customer Service Control"
        subtitle="Manage customer eligibility, suspension, billing holds, and compliance review while the app is live."
      />

      {docsReviewCustomers.length === 0 ? (
        <EmptyCard title="No Customer Actions Pending" body="Customer records and service controls will appear here." />
      ) : (
        docsReviewCustomers.map((customer) => {
          const docKeys = ["license", "insurance", "registration"];
          const missingDocs = docKeys.filter((key) => {
            const entry = customer.docs?.[key];
            return !entry || !entry.expiryDate || !entry.addressOnDocument;
          });

          return (
            <View key={customer.id} style={styles.card}>
              <Text style={styles.cardTitle}>{customer.userName || customer.userEmail || `Customer ${customer.id.slice(0, 6)}`}</Text>
              <Text style={styles.cardLine}>Service: {formatStatus(customer.serviceStatus || "unknown")}</Text>
              <Text style={styles.cardLine}>Billing Hold: {customer.billingHold?.active ? "ACTIVE" : "OFF"}</Text>
              <Text style={styles.cardLine}>
                Payment Profile: {(customer.paymentProfile?.stripeCustomerId || customer.membershipBilling?.stripeCustomerId) ? "Stored" : "Missing"}
              </Text>
              {customer.suspensionReason ? <Text style={styles.cardLine}>Suspension Reason: {customer.suspensionReason}</Text> : null}
              <Text style={styles.cardLine}>Missing Docs: {missingDocs.length ? missingDocs.join(", ") : "None"}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.resumeButton]}
                  onPress={() => customerAction(customer.id, "activate", "Activated by admin", "Customer service activated.")}
                >
                  <Text style={styles.actionButtonText}>Activate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={() => customerAction(customer.id, "suspend", "Suspended by admin", "Customer service suspended.")}
                >
                  <Text style={styles.actionButtonText}>Suspend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.waiveButton]}
                  onPress={() =>
                    customerAction(
                      customer.id,
                      customer.billingHold?.active ? "release_billing" : "hold_billing",
                      customer.billingHold?.active ? "Billing hold released" : "Billing hold set",
                      customer.billingHold?.active ? "Billing hold released." : "Billing hold enabled."
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>{customer.billingHold?.active ? "Release Hold" : "Hold Billing"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <SectionHeader
        title="Driver Roster"
        subtitle="Quick driver ops for approved and denied accounts."
      />

      {drivers.map((driver) => {
        const driverStatus = String(driver.eligibility?.status || driver.backgroundCheck?.status || "pending_review");
        return (
          <View key={driver.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{driver.name || driver.email || `Driver ${driver.id.slice(0, 6)}`}</Text>
                <Text style={styles.cardLine}>Driver #: {driver.employeeDriverNumber || driver.driverNumber || "Not assigned"}</Text>
                <Text style={styles.cardLine}>Eligibility: {formatStatus(driverStatus)}</Text>
                <Text style={styles.cardLine}>Availability: {driver.availability?.isAvailable ? "AVAILABLE" : "OFFLINE"}</Text>
              </View>
              {driver.profilePhotoUrl ? <Image source={{ uri: driver.profilePhotoUrl }} style={styles.identityPhotoSmall} /> : null}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, styles.resumeButton]} onPress={() => clearDriver(driver)}>
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.waiveButton]} onPress={() => deactivateDriver(driver)}>
                <Text style={styles.actionButtonText}>Set Offline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.violenceButton]} onPress={() => denyDriver(driver)}>
                <Text style={styles.actionButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[styles.metricCard, { borderColor: accent }]}> 
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function TestRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.testRow}>
      <Text style={styles.testLabel}>{label}</Text>
      <Text style={[styles.testValue, ok ? styles.passText : styles.failText]}>{ok ? "PASS" : "FAIL"}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 18,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    width: "47%",
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  metricLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.85,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#D5D5D5",
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    padding: 18,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyBody: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  testPanel: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 10,
  },
  testTitle: {
    color: "#FFD700",
    fontSize: 13,
    marginBottom: 8,
  },
  testRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  testLabel: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  testValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  passText: {
    color: "#2E8B57",
  },
  failText: {
    color: "#8B0000",
  },
  helperText: {
    color: "#D5D5D5",
    fontSize: 12,
    marginTop: 6,
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2F2F2F",
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardLine: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 7,
    lineHeight: 18,
  },
  listLineItem: {
    borderTopWidth: 1,
    borderTopColor: "#242424",
    paddingTop: 10,
    marginTop: 2,
  },
  identityPhotoSmall: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#555555",
    backgroundColor: "#1A1A1A",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#D4AF37",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },
  warningButton: {
    backgroundColor: "#B56A00",
  },
  resumeButton: {
    backgroundColor: "#2E8B57",
  },
  overrideButton: {
    backgroundColor: "#1F6FEB",
  },
  waiveButton: {
    backgroundColor: "#5A5A5A",
  },
  violenceButton: {
    backgroundColor: "#8B0000",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  photoCard: {
    width: "47%",
    backgroundColor: "#161616",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#303030",
  },
  photoLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    marginBottom: 6,
  },
  photoPreview: {
    width: "100%",
    height: 110,
    borderRadius: 8,
  },
  map: {
    width: "100%",
    height: 280,
    borderRadius: 10,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});