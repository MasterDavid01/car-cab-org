import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#000",justifyContent:"center",alignItems:"center"},
  title:{color:"#ff6600",fontSize:24}
});
