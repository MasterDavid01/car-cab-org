import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

type ResourceItem = {
  title: string;
  description: string;
  phone?: string;
  url?: string;
  color: string;
};

const RESOURCES: ResourceItem[] = [
  {
    title: "National Suicide & Crisis Lifeline",
    description: "24/7 free confidential support for people in distress. Call or text 988.",
    phone: "988",
    color: "#B56A00",
  },
  {
    title: "SAMHSA Helpline (Substance Abuse)",
    description: "Free, confidential, 24/7 treatment referral and information service for people facing substance use disorders.",
    phone: "18006624357",
    color: "#1F6FEB",
  },
  {
    title: "Alcoholics Anonymous (AA)",
    description: "Find a meeting, sponsor, or talk to someone about alcohol addiction today.",
    url: "https://www.aa.org",
    color: "#2E8B57",
  },
  {
    title: "MADD — Mothers Against Drunk Driving",
    description: "Victim support, advocacy resources, and help for those impacted by impaired driving.",
    url: "https://www.madd.org",
    color: "#8A63D2",
  },
  {
    title: "Nebraska Alcoholism & Drug Helpline",
    description: "Nebraska-specific resource for substance use support and treatment referrals.",
    phone: "18009289988",
    color: "#B56A00",
  },
  {
    title: "DUI Legal Aid — Nebraska",
    description: "Information on DUI charges, license reinstatement, and legal defense resources in Nebraska.",
    url: "https://alcohol.org/dui/nebraska",
    color: "#CC2222",
  },
  {
    title: "Al-Anon (Support for Families)",
    description: "Support for families and friends of people with alcohol problems.",
    url: "https://al-anon.org",
    color: "#D4AF37",
  },
  {
    title: "Text HOME to Crisis Text Line",
    description: "Text-based 24/7 crisis counseling. Free and confidential. Text HOME to 741741.",
    phone: "smsto:741741:HOME",
    color: "#2E8B57",
  },
  {
    title: "Nebraska DHHS Behavioral Health",
    description: "State treatment services, mental health support, and crisis resources for Nebraska residents.",
    url: "https://dhhs.ne.gov/Pages/Behavioral-Health.aspx",
    color: "#1F6FEB",
  },
];

export default function SafetyResourcesScreen() {
  const router = useRouter();

  const openLink = (item: ResourceItem) => {
    if (item.phone) {
      const scheme = item.phone.startsWith("smsto:") ? item.phone : `tel:${item.phone}`;
      Linking.openURL(scheme).catch(() =>
        alert(`Please dial ${item.phone} directly from your phone.`)
      );
    } else if (item.url) {
      Linking.openURL(item.url).catch(() =>
        alert(`Please visit ${item.url} in your browser.`)
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Safety & Support Resources</Text>
      <Text style={styles.subtitle}>
        Car Cab Org is dedicated to saving lives beyond just providing a safe ride home. These resources are here for you
        or someone you love — free, confidential, and available right now.
      </Text>

      <View style={styles.emergencyBanner}>
        <Text style={styles.emergencyTitle}>🚨 In Immediate Danger? Call 911</Text>
        <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL("tel:911")}>
          <Text style={styles.callButtonText}>Call 911 Now</Text>
        </TouchableOpacity>
      </View>

      {RESOURCES.map((item, index) => (
        <View key={index} style={[styles.card, { borderLeftColor: item.color }]}>
          <Text style={[styles.resourceTitle, { color: item.color }]}>{item.title}</Text>
          <Text style={styles.resourceDescription}>{item.description}</Text>
          {item.phone || item.url ? (
            <TouchableOpacity style={[styles.resourceButton, { borderColor: item.color }]} onPress={() => openLink(item)}>
              <Text style={[styles.resourceButtonText, { color: item.color }]}>
                {item.phone
                  ? item.phone.startsWith("smsto:")
                    ? "Text for Help"
                    : "Call Now"
                  : "Visit Website"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}

      <View style={styles.missionCard}>
        <Text style={styles.missionTitle}>Our Mission</Text>
        <Text style={styles.missionBody}>
          Car Cab Organization is a nonprofit dedicated to preventing impaired driving fatalities. Every retrieval we
          complete is potentially a life saved. If you or someone you know needs help with alcohol or substance use,
          please reach out to one of the resources above.
        </Text>
        <Text style={styles.missionBody}>
          Tax ID: 99-3785909 | david@carcab.org | carcab.org
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    marginTop: 20,
  },
  backButtonText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  emergencyBanner: {
    backgroundColor: "#1A0000",
    borderWidth: 1,
    borderColor: "#CC2222",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  emergencyTitle: {
    color: "#FF4444",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  callButton: {
    backgroundColor: "#CC2222",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 14,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  resourceDescription: {
    color: "#CCCCCC",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  resourceButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  resourceButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  missionCard: {
    backgroundColor: "#0A0A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333355",
    padding: 16,
    marginTop: 10,
  },
  missionTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  missionBody: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
});
