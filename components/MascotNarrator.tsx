import { View, Text, StyleSheet } from "react-native";

export default function MascotNarrator() {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          Welcome to Car Cab Org — let’s get you where you need to go.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  bubble: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    maxWidth: "90%",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
