import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

import {
  updateDriverLocation,
  updateRetrievalStatus,
  getRetrievalDetails,
  RetrievalStatus,
} from "../../lib/api/driver";

import { auth, db } from "../../firebaseConfig";
import { buildApiUrl } from "../../lib/apiBase";
import { uploadRetrievalEvidencePhoto } from "../../lib/storage/uploadRetrievalEvidencePhoto";

const BEFORE_PHOTO_KEYS = ["front", "driverSide", "passengerSide", "rear"] as const;
const AFTER_PHOTO_KEYS = ["front", "driverSide", "passengerSide", "rear"] as const;
const PICKUP_AUTO_START_FEET = 150;
const FEET_PER_MILE = 5280;
const MOTION_SPEED_MPH_THRESHOLD = 1.5;
const MOTION_DISTANCE_MILES_THRESHOLD = 0.001;

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

function labelForPhoto(key: string) {
  if (key === "driverSide") return "Driver Side";
  if (key === "passengerSide") return "Passenger Side";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

export default function AssignedRetrieval() {
  const { id } = useLocalSearchParams();
  const retrievalId = id ? String(id) : null;

  const router = useRouter();
  const [retrieval, setRetrieval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detourReason, setDetourReason] = useState("");
  const [requestingDetour, setRequestingDetour] = useState(false);
  const [endingDetour, setEndingDetour] = useState(false);
  const [capturingField, setCapturingField] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const proximityTimerStartedRef = useRef(false);
  const autoStartTriggeredRef = useRef(false);
  const lastMotionPointRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!retrievalId) return;

    const unsubscribe = getRetrievalDetails(retrievalId, (data) => {
      setRetrieval(data);
      setLoading(false);
      setDetourReason((current) => current || String(data?.detour?.reason || ""));
    });

    return () => unsubscribe();
  }, [retrievalId]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }

      interval = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          const user = auth.currentUser;
          const currentPoint = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          const speedMph = Math.max(0, Number(loc.coords.speed || 0)) * 2.23694;

          if (user) {
            await updateDriverLocation(user.uid, {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }

          if (!retrievalId || !retrieval) {
            return;
          }

          const pickupLat = Number(retrieval?.requestLocation?.latitude);
          const pickupLng = Number(retrieval?.requestLocation?.longitude);
          const hasPickupCoordinates = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
          const distanceToPickupMiles = hasPickupCoordinates
            ? haversineMiles(currentPoint.latitude, currentPoint.longitude, pickupLat, pickupLng)
            : null;
          const distanceToPickupFeet = distanceToPickupMiles !== null ? distanceToPickupMiles * FEET_PER_MILE : null;

          const hasAcceptanceFace = Boolean(
            retrieval?.evidence?.driverFace?.acceptance?.fileURL || retrieval?.evidence?.driverFace?.acceptance?.localUri
          );
          const hasBeforePhotos = BEFORE_PHOTO_KEYS.every((key) =>
            Boolean(retrieval?.evidence?.vehicle?.before?.[key]?.fileURL || retrieval?.evidence?.vehicle?.before?.[key]?.localUri)
          );
          const hasRequiredStartEvidence = hasAcceptanceFace && hasBeforePhotos;

          const currentStatus = String(retrieval?.status || "assigned");
          const eligibleForAutoStart = hasRequiredStartEvidence && ["assigned", "en_route", "arrived"].includes(currentStatus);

          if (
            !proximityTimerStartedRef.current &&
            !retrieval?.statusTimestamps?.retrievalTimerStartedAtIso &&
            distanceToPickupFeet !== null &&
            distanceToPickupFeet <= PICKUP_AUTO_START_FEET
          ) {
            proximityTimerStartedRef.current = true;
            await updateRetrievalFields({
              "statusTimestamps.retrievalTimerStartedByPickupRadius": true,
              "statusTimestamps.retrievalTimerStartedAt": serverTimestamp(),
              "statusTimestamps.retrievalTimerStartedAtIso": new Date().toISOString(),
              "statusTimestamps.retrievalTimerStartedAtPickupRadiusFeet": Math.round(distanceToPickupFeet),
            });
            return;
          }

          if (
            eligibleForAutoStart &&
            !autoStartTriggeredRef.current &&
            Boolean(proximityTimerStartedRef.current || retrieval?.statusTimestamps?.retrievalTimerStartedAtIso)
          ) {
            autoStartTriggeredRef.current = true;
            await updateRetrievalStatus(retrievalId, "in_progress", undefined, {
              "statusTimestamps.autoStartedAfterEvidence": true,
              "statusTimestamps.autoStartedAtPickupRadiusFeet":
                distanceToPickupFeet !== null ? Math.round(distanceToPickupFeet) : null,
              "statusTimestamps.autoStartedAt": serverTimestamp(),
              "statusTimestamps.autoStartedAtIso": new Date().toISOString(),
            });
            return;
          }

          if (currentStatus !== "in_progress") {
            return;
          }

          const previousPoint = lastMotionPointRef.current;
          lastMotionPointRef.current = currentPoint;
          if (!previousPoint) {
            return;
          }

          const movedMiles = haversineMiles(
            previousPoint.latitude,
            previousPoint.longitude,
            currentPoint.latitude,
            currentPoint.longitude
          );
          const isMoving = speedMph >= MOTION_SPEED_MPH_THRESHOLD || movedMiles >= MOTION_DISTANCE_MILES_THRESHOLD;
          if (!isMoving) {
            return;
          }

          const existingLiveMileage = Math.max(0, Number(retrieval?.tracking?.liveMileageMiles || 0));
          const nextLiveMileage = existingLiveMileage + Math.max(0, movedMiles);
          const mileageStartedIso = retrieval?.tracking?.mileageStartedAtIso || null;

          await updateRetrievalFields({
            "tracking.liveMileageMiles": Number(nextLiveMileage.toFixed(4)),
            "tracking.lastMotionSpeedMph": Number(speedMph.toFixed(2)),
            "tracking.lastMotionAt": serverTimestamp(),
            "tracking.lastMotionAtIso": new Date().toISOString(),
            ...(mileageStartedIso
              ? {}
              : {
                  "tracking.mileageStartedByMotion": true,
                  "tracking.mileageStartedAt": serverTimestamp(),
                  "tracking.mileageStartedAtIso": new Date().toISOString(),
                }),
          });
        } catch (err) {
          console.error("Location update error:", err);
        }
      }, 10000);
    };

    startTracking();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [retrieval, retrievalId]);

  const detourStatus = String(retrieval?.detour?.status || "idle");
  const detourTimerLabel = formatElapsed(
    retrieval?.detour?.startedAtIso || null,
    retrieval?.detour?.endedAtIso || null,
    nowMs
  );
  const keyDropRequired = Boolean(retrieval?.workflow?.keysLeftAtPredeterminedLocation);
  const liveMileageMiles = Math.max(0, Number(retrieval?.tracking?.liveMileageMiles || 0));
  const liveRetrievalTimer = formatElapsed(
    retrieval?.statusTimestamps?.retrievalTimerStartedAtIso || retrieval?.statusTimestamps?.inProgressAtIso || null,
    retrieval?.statusTimestamps?.completedAtIso || null,
    nowMs
  );

  const acceptanceFaceUri = retrieval?.evidence?.driverFace?.acceptance?.fileURL || retrieval?.evidence?.driverFace?.acceptance?.localUri || null;
  const detourFaceUri = retrieval?.evidence?.driverFace?.detour?.fileURL || retrieval?.evidence?.driverFace?.detour?.localUri || null;
  const completionFaceUri = retrieval?.evidence?.driverFace?.completion?.fileURL || retrieval?.evidence?.driverFace?.completion?.localUri || null;
  const keyDropPhotoUri = retrieval?.evidence?.keyDrop?.fileURL || retrieval?.evidence?.keyDrop?.localUri || null;

  const beforePhotoUris = useMemo(
    () =>
      Object.fromEntries(
        BEFORE_PHOTO_KEYS.map((key) => [
          key,
          retrieval?.evidence?.vehicle?.before?.[key]?.fileURL || retrieval?.evidence?.vehicle?.before?.[key]?.localUri || null,
        ])
      ) as Record<(typeof BEFORE_PHOTO_KEYS)[number], string | null>,
    [retrieval]
  );

  const afterPhotoUris = useMemo(
    () =>
      Object.fromEntries(
        AFTER_PHOTO_KEYS.map((key) => [
          key,
          retrieval?.evidence?.vehicle?.after?.[key]?.fileURL || retrieval?.evidence?.vehicle?.after?.[key]?.localUri || null,
        ])
      ) as Record<(typeof AFTER_PHOTO_KEYS)[number], string | null>,
    [retrieval]
  );

  const hasAllBeforePhotos = BEFORE_PHOTO_KEYS.every((key) => Boolean(beforePhotoUris[key]));
  const hasAllAfterPhotos = AFTER_PHOTO_KEYS.every((key) => Boolean(afterPhotoUris[key]));
  const canStartRetrieval = Boolean(acceptanceFaceUri) && hasAllBeforePhotos;
  const canCompleteRetrieval = Boolean(completionFaceUri) && hasAllAfterPhotos && (!keyDropRequired || Boolean(keyDropPhotoUri));
  const hasProximityTimerStarted = Boolean(retrieval?.statusTimestamps?.retrievalTimerStartedAtIso);

  async function updateRetrievalFields(fields: Record<string, unknown>) {
    if (!retrievalId) return;
    await updateDoc(doc(db, "retrieval", retrievalId), {
      ...fields,
      updatedAt: serverTimestamp(),
    });
  }

  async function captureEvidence(fieldPath: string, promptLabel: string, useFrontCamera = false) {
    if (!retrievalId) return;

    try {
      setCapturingField(fieldPath);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera Access Needed", "Please allow camera access to continue.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: useFrontCamera ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const localUri = result.assets[0].uri;
      const uploadResult = await uploadRetrievalEvidencePhoto({
        retrievalId,
        category: promptLabel,
        localUri,
      });

      await updateRetrievalFields({
        [fieldPath]: {
          localUri,
          fileURL: uploadResult.downloadURL,
          storagePath: uploadResult.storagePath,
          label: promptLabel,
          capturedAt: serverTimestamp(),
          capturedAtIso: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to capture evidence:", error);
      Alert.alert("Capture Failed", "Unable to save this photo right now.");
    } finally {
      setCapturingField(null);
    }
  }

  const handleStatusChange = async (newStatus: RetrievalStatus) => {
    if (!retrievalId) return;

    if (newStatus === "in_progress" && !canStartRetrieval) {
      Alert.alert(
        "Before Retrieval Evidence Required",
        "Capture the acceptance face photo and all four before-retrieval vehicle photos before starting the retrieval."
      );
      return;
    }

    if (newStatus === "completed" && !canCompleteRetrieval) {
      Alert.alert(
        "Completion Evidence Required",
        keyDropRequired
          ? "Capture all four parked vehicle photos, the final driver face photo, and the key-drop photo before completing."
          : "Capture all four parked vehicle photos and the final driver face photo before completing."
      );
      return;
    }

    try {
      const pricing = retrieval?.pricing || {};
      const completionReceiptPayload =
        newStatus === "completed"
          ? {
              customerId: retrieval?.customerId || null,
              customerName: retrieval?.customerName || null,
              customerEmail: retrieval?.customerEmail || null,
              customerPhone: retrieval?.customerPhone || null,
              customerProfilePhotoUrl: retrieval?.customerProfilePhotoUrl || null,
              driverName: retrieval?.assignedDriverName || auth.currentUser?.displayName || null,
              driverProfilePhotoUrl: retrieval?.assignedDriverProfilePhotoUrl || auth.currentUser?.photoURL || null,
              distanceMiles: Number(liveMileageMiles || pricing.distanceMiles || retrieval?.mileage || 0),
              originalEstimatedMinutes: Number(pricing.originalEstimatedMinutes || 0),
              detourMinuteRate: Number(pricing.detourMinuteRate || 3),
              baseCharge: Number(pricing.baseCharge || 0),
              mileageCharge: Number(pricing.mileageCharge || pricing.baseCharge || 0),
              tipCharge: Number(pricing.tipCharge || 0),
              totalCharge: Number(pricing.totalCharge || retrieval?.totalCost || 0),
              currency: String(pricing.currency || "USD"),
              retrievalData: retrieval,
            }
          : undefined;

      await updateRetrievalStatus(
        retrievalId,
        newStatus,
        completionReceiptPayload,
        newStatus === "completed" && detourStatus === "approved"
          ? {
              "detour.endedAt": serverTimestamp(),
              "detour.endedAtIso": new Date().toISOString(),
              "detour.status": "ended",
              "routing.focusAddress": retrieval?.lockedHomeAddress || retrieval?.dropoff || null,
              "routing.rerouteRequestedAt": serverTimestamp(),
              "routing.rerouteRequestedAtIso": new Date().toISOString(),
            }
          : undefined
      );
      Alert.alert("Success", `Status updated to ${newStatus}.`);
      if (newStatus === "completed") {
        router.back();
      }
    } catch (err) {
      console.error("Status update error:", err);
      Alert.alert("Error", "Unable to update status.");
    }
  };

  async function requestDetourVerification() {
    if (!retrievalId) return;
    if (!retrieval?.customerPhone) {
      Alert.alert("Customer Phone Missing", "A customer phone number is required for detour SMS verification.");
      return;
    }
    if (!detourReason.trim()) {
      Alert.alert("Detour Reason Required", "Enter why the route is changing before requesting customer approval.");
      return;
    }
    if (!detourFaceUri) {
      Alert.alert("Detour Face Photo Required", "Capture a driver face verification photo before requesting detour approval.");
      return;
    }

    try {
      setRequestingDetour(true);
          const response = await fetch(buildApiUrl("/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: retrieval.customerPhone }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to send verification code.");
      }

      await updateRetrievalFields({
        "detour.reason": detourReason.trim(),
        "detour.status": "pending_customer_verification",
        "detour.requestedAt": serverTimestamp(),
        "detour.requestedAtIso": new Date().toISOString(),
        "detour.verificationChannel": "sms",
        "detour.customerApprovalSid": result.sid || null,
      });

      Alert.alert("Verification Sent", "The customer has been texted to approve the detour. The timer will start after approval.");
    } catch (error: any) {
      console.error("Detour verification request failed:", error);
      Alert.alert("Verification Failed", error?.message || "Unable to request customer detour approval.");
    } finally {
      setRequestingDetour(false);
    }
  }

  async function endDetourTimer() {
    if (!retrievalId || detourStatus !== "approved") return;
    try {
      setEndingDetour(true);
      await updateRetrievalFields({
        "detour.status": "ended",
        "detour.endedAt": serverTimestamp(),
        "detour.endedAtIso": new Date().toISOString(),
        "routing.focusAddress": retrieval?.lockedHomeAddress || retrieval?.dropoff || null,
        "routing.rerouteRequestedAt": serverTimestamp(),
        "routing.rerouteRequestedAtIso": new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to end detour timer:", error);
      Alert.alert("Unable to End Timer", "The detour timer could not be stopped right now.");
    } finally {
      setEndingDetour(false);
    }
  }

  async function setKeyDropRequired(nextValue: boolean) {
    try {
      await updateRetrievalFields({
        "workflow.keysLeftAtPredeterminedLocation": nextValue,
      });
    } catch (error) {
      console.error("Failed to update key-drop requirement:", error);
      Alert.alert("Update Failed", "Unable to update key-drop requirement.");
    }
  }

  async function escalateToAdmin(reason: "driver_quit" | "violence") {
    try {
      await updateRetrievalFields({
        status: "unable",
        adminReviewStatus: reason === "driver_quit" ? "driver_quit_review" : "violence_review",
        "incident.type": reason,
        "incident.reportedByDriver": true,
        "incident.reportedAt": serverTimestamp(),
        "incident.reportedAtIso": new Date().toISOString(),
        "incident.driverMustNotifyAdminImmediately": reason === "violence",
        "incident.fineAssessmentRequired": reason === "violence",
        "adminOverride.required": reason === "driver_quit",
        "billing.chargeStatus": reason === "driver_quit" ? "pending_admin_override" : "blocked_violence_review",
      });

      Alert.alert(
        reason === "driver_quit" ? "Sent To Admin" : "Violence Reported",
        reason === "driver_quit"
          ? "This retrieval has been flagged for admin completion review. Customer auto-charge is paused until admin resolves it."
          : "Violence has been flagged for immediate admin review and fine assessment. Charging is blocked."
      );
      router.back();
    } catch (error) {
      console.error("Failed to escalate retrieval:", error);
      Alert.alert("Escalation Failed", "Unable to notify admin right now.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  if (!retrieval) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Retrieval not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assigned Retrieval</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{retrieval.customerName || "Unknown customer"}</Text>
        {retrieval.customerProfilePhotoUrl ? (
          <Image source={{ uri: retrieval.customerProfilePhotoUrl }} style={styles.identityPhoto} />
        ) : (
          <Text style={styles.warning}>Customer profile photo missing. Confirm identity carefully at pickup.</Text>
        )}

        <Text style={styles.label}>Your Driver Profile Photo</Text>
        {retrieval.assignedDriverProfilePhotoUrl ? (
          <Image source={{ uri: retrieval.assignedDriverProfilePhotoUrl }} style={styles.identityPhoto} />
        ) : (
          <Text style={styles.warning}>Your profile photo is missing from this retrieval record.</Text>
        )}

        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{retrieval.pickup}</Text>

        <Text style={styles.label}>Dropoff</Text>
        <Text style={styles.value}>{retrieval.lockedHomeAddress || retrieval.dropoff}</Text>

        <Text style={styles.label}>Completion Focus</Text>
        <Text style={styles.value}>{retrieval.lockedHomeAddress || retrieval.dropoff}</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.status}>{String(retrieval.status || "assigned").toUpperCase()}</Text>

        <Text style={styles.label}>Retrieval Timer</Text>
        <Text style={styles.value}>{liveRetrievalTimer}</Text>

        <Text style={styles.label}>Live Mileage</Text>
        <Text style={styles.value}>{liveMileageMiles.toFixed(2)} miles</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acceptance Checkpoint</Text>
        <Text style={styles.sectionText}>Capture driver face recognition after accepting the retrieval.</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => captureEvidence("evidence.driverFace.acceptance", "acceptance_face", true)}
        >
          <Text style={styles.actionButtonText}>
            {capturingField === "evidence.driverFace.acceptance"
              ? "Opening Camera..."
              : acceptanceFaceUri
                ? "Retake Acceptance Face Photo"
                : "Capture Acceptance Face Photo"}
          </Text>
        </TouchableOpacity>
        {acceptanceFaceUri ? <Image source={{ uri: acceptanceFaceUri }} style={styles.photoPreview} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Before Retrieval Vehicle Photos</Text>
        <Text style={styles.sectionText}>Timer starts automatically at 150 ft from pickup. Retrieval starts only after acceptance face + all four before-vehicle photos are complete.</Text>
        <View style={styles.grid}>
          {BEFORE_PHOTO_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.photoTile}
              onPress={() => captureEvidence(`evidence.vehicle.before.${key}`, `before_${key}`)}
            >
              <Text style={styles.photoTileTitle}>{labelForPhoto(key)}</Text>
              {beforePhotoUris[key] ? (
                <Image source={{ uri: beforePhotoUris[key] || undefined }} style={styles.tileImage} />
              ) : (
                <Text style={styles.photoTileHint}>Tap to capture</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, (!canStartRetrieval || !hasProximityTimerStarted) && styles.disabledButton]}
          disabled={!canStartRetrieval || !hasProximityTimerStarted}
          onPress={() => handleStatusChange("in_progress")}
        >
          <Text style={styles.primaryButtonText}>Start Retrieval (Manual Backup)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detour Control</Text>
        <Text style={styles.sectionText}>
          If the route changes for food, another passenger, or any other detour, capture a face photo, request customer SMS approval, and the detour timer will begin once approved.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => captureEvidence("evidence.driverFace.detour", "detour_face", true)}
        >
          <Text style={styles.actionButtonText}>
            {capturingField === "evidence.driverFace.detour"
              ? "Opening Camera..."
              : detourFaceUri
                ? "Retake Detour Face Photo"
                : "Capture Detour Face Photo"}
          </Text>
        </TouchableOpacity>
        {detourFaceUri ? <Image source={{ uri: detourFaceUri }} style={styles.photoPreview} /> : null}
        <TextInput
          value={detourReason}
          onChangeText={setDetourReason}
          placeholder="Detour reason"
          placeholderTextColor="#777"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.actionButton, requestingDetour && styles.disabledButton]}
          disabled={requestingDetour}
          onPress={requestDetourVerification}
        >
          <Text style={styles.actionButtonText}>
            {requestingDetour ? "Sending Verification..." : "Request Customer Detour Approval"}
          </Text>
        </TouchableOpacity>
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Detour Status</Text>
          <Text style={styles.timerStatus}>{detourStatus.replace(/_/g, " ").toUpperCase()}</Text>
          <Text style={styles.timerLabel}>Detour Timer</Text>
          <Text style={styles.timerValue}>{detourTimerLabel}</Text>
          {detourStatus === "approved" ? (
            <TouchableOpacity
              style={[styles.secondaryButton, endingDetour && styles.disabledButton]}
              disabled={endingDetour}
              onPress={endDetourTimer}
            >
              <Text style={styles.secondaryButtonText}>{endingDetour ? "Stopping..." : "End Detour Timer"}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>After Parking Vehicle Photos</Text>
        <Text style={styles.sectionText}>Capture front, driver side, passenger side, and rear after parking the retrieval vehicle.</Text>
        <View style={styles.grid}>
          {AFTER_PHOTO_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.photoTile}
              onPress={() => captureEvidence(`evidence.vehicle.after.${key}`, `after_${key}`)}
            >
              <Text style={styles.photoTileTitle}>{labelForPhoto(key)}</Text>
              {afterPhotoUris[key] ? (
                <Image source={{ uri: afterPhotoUris[key] || undefined }} style={styles.tileImage} />
              ) : (
                <Text style={styles.photoTileHint}>Tap to capture</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completion Evidence</Text>
        <Text style={styles.sectionText}>Take the final face recognition photo, then capture a key-drop photo if the keys are left in a predetermined location.</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => captureEvidence("evidence.driverFace.completion", "completion_face", true)}
        >
          <Text style={styles.actionButtonText}>
            {capturingField === "evidence.driverFace.completion"
              ? "Opening Camera..."
              : completionFaceUri
                ? "Retake Completion Face Photo"
                : "Capture Completion Face Photo"}
          </Text>
        </TouchableOpacity>
        {completionFaceUri ? <Image source={{ uri: completionFaceUri }} style={styles.photoPreview} /> : null}

        <TouchableOpacity
          style={[styles.toggleButton, keyDropRequired && styles.toggleButtonActive]}
          onPress={() => setKeyDropRequired(!keyDropRequired)}
        >
          <Text style={styles.toggleButtonText}>
            {keyDropRequired ? "Keys Left at Predetermined Location: Yes" : "Keys Left at Predetermined Location: No"}
          </Text>
        </TouchableOpacity>

        {keyDropRequired ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => captureEvidence("evidence.keyDrop", "key_drop_photo")}
            >
              <Text style={styles.actionButtonText}>
                {capturingField === "evidence.keyDrop"
                  ? "Opening Camera..."
                  : keyDropPhotoUri
                    ? "Retake Key-Drop Photo"
                    : "Capture Key-Drop Photo"}
              </Text>
            </TouchableOpacity>
            {keyDropPhotoUri ? <Image source={{ uri: keyDropPhotoUri }} style={styles.photoPreview} /> : null}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, !canCompleteRetrieval && styles.disabledButton]}
          disabled={!canCompleteRetrieval}
          onPress={() => handleStatusChange("completed")}
        >
          <Text style={styles.primaryButtonText}>Complete Retrieval</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, styles.quitButton]}
          onPress={() => escalateToAdmin("driver_quit")}
        >
          <Text style={styles.secondaryButtonText}>Driver Quit / Hand Off To Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, styles.violenceButton]}
          onPress={() => escalateToAdmin("violence")}
        >
          <Text style={styles.secondaryButtonText}>Report Violence To Admin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#000",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  loading: { color: "#D4AF37", fontSize: 20 },
  error: { color: "#ff6666", fontSize: 20 },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  label: { color: "#aaa", marginTop: 12 },
  value: { color: "#fff", fontSize: 18, fontWeight: "600" },
  identityPhoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "#444",
    marginTop: 8,
  },
  warning: {
    color: "#FFCC66",
    marginTop: 8,
    fontSize: 13,
  },
  status: { color: "#D4AF37", fontSize: 20, fontWeight: "700", marginTop: 10 },
  actionButton: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#666",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  quitButton: {
    marginTop: 12,
    borderColor: "#B56A00",
    backgroundColor: "#2A1C08",
  },
  violenceButton: {
    marginTop: 12,
    borderColor: "#8B0000",
    backgroundColor: "#2A0E0E",
  },
  disabledButton: {
    opacity: 0.45,
  },
  photoPreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoTile: {
    width: "47%",
    minHeight: 150,
    backgroundColor: "#191919",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2F2F2F",
    padding: 10,
    marginBottom: 12,
  },
  photoTileTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  photoTileHint: {
    color: "#888",
    fontSize: 13,
    marginTop: 20,
  },
  tileImage: {
    width: "100%",
    height: 96,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  timerCard: {
    backgroundColor: "#191919",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303030",
    padding: 14,
    marginTop: 4,
  },
  timerLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
  timerStatus: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  timerValue: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
  },
  toggleButton: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  toggleButtonActive: {
    borderColor: "#D4AF37",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});






