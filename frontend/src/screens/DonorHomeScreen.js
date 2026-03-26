import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ImageBackground, ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function DonorHomeScreen({ navigation, route }) {
  const donorId = route?.params?.donorId || "";

  const cards = [
    {
      icon:    "qr-code-scanner",
      label:   "Scan & Donate",
      desc:    "Scan your pantry items and donate food that's about to expire",
      action:  "Get Started →",
      screen:  "ScanScreen",
      color:   "#2ECC71",
    },
    {
      icon:    "list-alt",
      label:   "My Donations",
      desc:    "View and manage all your posted food donations",
      action:  "View All →",
      // ✅ Pass donorId so DonorDashboard can load notifications
      screen:  "DonorDashboard",
      color:   "#3498db",
    },
    {
      icon:    "add-circle-outline",
      label:   "Post a Donation",
      desc:    "List food you'd like to donate for NGOs to collect",
      action:  "Post Now →",
      screen:  "AddDonation",
      color:   "#e67e22",
    },
    {
      icon:    "person-outline",
      label:   "My Profile",
      desc:    "View and update your donor profile details",
      action:  "View Profile →",
      screen:  "DonorProfile",
      color:   "#9b59b6",
    },
  ];

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1604200657090-ae45994b2451" }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <MaterialIcons name="volunteer-activism" size={28} color="#2ECC71" />
            <Text style={styles.logo}>FoodRescue</Text>
          </View>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </View>

        {/* Cards */}
        <ScrollView
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card) => (
            <TouchableOpacity
              key={card.screen}
              style={styles.card}
              // ✅ Always passes donorId to every screen
              onPress={() => navigation.navigate(card.screen, { donorId })}
              activeOpacity={0.85}
            >
              <View style={[styles.accentBar, { backgroundColor: card.color }]} />
              <View style={styles.cardInner}>
                <View style={[styles.iconCircle, { backgroundColor: card.color }]}>
                  <MaterialIcons name={card.icon} size={24} color="#fff" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.label}</Text>
                  <Text style={styles.cardDesc}>{card.desc}</Text>
                </View>
                <View style={[styles.cardArrow, { borderColor: card.color }]}>
                  <Text style={[styles.cardArrowText, { color: card.color }]}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.replace("Login")}
        >
          <MaterialIcons name="logout" size={16} color="#aaa" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background:    { flex: 1 },
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", paddingHorizontal: 40, paddingVertical: 80 },
  header:        { alignItems: "center", marginTop: 70, marginBottom: 28 },
  logoRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  logo:          { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle:      { fontSize: 15, color: "#ccc", textAlign: "center" },
  cardContainer: { width: "100%", maxWidth: 440, gap: 14, paddingBottom: 100 },
  card:          { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 16, overflow: "hidden" },
  accentBar:     { width: 5 },
  cardInner:     { flex: 1, flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  iconCircle:    { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  cardText:      { flex: 1 },
  cardTitle:     { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 4 },
  cardDesc:      { fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 17 },
  cardArrow:     { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  cardArrowText: { fontSize: 16, fontWeight: "700" },
  logoutBtn:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  logoutText:    { color: "#aaa", fontSize: 14 },
});