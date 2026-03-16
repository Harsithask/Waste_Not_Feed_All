import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, Alert,
} from "react-native";
import { getAllDonations, deleteDonation, logoutUser } from "../services/api";
import DonationCard from "../components/DonationCard";
 
// ── Cross-platform helpers ─────────────────────────────────
const crossConfirm = (title, message) => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel",     onPress: () => resolve(false) },
      { text: "OK",     style: "destructive", onPress: () => resolve(true)  },
    ])
  );
};
 
const crossAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};
 
const DonorDashboard = ({ navigation }) => {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
 
  useEffect(() => { fetchDonations(); }, []);
 
  const fetchDonations = async () => {
    try {
      const data = await getAllDonations();
      setDonations(data || []);
    } catch (error) {
      crossAlert("Error", "Could not load donations: " + error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const handleLogout = async () => {
    const ok = await crossConfirm("Logout", "Are you sure you want to logout?");
    if (!ok) return;
    await logoutUser();
    navigation.replace("Login");
  };
 
  const handleDelete = async (id) => {
    const ok = await crossConfirm("Delete Donation", "Delete this donation?");
    if (!ok) return;
    try {
      await deleteDonation(id);
      crossAlert("✅ Deleted!", "Donation deleted successfully.");
      fetchDonations();
    } catch (err) {
      crossAlert("Error", err.message);
    }
  };
 
  return (
    <View style={styles.container}>
 
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🌿 FoodRescue</Text>
        </View>
        <Text style={styles.title}>My Donations</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addButton}
            onPress={() => navigation.navigate("AddDonation")}>
            <Text style={styles.addButtonText}>+ Post New Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
 
      {/* Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>FOOD ITEM</Text>
          <Text style={styles.headerText}>TYPE</Text>
          <Text style={styles.headerText}>EXPIRY DATE</Text>
          <Text style={styles.headerText}>STATUS</Text>
          <Text style={styles.headerText}>ACTIONS</Text>
        </View>
 
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.emptyText}>Loading donations...</Text>
          </View>
        ) : donations.length > 0 ? (
          <FlatList
            data={donations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DonationCard
                donation={item}
                onDelete={() => handleDelete(item.id)}
              />
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍱</Text>
            <Text style={styles.emptyText}>No donations found.</Text>
            <Text style={styles.emptySubText}>
              Click "+ Post New Donation" to add one!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
 
export default DonorDashboard;
 
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#f7f9fc", padding: Platform.OS === "web" ? 40 : 15 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 10 },
  headerLeft:    { flexDirection: "row", alignItems: "center" },
  logo:          { fontSize: 22, fontWeight: "bold", color: "#2e7d32" },
  title:         { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  headerRight:   { flexDirection: "row", alignItems: "center", gap: 12 },
  addButton:     { backgroundColor: "#28a745", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  logoutButton:  { borderWidth: 1, borderColor: "#e53935", backgroundColor: "#ffebee", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  logoutText:    { color: "#e53935", fontWeight: "600", fontSize: 14 },
  tableCard:     { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#eaecef", overflow: "hidden" },
  tableHeader:   { flexDirection: "row", backgroundColor: "#f8f9fa", paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerText:    { flex: 1, fontSize: 12, fontWeight: "700", color: "#6c757d" },
  emptyState:    { padding: 50, alignItems: "center" },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { color: "#999", fontSize: 16, fontWeight: "600" },
  emptySubText:  { color: "#bbb", fontSize: 13, marginTop: 6 },
});