import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { Search, Bell, User, LogOut, HeartHandshake } from "lucide-react-native"; // Make sure to install: npm install lucide-react-native

// Simple Header Component matching the images
const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <HeartHandshake size={28} color="#28a745" />
      <Text style={styles.logoText}>FoodRescue</Text>
    </View>
    <View style={styles.headerCenter}>
      <Text style={styles.navLink}>Dashboard</Text>
      <View style={styles.activeNavLinkWrapper}>
        <Text style={[styles.navLink, styles.activeNavLink]}>Post Donation</Text>
      </View>
      <Text style={styles.navLink}>My Donations</Text>
    </View>
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.iconButton}>
        <Search size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Bell size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <User size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const AddDonationScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [foodType, setFoodType] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");

  // Simplified version without logic, just showing the UI
  const handlePostDonation = () => {
    alert("Post Donation button pressed!");
  };

  return (
    <View style={styles.mainWrapper}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Post a Food Donation</Text>

          {/* Form Container */}
          <View style={styles.formCard}>
            
            {/* Row 1 - Two Columns */}
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Food Name / Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5 Trays of Rice and Curry"
                  value={foodName}
                  onChangeText={setFoodName}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Food Type *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cooked Food, Groceries, Veg etc."
                  value={foodType}
                  onChangeText={setFoodType}
                />
              </View>
            </View>

            {/* Row 2 - Single Column (Pickup Address) */}
            <View style={styles.fullRow}>
              <Text style={styles.label}>Pickup Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full address for pickup (e.g., Coimbatore)"
                value={pickupAddress}
                onChangeText={setPickupAddress}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* In a complete app, you'd add the quantity, unit, and date pickers here... */}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handlePostDonation}>
                <Text style={styles.postButtonText}>Post Donation</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AddDonationScreen;

const styles = StyleSheet.create({
  // Main Wrapper
  mainWrapper: {
    flex: 1,
    backgroundColor: "#f7f9fc", // Light blue/grey background
  },
  scrollContent: {
    paddingVertical: 30,
    alignItems: "center",
  },
  container: {
    width: Platform.OS === "web" ? "90%" : "100%",
    maxWidth: 1200, // Important for centered, fixed-width layout on web
    paddingHorizontal: 20,
  },
  
  // Header / Nav Bar
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    ...Platform.select({
      web: { position: "sticky", top: 0, zIndex: 100 }, // Sticky header for web
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  headerCenter: {
    flexDirection: "row",
    gap: 30,
    alignItems: "center",
  },
  navLink: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  activeNavLinkWrapper: {
    backgroundColor: "#e6f7e9", // Light green background for active link
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeNavLink: {
    color: "#28a745", // Green text color
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  // Form Section
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 30,
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eaecef",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a4a4a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 20,
  },
  textArea: {
    height: Platform.OS === "web" ? "auto" : 80, // Allow expansion on web
    textAlignVertical: "top", // Needed for Android
  },
  
  // Layout Helpers
  row: {
    flexDirection: Platform.OS === "web" ? "row" : "column", // Key for column layout on mobile, row on web
    gap: Platform.OS === "web" ? 30 : 0,
    marginBottom: 10,
  },
  column: {
    flex: Platform.OS === "web" ? 1 : 0, // Split equally on web
  },
  fullRow: {
    width: "100%",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align buttons to the right
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#555",
    fontWeight: "600",
  },
  postButton: {
    backgroundColor: "#28a745", // Green button
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  postButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});