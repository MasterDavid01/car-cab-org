import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from '../../firebaseConfig';
import { uploadRetrievalEvidencePhoto } from "../../lib/storage/uploadRetrievalEvidencePhoto";

export default function NewJobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "retrieval"),
      where("status", "==", "pending_assignment"),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setJobs(data);
    });

    return () => unsubscribe();
  }, []);

  const acceptJob = async (retrievalId: string) => {
    const driver = auth.currentUser;
    if (!driver) {
      Alert.alert("Not Logged In", "Driver must be logged in to accept jobs.");
      return;
    }

    const driverRef = doc(db, "drivers", driver.uid);
    const driverSnap = await getDoc(driverRef);

    if (!driverSnap.exists()) {
      Alert.alert("Driver Profile Missing", "No driver profile found.");
      return;
    }

    const driverData = driverSnap.data();

    const retrievalRef = doc(db, "retrieval", retrievalId);
    const retrievalSnap = await getDoc(retrievalRef);

    if (!retrievalSnap.exists()) {
      Alert.alert("Error", "Retrieval no longer exists.");
      return;
    }

    const current = retrievalSnap.data();

    if (current.status !== "pending_assignment") {
      Alert.alert("Already Assigned", "This job has already been taken.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera Access Needed", "Driver face verification is required when accepting a retrieval.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets.length) {
      Alert.alert("Acceptance Incomplete", "Driver face verification is required to accept this retrieval.");
      return;
    }

    const localUri = result.assets[0].uri;
    const uploadResult = await uploadRetrievalEvidencePhoto({
      retrievalId,
      category: "acceptance_face",
      localUri,
    });

    await updateDoc(retrievalRef, {
      status: "assigned",
      assignedDriverId: driver.uid,
      assignedDriverName: driverData.name || driver.displayName || driver.email || "Driver",
      assignedDriverNumber: driverData.employeeDriverNumber || driverData.driverNumber || null,
      assignedDriverPhone: driverData.phone || driver.phoneNumber || null,
      assignedDriverProfilePhotoUrl: driverData.profilePhotoUrl || driver.photoURL || null,
      "evidence.driverFace.acceptance": {
        localUri,
        fileURL: uploadResult.downloadURL,
        storagePath: uploadResult.storagePath,
        label: "acceptance_face",
        capturedAt: serverTimestamp(),
        capturedAtIso: new Date().toISOString(),
      },
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    Alert.alert("Success", "You have accepted this job.", [
      {
        text: "Open Retrieval",
        onPress: () => router.push({ pathname: "/driver/assigned", params: { id: retrievalId } }),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New Jobs</Text>

      {jobs.length === 0 ? (
        <Text style={styles.empty}>No pending jobs right now.</Text>
      ) : (
        jobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.value}>{job.pickup || "Not set"}</Text>

            <Text style={styles.label}>Dropoff</Text>
            <Text style={styles.value}>{job.lockedHomeAddress || job.dropoff || "Not set"}</Text>

            <Text style={styles.label}>Mileage</Text>
            <Text style={styles.value}>{Number(job.pricing?.distanceMiles || job.tracking?.liveMileageMiles || 0).toFixed(2)} miles</Text>

            <Text style={styles.label}>Estimated Cost</Text>
            <Text style={styles.value}>${Number(job.pricing?.totalCharge || 0).toFixed(2)}</Text>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                job.status !== "pending_assignment" && styles.disabledButton,
              ]}
              disabled={job.status !== "pending_assignment"}
              onPress={() =>
                Alert.alert(
                  "Accept Job",
                  "Are you sure you want to accept this retrieval?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Accept",
                      style: "destructive",
                      onPress: () => acceptJob(job.id),
                    },
                  ],
                )
              }
            >
              <Text
                style={[
                  styles.acceptText,
                  job.status !== "pending" && styles.disabledText,
                ]}
              >
                {job.status === "pending_assignment" ? "Accept Job" : "Assigned"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#000",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  empty: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 10,
  },
  value: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
  },
  acceptButton: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  acceptText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  disabledText: {
    color: "#222",
  },
});






