import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { buildApiUrl } from "../lib/apiBase";

export default function Donate() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);

  const handleDonate = async () => {
    try {
      const response = await fetch(buildApiUrl("/create-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(Number(amount) * 100),
          recurring: isMonthly,
          paymentType: "donation",
        }),
      });

      const data = await response.json();

      if (data.url) {
        Alert.alert("Redirecting to Stripe Checkout..."); Linking.openURL(data.url);
      } else {
        Alert.alert("Stripe Error", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Stripe error:", error);
      Alert.alert("Error", "Unable to start donation.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Support Car Cab Org</Text>

      <Text style={styles.subtitle}>
        Your donation keeps impaired drivers out of the driver's seat and people alive on the road.
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setIsMonthly(false)}>
          <Text style={[styles.toggleText, !isMonthly && styles.activeToggle]}>One-time</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsMonthly(true)}>
          <Text style={[styles.toggleText, isMonthly && styles.activeToggle]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Enter your donation amount</Text>

      <View style={styles.amountBox}>
        <Text style={styles.dollar}>$</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder=""
          placeholderTextColor="#FFD700"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleDonate}>
        <Text style={styles.buttonText}>Donate ${amount}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Monthly donations can be canceled at any time after the first charge. Payments are processed
        securely by Stripe. Apple Pay and Google Pay are available where supported.
      </Text>
    </View>
  );
}

const GOLD = "#FFD700";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 30,
    justifyContent: "center",
  },
  title: {
    color: GOLD,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    color: GOLD,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  toggleText: {
    color: GOLD,
    fontSize: 20,
  },
  activeToggle: {
    color: GOLD,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  label: {
    color: GOLD,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: GOLD,
    borderWidth: 2,
    padding: 15,
    marginBottom: 30,
    alignSelf: "center",
    width: "70%",
    borderRadius: 8,
  },
  dollar: {
    color: GOLD,
    fontSize: 22,
    marginRight: 8,
  },
  amountInput: {
    color: GOLD,
    fontSize: 22,
    flex: 1,
  },
  button: {
    backgroundColor: GOLD,
    padding: 18,
    borderRadius: 10,
    alignSelf: "center",
    width: "75%",
    marginTop: 10,
  },
  buttonText: {
    color: "black",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  footer: {
    color: GOLD,
    fontSize: 13,
    textAlign: "center",
    marginTop: 40,
    lineHeight: 18,
    opacity: 0.9,
  },
});
