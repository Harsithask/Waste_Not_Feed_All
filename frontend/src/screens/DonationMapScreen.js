import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import * as Location from "expo-location";

// ── Same forest green palette as VolunteerDashboardScreen ──────────
const C = {
  primary:      "#2d6a4f",
  primaryDark:  "#1b4332",
  primaryLight: "#d8f3dc",
  primarySoft:  "#f1faf3",
  primaryMid:   "#74c69d",
  text:         "#1b2d25",
  subtext:      "#4a6560",
  muted:        "#95b5a8",
  border:       "#c8e6d4",
  surface:      "#f6faf7",
  white:        "#ffffff",
};

export default function DonationMapScreen({ route, navigation }) {
  const { donation } = route.params;
  const [loading, setLoading] = useState(false);

  const openMap = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is needed to find your route.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const destination = encodeURIComponent(donation.pickup_location);

      const webUrl     = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}&travelmode=driving`;
      const androidUrl = `google.navigation:q=${destination}&mode=d`;
      const iosUrl     = `maps://maps.apple.com/?saddr=${latitude},${longitude}&daddr=${destination}&dirflg=d`;

      if (Platform.OS === "web") {
        window.open(webUrl, "_blank");
      } else if (Platform.OS === "ios") {
        Linking.openURL(iosUrl).catch(() => Linking.openURL(webUrl));
      } else {
        Linking.openURL(androidUrl).catch(() => Linking.openURL(webUrl));
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Food Item",        value: donation.name },
    { label: "Pickup Location",  value: donation.pickup_location },
    { label: "Contact",          value: donation.contact_no || "N/A" },
    { label: "Quantity",         value: donation.quantity },
    { label: "Expires",          value: donation.expiry ? new Date(donation.expiry).toDateString() : null },
  ].filter(f => f.value);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Get Route</Text>
          <Text style={styles.headerSub}>Navigate to pickup location</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Donation info card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Donation Details</Text>
          {fields.map(f => (
            <View key={f.label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <Text style={styles.fieldValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Info notice */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Your GPS will be used as the starting point</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Google Maps will calculate the fastest route</Text>
          </View>
        </View>

        {/* Navigate button */}
        <TouchableOpacity
          style={[styles.navBtn, loading && styles.navBtnDisabled]}
          onPress={openMap}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.navBtnText}>Open in Google Maps</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.white,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primarySoft,
    justifyContent: "center", alignItems: "center",
  },
  backBtnText:  { fontSize: 18, color: C.primaryDark, fontWeight: "700" },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: C.text },
  headerSub:    { fontSize: 12, color: C.muted, marginTop: 1 },

  body: { padding: 20, gap: 16 },

  card: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  cardLabel: {
    fontSize: 10, fontWeight: "700", color: C.muted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14,
  },
  fieldRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.surface,
  },
  fieldLabel: { fontSize: 13, color: C.muted, fontWeight: "500", flex: 1 },
  fieldValue: { fontSize: 14, color: C.text, fontWeight: "600", flex: 2, textAlign: "right" },

  infoBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 12, padding: 16, gap: 8,
    borderWidth: 1, borderColor: C.primaryMid,
  },
  infoRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  infoDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  infoText: { fontSize: 13, color: C.primaryDark, flex: 1, lineHeight: 18 },

  navBtn: {
    backgroundColor: C.primary,
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 4,
  },
  navBtnDisabled: { opacity: 0.6 },
  navBtnText: { color: C.white, fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
});