import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

const TERMS_TEXT = `Car Cab Organization Terms and Conditions

These terms of service govern your access to and use of Car Cab Organization services and website. By registering, accessing, or using the service, you agree to be bound by these terms. If you do not agree, do not use the service.

Car Cab Organization is a 501(c)(3) nonprofit organization that provides designated sober drivers to operate your vehicle and deliver it to your locked-in home address. Car Cab Organization is not a transportation carrier, taxi, or rideshare company.

Eligibility and Authority
You confirm you are at least 18 years old, legally able to enter a binding contract, and authorized to grant permissive use of the vehicle.

Fees and Billing
- Retrieval rate: 3.00 USD per mile.
- Membership fee: 24.99 USD per month.
- Wait time fee: 3.00 USD per minute, up to 15 minutes.
- After 15 minutes, retrieval may be terminated and a 45.00 USD termination amount may be charged.
- Mandatory tip: 20% on all completed retrievals.
By using the service, you authorize Car Cab Organization to charge your selected payment method for membership dues, retrieval charges, taxes, fees, and authorized penalties.
If your payment method fails, you remain responsible for unpaid amounts and service may be suspended.

Membership Term and Renewal
The 24.99 USD membership is a 12-month commitment. Early cancellations are not permitted.
To avoid renewal, cancellation notice must be provided at least 30 days before the end of the current 12-month term.
If notice is not received in time, membership automatically renews for another 12-month term, and charges continue to your payment method.

Violence and Threats Policy
If a retrieval is terminated for any violence, attempted violence, threat of violence, intimidation, harassment, or unsafe conduct by you or someone associated with you, the driver may immediately stop service, exit your vehicle, and leave the scene where the incident occurs as safety requires.
In these cases, Car Cab Organization may assess a 500.00 USD safety termination fee to your payment method. From the point of termination, Car Cab Organization and driver personnel have no further duty to complete retrieval or provide additional services, except as required by law.

Your Responsibilities
You grant permissive use and explicit permission for Car Cab Organization personnel to operate your vehicle. You confirm your vehicle is roadworthy, legally registered, and insured as required by law. Your automobile insurance is primary for incidents involving your vehicle, except where non-waivable law requires otherwise.
No illegal activity, prohibited weapons conduct, or threatening behavior is allowed during service.

Limitation of Liability
Services are provided on an as-is and as-available basis. To the fullest extent permitted by law, Car Cab Organization disclaims implied warranties and is not liable for indirect, incidental, special, exemplary, or consequential damages.

Disputes and Law
Billing disputes must be submitted in writing within 15 days of the charge date.
Any dispute arising from these terms or the service will be resolved by binding arbitration in Douglas County, Nebraska, except where prohibited by law. You waive class action participation. Nebraska law governs these terms, without regard to conflict-of-law principles.

Legal Notices
Send legal notices to Car Cab Organization, Inc., 319 S. 17th Street, Suite 416, Omaha, NE 68102, and by email to David@carcab.org.

General Terms
If any part of these terms is unenforceable, the remaining provisions continue in effect. These terms and incorporated policies form the entire agreement regarding service use.

Termination and Updates
Car Cab Organization may deny, suspend, or terminate service at any time for safety, policy violations, suspected fraud, unlawful activity, or nonpayment. Car Cab Organization may update these terms at any time, and continued use constitutes acceptance of updated terms.`;

export default function TermsAcceptScreen() {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) return;
    router.replace("/customer/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <ScrollView style={styles.termsBox}>
        <Text style={styles.termsText}>{TERMS_TEXT}</Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.checkboxRow, accepted && styles.checkboxRowActive]}
        onPress={() => setAccepted(!accepted)}
      >
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>I have read and agree to the Terms & Conditions.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, !accepted && styles.primaryButtonDisabled]}
        onPress={handleAccept}
        disabled={!accepted}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  termsBox: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 16,
    maxHeight: 260,
  },
  termsText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxRowActive: {
    opacity: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#FFD700",
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
