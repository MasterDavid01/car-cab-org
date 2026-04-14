import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from '../../../firebaseConfig';

export default function BookPickup() {
  const router = useRouter();
  const auth = getAuth();

  const [pickup, setPickup] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  useEffect(() => {
    const loadHomeAddress = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setHomeAddress(snap.data().homeAddress);
      }
    };

    loadHomeAddress();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Retrieval</Text>

      <TextInput
        style={styles.input}
        placeholder="Pickup Location"
        placeholderTextColor="#666"
        value={pickup}
        onChangeText={setPickup}
      />

      {/* LOCKED DROPOFF FIELD */}
      <TextInput
        style={[styles.input, styles.locked]}
        value={homeAddress}
        editable={false}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../customer/book/confirm")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 20 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 20,
  },
  locked: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});






