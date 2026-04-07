import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function MembershipCheckout() {
  const { tier } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membership Checkout</Text>
      <Text style={styles.text}>Tier: {tier}</Text>
      <Text style={styles.text}>
        This will open Stripe Checkout once the backend is wired.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#D4AF37",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  text: { color: "#fff", fontSize: 16, textAlign: "center", marginTop: 4 },
});





