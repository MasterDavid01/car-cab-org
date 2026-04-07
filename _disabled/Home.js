import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { activateKeepAwakeAsync } from "expo-keep-awake";

export default function Home({ navigation }) {
  useEffect(() => {
    activateKeepAwakeAsync();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Car Cab</Text>

      <View style={styles.logoFrame}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.mission}>
        Our mission is to protect our community by preventing impaired driving, promoting responsible choices, and educating people about the dangers of operating a vehicle under the influence. Our vehicle-retrieval service provides a safe, judgment-free alternative that helps impaired drivers and their vehicles get home safely while keeping our roadways safer.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Menu")}
      >
        <Text style={styles.buttonText}>Menu</Text>
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
    fontSize: 28,
    marginBottom: 20,
    fontWeight: "600",
    textAlign: "center"
  },

  logoFrame: {
    width: 300,
    height: 300,
    borderRadius: 40,
    borderWidth: 10,
    borderColor: "#D4AF37",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20
  },

  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain"
  },

  mission: {
    color: "#ffcc33",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
    lineHeight: 20
  },

  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10
  },

  buttonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  }
});
