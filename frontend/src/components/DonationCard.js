import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const DonationCard = ({ donation, onViewDetails }) => {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2, fontWeight: "600" }]}>
        {donation.name}
      </Text>

      <Text style={styles.cell}>{donation.type}</Text>

      <Text style={styles.cell}>{donation.expiry || "2026-03-10"}</Text>

      <View style={styles.cell}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{donation.status}</Text>
        </View>
      </View>

      <View style={styles.cell}>
        <TouchableOpacity onPress={() => onViewDetails(donation)}>
          <Text style={{ color: "#007bff", fontWeight: "500" }}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DonationCard;

const styles = StyleSheet.create({
  row: {
  flexDirection: "row",
  backgroundColor: "#fff",
  paddingVertical: 15,
  paddingHorizontal: 15, // Changed from 10 to 15 to match Header
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
  alignItems: "center",
},
cell: {
  flex: 1,
  fontSize: 14,
  color: "#333",
  // Remove textAlign: "left" if you want default behavior, 
  // but ensure it's the same in headerText
},
  statusBadge: {
    backgroundColor: "#e6f7e9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#28a745",
    fontSize: 12,
    fontWeight: "bold",
  },
});