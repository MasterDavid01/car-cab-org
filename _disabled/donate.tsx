import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";

export default function Donate() {
  const [amount, setAmount] = useState("1.00");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support Car Cab Org</Text>

      <Text style={styles.subtitle}>
        Your donation keeps impaired drivers out of the driver’s seat and people alive on the road.
      </Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            frequency === "one-time" && styles.toggleActive,
          ]}
          onPress={() => setFrequency("one-time")}
        >
          <Text
            style={[
              styles.toggleText,
              frequency === "one-time" && styles.toggleTextActive,
            ]}
          >
            One-time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            frequency === "monthly" && styles.toggleActive,
          ]}
          onPress={() => setFrequency("monthly")}
        >
          <Text
            style={[
              styles.toggleText,
              frequency === "monthly" && styles.toggleTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Enter your donation amount</Text>

      <View style={styles.amountBox}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <TouchableOpacity style={styles.donateButton}>
        <Text style={styles.donateButtonText}>
          Donate ${amount || "0.00"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Monthly donations can be canceled at any time after the first charge. Payments are processed securely by Stripe. Apple Pay and Google Pay are available where supported.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: "#D4AF37",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  toggleActive: {
    backgroundColor: "#D4AF37",
  },
  toggleText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#000",
  },
  label: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D4AF37",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 40,
    alignSelf: "center",
    width: "70%",
  },
  dollarSign: {
    color: "#D4AF37",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  donateButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 25,
  },
  donateButtonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
});
