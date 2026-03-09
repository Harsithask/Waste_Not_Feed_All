import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

const DonationCard = ({ donation }) => {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2, fontWeight: '600' }]}>{donation.name}</Text>
      <Text style={styles.cell}>{donation.type}</Text>
      <Text style={styles.cell}>{donation.expiry || "2026-03-10"}</Text>
      <View style={styles.cell}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{donation.status}</Text>
        </View>
      </View>
      <Text style={[styles.cell, { color: '#007bff' }]}>View Details</Text>
    </View>
  );
};

export default DonationCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "left",
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