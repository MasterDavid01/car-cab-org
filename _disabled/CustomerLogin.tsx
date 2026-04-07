import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function CustomerLogin() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleManualSignIn = () => {
    navigation.navigate("FaceRecognition");
  };

  const handleFaceSignIn = () => {
    navigation.navigate("FaceRecognition");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ffcc33"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ffcc33"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.buttonGold} onPress={handleManualSignIn}>
        <Text style={styles.buttonGoldText}>Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity style={styles.buttonBlack} onPress={handleFaceSignIn}>
        <Text style={styles.buttonBlackText}>Sign In with Face Recognition</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderWidth: 6,
    borderColor: "#D4AF37",
    borderRadius: 20,
    margin: 10,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.9,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 30
  },
  title: {
    color: "#ffcc33",
    fontSize: 32,
    marginBottom: 30,
    fontWeight: "700"
  },
  input: {
    width: "85%",
    borderWidth: 2,
    borderColor: "#D4AF37",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    color: "#ffcc33",
    fontSize: 18
  },
  buttonGold: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
    width: 260,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10
  },
  buttonGoldText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  orText: {
    color: "#ffcc33",
    fontSize: 18,
    marginVertical: 15,
    fontWeight: "600"
  },
  buttonBlack: {
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: 260,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10
  },
  buttonBlackText: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  }
});
