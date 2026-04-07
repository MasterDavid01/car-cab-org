import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Membership() {
  const [loadingTier, setLoadingTier] = useState<
    null | "basic" | "standard" | "premium"
  >(null);

  const startCheckout = async (tier: "basic" | "standard" | "premium") => {
    try {
      setLoadingTier(tier);

      // TODO: replace with your real Cloud Function URL
      const res = await fetch(
        "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createCheckoutSession",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await res.json();

      if (!data.url) {
        throw new Error("No checkout URL returned");
      }

      await Linking.openURL(data.url);
    } catch (err) {
      Alert.alert("Error", "Unable to start membership checkout.");
    } finally {
      setLoadingTier(null);
    }
  };

  const renderButton = (
    tier: "basic" | "standard" | "premium",
    label: string,
  ) => (
    <TouchableOpacity
      style={styles.button}
      onPress={() => startCheckout(tier)}
      disabled={loadingTier !== null}
    >
      {loadingTier === tier ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support Car Cab Org</Text>

      <View style={styles.card}>
        <Text style={styles.tier}>Basic</Text>
        <Text style={styles.price}>$9.99 / month</Text>
        <Text style={styles.detail}>$3.50 per mile</Text>
        {renderButton("basic", "Choose Basic")}
      </View>

      <View style={styles.card}>
        <Text style={styles.tier}>Standard</Text>
        <Text style={styles.price}>$14.99 / month</Text>
        <Text style={styles.detail}>$3.25 per mile</Text>
        {renderButton("standard", "Choose Standard")}
      </View>

      <View style={styles.card}>
        <Text style={styles.tier}>Premium</Text>
        <Text style={styles.price}>$24.99 / month</Text>
        <Text style={styles.detail}>$3.00 per mile</Text>
        {renderButton("premium", "Choose Premium")}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    marginBottom: 16,
  },
  tier: { color: "#fff", fontSize: 20, fontWeight: "700" },
  price: { color: "#D4AF37", fontSize: 18, marginTop: 4 },
  detail: { color: "#aaa", fontSize: 14, marginTop: 4 },
  button: {
    marginTop: 12,
    backgroundColor: "#D4AF37",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontSize: 16, fontWeight: "700" },
});





