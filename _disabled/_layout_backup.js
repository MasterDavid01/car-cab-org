import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#FFD166",
        tabBarStyle: { backgroundColor: "#000" },
        tabBarActiveTintColor: "#FFD166",
        tabBarInactiveTintColor: "#777",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="request" options={{ title: "Request Pickup" }} />
      <Tabs.Screen name="safety" options={{ title: "Driver Safety" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
