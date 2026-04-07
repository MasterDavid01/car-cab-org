import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { auth } from '../../firebaseConfig'; // ✅ CORRECT PATH FOR app/(tabs)/login.tsx

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      Alert.alert("Success", "Logged in successfully!");
      router.replace("/"); // Go to Home
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        placeholderTextColor="#dddddd"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#dddddd"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={styles.registerButton}
      >
        <Text style={styles.registerButtonText}>Create an Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/")}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
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
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#444",
  },
  button: {
    backgroundColor: "#D4AF37", // metallic gold
    padding: 14,
    borderRadius: 8,
    marginTop: 25,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  registerButton: {
    marginTop: 20,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
});






