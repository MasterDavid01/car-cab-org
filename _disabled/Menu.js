import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Menu() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("LoginChoice")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Donate")}
      >
        <Text style={styles.buttonText}>Donate</Text>
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
    fontWeight: "700",
    textAlign: "center"
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    width: 260
  },
  buttonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  }
});
