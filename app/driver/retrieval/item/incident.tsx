import { db } from "../../../../firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function IncidentReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Replace with real auth context later
  const driverId = "DRIVER_AUTH_UID";

  async function submitIncident() {
    if (!notes.trim()) return;

    setSubmitting(true);

    try {
      const retrievalId = Array.isArray(id) ? id[0] : id;

      await addDoc(collection(db, "incidents"), {
        retrievalId,
        driverId,
        notes,
        createdAt: serverTimestamp(),
      });

      router.back();
    } catch (error) {
      console.error("Error submitting incident:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        Report an Issue
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Describe the issue or incident:
      </Text>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Describe what happened..."
        placeholderTextColor="#888"
        multiline
        style={{
          backgroundColor: "#f2f2f2",
          padding: 12,
          borderRadius: 10,
          height: 150,
          textAlignVertical: "top",
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={submitIncident}
        disabled={submitting}
        style={{
          backgroundColor: submitting ? "#555" : "#000",
          padding: 16,
          borderRadius: 12,
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#FFD700" />
        ) : (
          <Text
            style={{
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Submit Report
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}




