import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Platform, Alert,
} from "react-native";
import { addDonation } from "../services/api";
 
const AddDonationScreen = ({ navigation }) => {
  const [foodName,       setFoodName]       = useState("");
  const [foodType,       setFoodType]       = useState("");
  const [pickupAddress,  setPickupAddress]  = useState("");
  const [contactNo,      setContactNo]      = useState("");
  const [expiry,         setExpiry]         = useState("");
  const [quantity,       setQuantity]       = useState("");
  const [description,    setDescription]    = useState("");
  const [donorName,      setDonorName]      = useState("");
  const [loading,        setLoading]        = useState(false);
 
  const handlePostDonation = async () => {
    if (!foodName)      { Alert.alert("Error", "Food name is required!");     return; }
    if (!foodType)      { Alert.alert("Error", "Food type is required!");     return; }
    if (!pickupAddress) { Alert.alert("Error", "Pickup address is required!"); return; }
 
    setLoading(true);
    try {
      // POST /donations
      await addDonation({
        name:            foodName,
        type:            foodType,
        pickup_location: pickupAddress,
        contact_no:      contactNo      || null,
        expiry:          expiry         || null,
        quantity:        quantity ? parseInt(quantity) : null,
        description:     description    || null,
        donor_name:      donorName      || null,
        status:          "available",
      });
 
      Alert.alert("Success", "✅ Donation posted successfully!");
      navigation.goBack();
 
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <ScrollView style={styles.mainWrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Post a Food Donation</Text>
 
        <View style={styles.formCard}>
 
          {/* Row 1 */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Food Name / Title *</Text>
              <TextInput style={styles.input} placeholder="e.g., 5 Trays of Rice and Curry"
                value={foodName} onChangeText={setFoodName} />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Food Type *</Text>
              <TextInput style={styles.input} placeholder="Cooked Food, Groceries, Veg etc."
                value={foodType} onChangeText={setFoodType} />
            </View>
          </View>
 
          {/* Row 2 */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Donor Name</Text>
              <TextInput style={styles.input} placeholder="e.g., Rahul Kumar"
                value={donorName} onChangeText={setDonorName} />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput style={styles.input} placeholder="e.g., 10"
                value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            </View>
          </View>
 
          {/* Row 3 */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput style={styles.input} placeholder="e.g., 9876543210"
                value={contactNo} onChangeText={setContactNo} keyboardType="phone-pad" />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput style={styles.input} placeholder="e.g., 2026-12-31"
                value={expiry} onChangeText={setExpiry} />
            </View>
          </View>
 
          {/* Pickup Address */}
          <View style={styles.fullRow}>
            <Text style={styles.label}>Pickup Address *</Text>
            <TextInput style={[styles.input, styles.textArea]}
              placeholder="Full address for pickup"
              value={pickupAddress} onChangeText={setPickupAddress} multiline numberOfLines={3} />
          </View>
 
          {/* Description */}
          <View style={styles.fullRow}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]}
              placeholder="Any additional details..."
              value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </View>
 
          {/* Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postButton, loading && { opacity: 0.6 }]}
              onPress={handlePostDonation} disabled={loading}>
              <Text style={styles.postButtonText}>
                {loading ? "Posting..." : "✅ Post Donation"}
              </Text>
            </TouchableOpacity>
          </View>
 
        </View>
      </View>
    </ScrollView>
  );
};
 
export default AddDonationScreen;
 
const styles = StyleSheet.create({
  mainWrapper:      { flex: 1, backgroundColor: "#f7f9fc" },
  container:        { width: Platform.OS === "web" ? "90%" : "100%", maxWidth: 1200, paddingHorizontal: 20, paddingVertical: 30, alignSelf: "center" },
  title:            { fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 30 },
  formCard:         { backgroundColor: "#fff", padding: 30, borderRadius: 12, borderWidth: 1, borderColor: "#eaecef" },
  label:            { fontSize: 14, fontWeight: "600", color: "#4a4a4a", marginBottom: 8 },
  input:            { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 15, fontSize: 15, marginBottom: 20 },
  textArea:         { height: 80, textAlignVertical: "top" },
  row:              { flexDirection: Platform.OS === "web" ? "row" : "column", gap: Platform.OS === "web" ? 30 : 0, marginBottom: 10 },
  column:           { flex: Platform.OS === "web" ? 1 : 0 },
  fullRow:          { width: "100%" },
  actionButtons:    { flexDirection: "row", justifyContent: "flex-end", gap: 15, marginTop: 20 },
  cancelButton:     { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 25 },
  cancelButtonText: { fontSize: 16, color: "#555", fontWeight: "600" },
  postButton:       { backgroundColor: "#28a745", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 30 },
  postButtonText:   { fontSize: 16, color: "#fff", fontWeight: "600" },
});