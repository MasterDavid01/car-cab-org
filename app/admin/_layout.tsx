import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";

import { useAuth } from "../../lib/AuthContext";
import { isAuthorizedAdmin } from "../../lib/adminAccess";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isAdminLoginPath = pathname === "/admin/login";

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#D4AF37" />
        <Text style={styles.loadingText}>Checking admin access...</Text>
      </View>
    );
  }

  if (!user) {
    return isAdminLoginPath ? <Stack screenOptions={{ headerShown: false }} /> : <Redirect href="/admin/login" />;
  }

  if (!isAuthorizedAdmin(user)) {
    return isAdminLoginPath ? <Stack screenOptions={{ headerShown: false }} /> : <Redirect href="/admin/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#D4AF37",
    fontSize: 14,
  },
});
