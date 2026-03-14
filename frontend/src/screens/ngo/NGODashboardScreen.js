import React from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from "react-native";
import { logoutUser } from "../../services/api";
 
export default function NGODashboardScreen({ navigation, route }) {
  const ngoId = route?.params?.ngoId || "";
 
  const cards = [
    {
      title: "Hunger Hotspots",
      subtitle: "AI-powered map of areas with high food demand",
      icon: "📍", screen: "HungerMap", color: "#E53935",
      params: { ngoId },
    },
    {
      title: "Available Donations",
      subtitle: "Browse & claim food donations from donors",
      icon: "🍱", screen: "AvailableDonations", color: "#4CAF50",
      params: { ngoId },
    },
    {
      title: "Manage Events",
      subtitle: "Create and track pickup/distribution events",
      icon: "📅", screen: "ManageEvents", color: "#2196F3",
      params: { ngoId },
    },
    {
      title: "Assign Volunteers",
      subtitle: "Assign registered volunteers to events",
      icon: "🙋", screen: "AssignVolunteers", color: "#FF9800",
      params: { ngoId },
    },
    {
      title: "My Claims",
      subtitle: "View all donations your NGO has claimed",
      icon: "📦", screen: "MyClaims", color: "#9C27B0",
      params: { ngoId },
    },
  ];
 
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          navigation.replace("Login");
        },
      },
    ]);
  };
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🤝 NGO Dashboard</Text>
          <Text style={styles.headerSub}>Waste Not, Feed All</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
 
      <ScrollView contentContainerStyle={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.screen}
            style={[styles.card, { borderLeftColor: card.color }]}
            onPress={() => navigation.navigate(card.screen, card.params)}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
 
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Text style={styles.logoutCardText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#f0f4f8" },
  header:         { backgroundColor: "#2e7d32", padding: 24, paddingTop: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle:    { fontSize: 26, fontWeight: "bold", color: "#fff" },
  headerSub:      { fontSize: 13, color: "#c8e6c9", marginTop: 4 },
  logoutBtn:      { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  logoutBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  grid:           { padding: 16, gap: 14 },
  card:           { backgroundColor: "#fff", borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", borderLeftWidth: 5, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, gap: 14 },
  cardIcon:       { fontSize: 34 },
  cardText:       { flex: 1 },
  cardTitle:      { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  cardSubtitle:   { fontSize: 13, color: "#666", marginTop: 3 },
  arrow:          { fontSize: 22, color: "#aaa" },
  logoutCard:     { backgroundColor: "#ffebee", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#e53935", marginTop: 6 },
  logoutCardText: { color: "#e53935", fontWeight: "700", fontSize: 15 },
});