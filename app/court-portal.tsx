import React, { useState } from "react";
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

import { backendJson, jsonBody } from "../lib/backendClient";
import { buildApiUrl } from "../lib/apiBase";

type CourtTrackingItem = {
  worker?: {
    workerId?: string;
    workerName?: string;
    workerEmail?: string;
    courtCaseNumber?: string;
    courtName?: string;
    status?: string;
    sentenceHoursOrdered?: number;
  } | null;
  summary?: {
    communityService?: {
      totalTrackedHours?: number;
      remainingHours?: number;
      completedShiftCount?: number;
      activeShiftCount?: number;
    } | null;
    duiClass?: {
      totalTrackedHours?: number;
      certificateEligibleClasses?: number;
    } | null;
    combined?: {
      totalTrackedHours?: number;
    } | null;
  } | null;
  dailyTracking?: Array<{
    date: string;
    communityServiceHours?: number;
    duiClassHours?: number;
    totalHours?: number;
    didAnyRequiredActivity?: boolean;
  }>;
};

function formatStatus(value?: string | null) {
  return String(value || "unknown").replace(/_/g, " ").toUpperCase();
}

function formatHours(value?: number | null) {
  return Number(value || 0).toFixed(2);
}

export default function CourtPortalScreen() {
  const router = useRouter();
  const [caseId, setCaseId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);
  const [trackingItems, setTrackingItems] = useState<CourtTrackingItem[]>([]);
  const [calendarText, setCalendarText] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    try {
      const payload = await backendJson("/court/access/request-code", {
        method: "POST",
        body: jsonBody({ caseId: caseId.trim(), email: email.trim() }),
      });
      setChallengeId(payload?.challengeId || null);
      setExpiresAtIso(payload?.expiresAtIso || null);
      setAccessToken(null);
      setTrackingItems([]);
      setCalendarText("");
      Alert.alert("Verification Code Sent", "A six-digit code was sent to the authorized court email for this case.");
    } catch (error: any) {
      Alert.alert("Code Request Failed", error?.message || "Unable to send the verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!challengeId) {
      Alert.alert("Request Code First", "Generate a case verification code before entering it here.");
      return;
    }

    setLoading(true);
    try {
      const payload = await backendJson("/court/access/verify-code", {
        method: "POST",
        body: jsonBody({ challengeId, code: code.trim() }),
      });
      const token = String(payload?.accessToken || "");
      setAccessToken(token);
      setExpiresAtIso(payload?.expiresAtIso || null);
      await loadTracking(token);
    } catch (error: any) {
      Alert.alert("Verification Failed", error?.message || "Unable to verify the code.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTracking(tokenOverride?: string) {
    const token = tokenOverride || accessToken;
    if (!token) {
      Alert.alert("Access Token Missing", "Verify the email code first.");
      return;
    }

    setLoading(true);
    try {
      const [trackingResponse, calendarResponse] = await Promise.all([
        fetch(buildApiUrl(`/court/tracking-by-case/${encodeURIComponent(caseId.trim())}`), {
          headers: { "x-court-access-token": token },
        }),
        fetch(buildApiUrl(`/court/tracking-by-case/${encodeURIComponent(caseId.trim())}/calendar`), {
          headers: { "x-court-access-token": token },
        }),
      ]);

      const trackingPayload = await trackingResponse.json().catch(() => null);
      const printable = await calendarResponse.text();

      if (!trackingResponse.ok || trackingPayload?.success === false) {
        throw new Error(trackingPayload?.error || `court_tracking_${trackingResponse.status}`);
      }
      if (!calendarResponse.ok) {
        throw new Error(printable || `court_calendar_${calendarResponse.status}`);
      }

      setTrackingItems(trackingPayload?.items || []);
      setCalendarText(printable || "");
    } catch (error: any) {
      Alert.alert("Court Lookup Failed", error?.message || "Unable to load the case record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Court Portal</Text>
      <Text style={styles.subtitle}>
        Authorized court staff can request a one-time six-digit code by email, verify the case, and review current community-service and DUI-class progress by case ID.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Case Access</Text>
        <TextInput style={styles.input} value={caseId} onChangeText={setCaseId} placeholder="Case ID" placeholderTextColor="#777" autoCapitalize="characters" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Authorized court email" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={requestCode}>
          <Text style={styles.primaryButtonText}>Request 6-Digit Code</Text>
        </TouchableOpacity>
        {challengeId ? <Text style={styles.helperText}>Challenge active until: {expiresAtIso || "Unknown"}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verify Access Code</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="Enter 6-digit code" placeholderTextColor="#777" keyboardType="number-pad" />
        <TouchableOpacity style={styles.secondaryButton} disabled={loading || !challengeId} onPress={verifyCode}>
          <Text style={styles.secondaryButtonText}>Verify And Open Case</Text>
        </TouchableOpacity>
        {accessToken ? <Text style={styles.helperText}>Portal session active until: {expiresAtIso || "Unknown"}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : null}

      {trackingItems.map((item, index) => (
        <View key={`${item.worker?.workerId || index}`} style={styles.resultCard}>
          <Text style={styles.resultTitle}>{item.worker?.workerName || "Participant"}</Text>
          <Text style={styles.resultLine}>Status: {formatStatus(item.worker?.status)}</Text>
          <Text style={styles.resultLine}>Case ID: {item.worker?.courtCaseNumber || caseId}</Text>
          <Text style={styles.resultLine}>Court: {item.worker?.courtName || "Not provided"}</Text>
          <Text style={styles.resultLine}>Sentence Hours Ordered: {item.worker?.sentenceHoursOrdered || 0}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Service Hours</Text>
              <Text style={styles.metricValue}>{formatHours(item.summary?.communityService?.totalTrackedHours)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>DUI Hours</Text>
              <Text style={styles.metricValue}>{formatHours(item.summary?.duiClass?.totalTrackedHours)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Combined</Text>
              <Text style={styles.metricValue}>{formatHours(item.summary?.combined?.totalTrackedHours)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Daily Tracking</Text>
          {(item.dailyTracking || []).slice(-14).reverse().map((row) => (
            <View key={`${item.worker?.workerId}-${row.date}`} style={styles.dailyRow}>
              <Text style={styles.dailyDate}>{row.date}</Text>
              <Text style={styles.dailyValue}>Community: {formatHours(row.communityServiceHours)}h</Text>
              <Text style={styles.dailyValue}>DUI: {formatHours(row.duiClassHours)}h</Text>
              <Text style={styles.dailyValue}>Total: {formatHours(row.totalHours)}h</Text>
              <Text style={[styles.dailyFlag, row.didAnyRequiredActivity ? styles.dailyFlagOk : styles.dailyFlagMiss]}>
                {row.didAnyRequiredActivity ? "Activity Logged" : "No Activity"}
              </Text>
            </View>
          ))}
        </View>
      ))}

      {calendarText ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Printable Daily Calendar</Text>
          <Text style={styles.calendarText}>{calendarText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071019",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#A9D7FF",
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    color: "#F4E7B2",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#BED4E8",
    lineHeight: 21,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#112131",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#29435A",
    padding: 16,
    gap: 10,
  },
  resultCard: {
    backgroundColor: "#0C1824",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#33536F",
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: "#D9ECFF",
    fontSize: 18,
    fontWeight: "700",
  },
  resultTitle: {
    color: "#F4E7B2",
    fontSize: 22,
    fontWeight: "800",
  },
  resultLine: {
    color: "#D7E6F4",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#08131D",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C455C",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
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
  secondaryButton: {
    backgroundColor: "#356A99",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F5FBFF",
    fontWeight: "800",
    fontSize: 16,
  },
  helperText: {
    color: "#A8C2D8",
    lineHeight: 20,
  },
  loadingWrap: {
    paddingVertical: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#122738",
    borderRadius: 14,
    padding: 12,
  },
  metricLabel: {
    color: "#8DB7D8",
    fontSize: 11,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#F8E8B0",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 5,
  },
  sectionLabel: {
    color: "#D9ECFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  dailyRow: {
    borderTopWidth: 1,
    borderTopColor: "#203547",
    paddingTop: 10,
    gap: 3,
  },
  dailyDate: {
    color: "#F6E7B8",
    fontWeight: "700",
  },
  dailyValue: {
    color: "#D5E5F0",
    fontSize: 13,
  },
  dailyFlag: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "700",
  },
  dailyFlagOk: {
    backgroundColor: "#1E4F2B",
    color: "#B8F2C4",
  },
  dailyFlagMiss: {
    backgroundColor: "#5D2424",
    color: "#FFD5D5",
  },
  calendarText: {
    color: "#DCE9F5",
    fontFamily: "monospace",
    lineHeight: 20,
  },
});