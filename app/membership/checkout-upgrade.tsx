import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { buildApiUrl } from "../../lib/apiBase";
import { useAuth } from "../../lib/AuthContext";

export default function CheckoutUpgradeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const startUpgrade = async () => {
    setLoading(true);

    try {
      // Reuse the same Stripe checkout endpoint as the Donate flow.
      const response = await fetch(buildApiUrl("/create-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 2499,
          recurring: true,
          paymentType: "membership",
          customerId: user?.uid || null,
          payerName: user?.displayName || "",
          payerEmail: user?.email || "",
          payerPhone: user?.phoneNumber || "",
        }),
      });
      const data = await response.json();

      if (data?.url) {
        Linking.openURL(data.url);
      } else {
        Alert.alert("Error", "Unable to start membership payment.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      Alert.alert("Error", "Something went wrong starting the upgrade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membership Checkout</Text>

      <Text style={styles.subtitle}>
        You are enrolling in the <Text style={styles.highlight}>$24.99/month</Text> Car Cab Org membership plan.
      </Text>

      <Text style={styles.commitmentText}>
        This membership includes a 12-month commitment after the first payment and $3 a mile for retrievals.
      </Text>

      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={startUpgrade}
        disabled={loading}
      >
        <Text style={styles.upgradeText}>
          {loading ? "Processing..." : "Start Membership Payment"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    color: "#FFD700",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 16,
  },
  commitmentText: {
    fontSize: 15,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 24,
  },
  highlight: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  upgradeButton: {
    backgroundColor: "#FFD700",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  upgradeText: {
    color: "#000",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  backText: {
    color: "#FFD700",
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
  },
});






