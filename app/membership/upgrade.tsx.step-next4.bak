import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function UpgradeMembership() {
  const router = useRouter();

  const upgrade = async () => {
    router.push(`/membership/checkout-upgrade?tier=premium`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membership Plan</Text>

      <Text style={styles.subtitle}>
        Car Cab Org offers one membership plan at $24.99 per month with a 12-month commitment after the first payment.
      </Text>

      <View style={styles.card}>
        <Text style={styles.tier}>Active Membership Plan</Text>
        <Text style={styles.price}>$24.99 / month and $3 a mile</Text>
        <Text style={styles.detail}>12-month commitment after first payment</Text>
        <Text style={styles.detail}>Priority nonprofit retrieval support</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={upgrade}
        >
          <Text style={styles.buttonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#D4AF37",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    marginBottom: 16,
  },
  tier: { color: "#D4AF37", fontSize: 20, fontWeight: "700" },
  price: { color: "#D4AF37", fontSize: 18, marginTop: 4 },
  detail: { color: "#D4AF37", fontSize: 14, marginTop: 4 },
  button: {
    marginTop: 12,
    backgroundColor: "#111",
    borderColor: "#D4AF37",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#D4AF37", fontSize: 16, fontWeight: "700" },
});





