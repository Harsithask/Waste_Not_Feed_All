import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { API } from "../services/api";
import DonationCard from "../components/DonationCard";
import { HeartHandshake } from "lucide-react-native"; // npm install lucide-react-native

const DonorDashboard = ({ navigation }) => {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await API.get("/donations");
        // Check if the response is the array itself or has a .data property
        const dataToSet = res.data ? res.data : res; 
        setDonations(dataToSet);
      } catch (error) {
        console.log("Error fetching:", error);
      }
    };
    fetchDonations();
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. Dashboard Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Donations</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate("AddDonation")}
        >
          <Text style={styles.addButtonText}>+ Post New Donation</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Table Container */}
      <View style={styles.tableCard}>
        {/* Table Header Row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>FOOD ITEM</Text>
          <Text style={styles.headerText}>TYPE</Text>
          <Text style={styles.headerText}>EXPIRY DATE</Text>
          <Text style={styles.headerText}>STATUS</Text>
          <Text style={styles.headerText}>ACTIONS</Text>
        </View>

        {/* List of Items */}
        {donations?.length > 0 ? (
          <FlatList
            data={donations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <DonationCard donation={item} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No donations found.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default DonorDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
    padding: Platform.OS === 'web' ? 40 : 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eaecef",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }
    })
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#6c757d",
  },
  emptyState: {
    padding: 50,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  }
});