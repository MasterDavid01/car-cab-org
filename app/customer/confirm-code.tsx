import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { buildApiUrl } from "../../lib/apiBase";

export default function ConfirmCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = String(params.phone || "");
  const next = String(params.next || "/customer/membership");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text !== "" && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && code[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const finalCode = code.join("");

    try {
      if (!phone) {
        Alert.alert("Missing Phone", "Phone number was not provided. Please register again.");
        return;
      }

      if (finalCode.length !== 6) {
        Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
        return;
      }

      const response = await fetch(buildApiUrl("/check-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone, code: finalCode }),
      });

      const data = await response.json();
      console.log("Verification result:", data);

      if (response.ok && data.success === true) {
        router.push(next);
      } else {
        Alert.alert("Invalid Code", data?.error || "The code you entered is not valid. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      Alert.alert("Error", "Unable to verify code.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.codeBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyButtonText}>Verify Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 80,
    alignItems: "center",
  },
  title: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 40,
  },
  codeBox: {
    width: 50,
    height: 60,
    backgroundColor: "#D4AF37",
    color: "#000000",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    borderRadius: 6,
  },
  verifyButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "700",
  },
});
