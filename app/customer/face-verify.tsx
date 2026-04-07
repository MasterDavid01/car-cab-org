import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../lib/AuthContext";

type DriverCandidate = {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  distanceMiles: number;
  gridBand: number;
};

export default function CustomerFaceVerifyScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLat = Number(params.requestLat || 0);
  const requestLng = Number(params.requestLng || 0);
  const homeLat = Number(params.homeLat || 0);
  const homeLng = Number(params.homeLng || 0);
  const homeAddress = String(params.homeAddress || "Locked home address on file");
  const distanceMiles = Number(params.distanceMiles || 0);
  const originalEstimatedMinutes = Number(params.originalEstimatedMinutes || 0);
  const baseCharge = Number(params.baseCharge || 0);
  const tipCharge = Number(params.tipCharge || 0);
  const totalCharge = Number(params.totalCharge || 0);

  const handleCaptureFace = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera Access Needed", "Please allow camera access to complete face verification.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open the camera right now.");
    }
  };

  const handleConfirm = async () => {
    if (!imageUri) {
      Alert.alert("Face Verification Required", "Please capture a face photo before continuing.");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Session Error", "Please sign in again before confirming retrieval.");
      return;
    }

    const customerProfilePhotoUrl = String(user.photoURL || "").trim();
    if (!customerProfilePhotoUrl) {
      Alert.alert(
        "Profile Photo Required",
        "Please add a profile picture to your customer account before requesting retrieval so your driver can identify you at pickup."
      );
      return;
    }

    setLoading(true);

    try {
      const nearestDriver = await findNearestAvailableDriver(requestLat, requestLng);

      const retrievalRef = await addDoc(collection(db, "retrieval"), {
        customerId: user.uid,
        customerName: user.displayName || null,
        customerEmail: user.email || null,
        customerPhone: user.phoneNumber || null,
        customerProfilePhotoUrl,
        status: nearestDriver ? "en_route" : "pending_assignment",
        adminReviewStatus: "unreviewed",
        assignedDriverId: nearestDriver?.id || null,
        assignedDriverName: nearestDriver?.name || null,
        assignedDriverProfilePhotoUrl: nearestDriver?.profilePhotoUrl || null,
        diverted: false,
        pickup: `${requestLat.toFixed(5)}, ${requestLng.toFixed(5)}`,
        dropoff: homeAddress,
        requestLocation: {
          latitude: requestLat,
          longitude: requestLng,
        },
        destinationLocation: {
          latitude: homeLat,
          longitude: homeLng,
        },
        lockedHomeAddress: homeAddress,
        pricing: {
          distanceMiles,
          originalEstimatedMinutes,
          perMileRate: 3,
          detourMinuteRate: 3,
          firstMileMinimum: 30,
          mileageCharge: baseCharge,
          baseCharge,
          tipPercent: 20,
          tipCharge,
          subtotalBeforeTip: baseCharge,
          totalCharge,
          currency: "USD",
        },
        billing: {
          chargeAtCompletion: true,
          chargeStatus: "pending_saved_payment_method",
        },
        detour: {
          status: "idle",
          reason: null,
          verificationChannel: "sms",
          requestedAtIso: null,
          startedAtIso: null,
          endedAtIso: null,
        },
        routing: {
          focusAddress: homeAddress,
          focusType: "locked_home_address",
          rerouteRequestedAtIso: null,
        },
        workflow: {
          requiresDriverAcceptanceFace: true,
          requiresDetourFaceVerification: true,
          requiresVehiclePhotosBeforeRetrieval: true,
          requiresVehiclePhotosAfterParking: true,
          requiresCompletionFace: true,
          keysLeftAtPredeterminedLocation: false,
        },
        evidence: {
          driverFace: {
            acceptance: null,
            detour: null,
            completion: null,
          },
          vehicle: {
            before: {
              front: null,
              driverSide: null,
              passengerSide: null,
              rear: null,
            },
            after: {
              front: null,
              driverSide: null,
              passengerSide: null,
              rear: null,
            },
          },
          keyDrop: null,
        },
        faceVerification: {
          captured: true,
          imageCapturedAt: serverTimestamp(),
        },
        assignment: nearestDriver
          ? {
              strategy: "closest_available_driver_mile_grid",
              requiresMutualProfilePhotos: true,
              customerProfilePhotoUrl,
              driverProfilePhotoUrl: nearestDriver.profilePhotoUrl,
              gridBandMiles: nearestDriver.gridBand,
              driverDistanceFromPickupMiles: Number(nearestDriver.distanceMiles.toFixed(2)),
              assignedAt: serverTimestamp(),
            }
          : {
              strategy: "closest_available_driver_mile_grid",
              requiresMutualProfilePhotos: true,
              pendingReason: "no_available_driver_with_profile_photo",
            },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setLoading(false);
      router.replace({
        pathname: "/customer/status",
        params: {
          requestId: retrievalRef.id,
          totalCharge: totalCharge.toFixed(2),
          distanceMiles: distanceMiles.toFixed(2),
        },
      });
    } catch (error) {
      console.error("Failed to submit retrieval request:", error);
      setLoading(false);
      Alert.alert("Submission Failed", "Unable to submit retrieval request right now. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Verification</Text>
      <Text style={styles.subtitle}>
        Capture a live face image to confirm this retrieval request is being made by the customer.
      </Text>

      <View style={styles.priceCard}>
        <Text style={styles.priceTitle}>Confirmed Retrieval Charges</Text>
        <Text style={styles.priceLine}>Distance: {distanceMiles.toFixed(2)} miles</Text>
        <Text style={styles.priceLine}>Estimated direct-route time: {originalEstimatedMinutes} minutes</Text>
        <Text style={styles.priceLine}>Base: first mile minimum 30.00 USD, then 3.00 USD/mile</Text>
        <Text style={styles.priceLine}>Mandatory 20% tip: ${tipCharge.toFixed(2)}</Text>
        <Text style={styles.priceTotal}>Total: ${totalCharge.toFixed(2)}</Text>
        <Text style={styles.priceLine}>Drop-off: {homeAddress}</Text>
      </View>

      <View style={styles.previewCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.previewPlaceholder}>No face image captured yet.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCaptureFace}>
        <Text style={styles.primaryButtonText}>{imageUri ? "Retake Face Photo" : "Capture Face Photo"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>{loading ? "Confirming..." : "Confirm Retrieval Request"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingTop: 36,
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
    marginBottom: 14,
    lineHeight: 22,
  },
  priceCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  priceTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceLine: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 6,
  },
  priceTotal: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewCard: {
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButton: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmButtonText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

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

function readDriverCoordinate(driverData: any): { latitude: number; longitude: number } | null {
  if (driverData?.currentLocation?.latitude && driverData?.currentLocation?.longitude) {
    return {
      latitude: Number(driverData.currentLocation.latitude),
      longitude: Number(driverData.currentLocation.longitude),
    };
  }

  if (driverData?.location?.latitude && driverData?.location?.longitude) {
    return {
      latitude: Number(driverData.location.latitude),
      longitude: Number(driverData.location.longitude),
    };
  }

  if (driverData?.latitude && driverData?.longitude) {
    return {
      latitude: Number(driverData.latitude),
      longitude: Number(driverData.longitude),
    };
  }

  return null;
}

function readDriverProfilePhotoUrl(driverData: any): string | null {
  const candidates = [
    driverData?.profilePhotoUrl,
    driverData?.photoURL,
    driverData?.photoUrl,
    driverData?.avatarUrl,
    driverData?.profile?.photoUrl,
    driverData?.profile?.photoURL,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
  }

  return null;
}

async function findNearestAvailableDriver(requestLat: number, requestLng: number): Promise<DriverCandidate | null> {
  const driverSnapshot = await getDocs(collection(db, "drivers"));
  const candidates: DriverCandidate[] = [];

  for (const driverDoc of driverSnapshot.docs) {
    const data = driverDoc.data() as any;
    const availability = data?.availability || {};
    const isAvailable =
      availability?.isAvailable === true ||
      data?.isAvailable === true ||
      data?.status === "available";

    if (!isAvailable) {
      continue;
    }

    let coords = readDriverCoordinate(data);

    if (!coords) {
      const locationSnap = await getDoc(doc(db, "drivers", driverDoc.id, "location", "current"));
      if (locationSnap.exists()) {
        coords = readDriverCoordinate(locationSnap.data());
      }
    }

    if (!coords) {
      continue;
    }

    const distanceMiles = haversineMiles(requestLat, requestLng, coords.latitude, coords.longitude);
    const profilePhotoUrl = readDriverProfilePhotoUrl(data);
    if (!profilePhotoUrl) {
      continue;
    }

    candidates.push({
      id: driverDoc.id,
      name: String(data?.name || data?.displayName || data?.fullName || driverDoc.id),
      profilePhotoUrl,
      distanceMiles,
      gridBand: Math.floor(distanceMiles),
    });
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.gridBand !== b.gridBand) return a.gridBand - b.gridBand;
    return a.distanceMiles - b.distanceMiles;
  });

  return candidates[0];
}
