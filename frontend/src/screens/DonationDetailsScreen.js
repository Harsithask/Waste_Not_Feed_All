import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value ?? "—"}</Text>
  </View>
);

const StatusBadge = ({ status }) => {
  const map = {
    available: { bg: "#e6f7e9", fg: "#1e7e34", text: "Available" },
    assigned: { bg: "#fff3cd", fg: "#856404", text: "Assigned" },
    picked_up: { bg: "#d1ecf1", fg: "#0c5460", text: "Picked Up" },
    delivered: { bg: "#d4edda", fg: "#155724", text: "Delivered" },
    claimed: { bg: "#f8d7da", fg: "#721c24", text: "Claimed" },
  };
  const s = map[status] || { bg: "#eee", fg: "#333", text: status };

  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.text}</Text>
    </View>
  );
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return d;
  }
};

const DonationDetailsScreen = ({ route, navigation }) => {
  const { donation } = route.params;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
    >
      {/* Back Navigation Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007bff" />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Donation Details</Text>

      {/* 1. Food Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Food Information</Text>
        <Row label="Food Item" value={donation.name} />
        <Row label="Type" value={donation.type} />
        <Row label="Expiry Date" value={donation.expiry} />
      </View>

      {/* 2. Pickup Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pickup Information</Text>
        <Row label="Location" value={donation.pickup_location} />
        <Row label="Contact" value={donation.contact_no} />
      </View>

      {/* 3. Tracking Section (MISSING DETAILS ADDED HERE) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tracking & Status</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Current Status</Text>
          <StatusBadge status={donation.status} />
        </View>
        
        <Row label="Claimed By" value={donation.claimed_by} />
        <Row label="Volunteer ID" value={donation.volunteer_id} />
        <Row label="Assigned At" value={formatDate(donation.assigned_at)} />
        <Row label="Picked Up At" value={formatDate(donation.picked_up_at)} />
        <Row label="Delivered At" value={formatDate(donation.delivered_at)} />
      </View>

      {/* 4. Metadata */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>System Info</Text>
        <Row label="Donation ID" value={`#${donation.id}`} />
        <Row label="Posted On" value={formatDate(donation.created_at)} />
        <Row label="Last Updated" value={formatDate(donation.updated_at)} />
      </View>
    </ScrollView>
  );
};

export default DonationDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fb",
    // REMOVED padding: 20 from here
  },
  scrollContent: {
    padding: 20, 
    paddingBottom: 80, // Increased for better web scrolling
    flexGrow: 1, 
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backText: {
    fontSize: 16,
    color: "#007bff",
    marginLeft: 8,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#28a745", // Green theme for section headers
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
});