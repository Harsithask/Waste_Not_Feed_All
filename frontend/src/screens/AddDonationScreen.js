import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Platform,
} from "react-native";
import { Search, Bell, User, HeartHandshake } from "lucide-react-native";
import { API, logoutUser } from "../services/api";

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────

const FOOD_TYPES = [
  "Cooked Food", "Groceries", "Vegetables", "Fruits",
  "Dairy", "Bakery", "Beverages", "Packed Food", "Other",
];

const isValidDate = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d);
};

const isFutureDate = (str) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(str) >= today;
};

const isValidPhone = (str) => /^[6-9]\d{9}$/.test(str.trim());

// ─────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────

const Header = ({ navigation, donorId }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <HeartHandshake size={28} color="#28a745" />
      <Text style={styles.logoText}>FoodRescue</Text>
    </View>

    <View style={styles.headerCenter}>
      <TouchableOpacity onPress={() => navigation.navigate("DonorHome", { donorId })}>
        <Text style={styles.navLink}>Dashboard</Text>
      </TouchableOpacity>
      <View style={styles.activeNavLinkWrapper}>
        <Text style={[styles.navLink, styles.activeNavLink]}>Post Donation</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("DonorDashboard", { donorId })}>
        <Text style={styles.navLink}>My Donations</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.iconButton}>
        <Search size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Bell size={20} color="#555" />
      </TouchableOpacity>

      {/* Profile icon — navigates to DonorProfile */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("DonorProfile", { donorId })}
      >
        <User size={20} color="#555" />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          try { await logoutUser(); } catch (e) { console.warn(e); }
          navigation.replace("Login");
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Field error display
// ─────────────────────────────────────────────

const FieldError = ({ msg }) =>
  msg ? <Text style={styles.errorText}>⚠ {msg}</Text> : null;

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const AddDonationScreen = ({ navigation, route }) => {

  const donorId = route?.params?.donorId || "";

  const [form, setForm] = useState({
    name:            "",
    type:            "",
    expiry:          "",
    pickup_location: "",
    contact_no:      "",
    quantity:        "",
  });

  const [errors,         setErrors]         = useState({});
  const [submitting,     setSubmitting]     = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  // ── Validation ────────────────────────────
  const validate = () => {
    const e = {};

    if (!form.name.trim())
      e.name = "Food name is required";
    else if (form.name.trim().length < 3)
      e.name = "Name must be at least 3 characters";

    if (!form.type.trim())
      e.type = "Please select a food type";

    if (!form.expiry.trim())
      e.expiry = "Expiry date is required (YYYY-MM-DD)";
    else if (!isValidDate(form.expiry))
      e.expiry = "Invalid date — use format YYYY-MM-DD";
    else if (!isFutureDate(form.expiry))
      e.expiry = "Expiry date must be today or in the future";

    if (!form.pickup_location.trim())
      e.pickup_location = "Pickup address is required";
    else if (form.pickup_location.trim().length < 10)
      e.pickup_location = "Please enter a more complete address";

    if (!form.contact_no.trim())
      e.contact_no = "Contact number is required";
    else if (!isValidPhone(form.contact_no))
      e.contact_no = "Enter a valid 10-digit Indian mobile number";

    if (form.quantity.trim() !== "") {
      const qty = Number(form.quantity);
      if (!Number.isInteger(qty) || qty <= 0)
        e.quantity = "Quantity must be a positive whole number";
      else if (qty > 10000)
        e.quantity = "Quantity seems too large — please check";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────
  const handlePostDonation = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name:            form.name.trim(),
        type:            form.type.trim(),
        expiry:          form.expiry.trim(),
        pickup_location: form.pickup_location.trim(),
        contact_no:      form.contact_no.trim(),
        // ✅ FIX: include donor_id so backend can send notifications to donor
        donor_id:        donorId,
      };

      if (form.quantity.trim() !== "") {
        payload.quantity = parseInt(form.quantity, 10);
      }

      await API.post("/donations", payload);
      alert("✅ Donation posted successfully!");
      navigation.navigate("DonorDashboard", { donorId });

    } catch (error) {
      alert("Failed to post donation: " + (error?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────
  return (
    <View style={styles.mainWrapper}>

      <Header navigation={navigation} donorId={donorId} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Post a Food Donation</Text>

          <View style={styles.formCard}>

            {/* Row 1 — Food Name + Food Type */}
            <View style={styles.row}>

              {/* Food Name */}
              <View style={styles.column}>
                <Text style={styles.label}>
                  Food Name / Title <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g., 5 Trays of Rice and Curry"
                  value={form.name}
                  onChangeText={(v) => set("name", v)}
                />
                <FieldError msg={errors.name} />
              </View>

              {/* Food Type */}
              <View style={styles.column}>
                <Text style={styles.label}>
                  Food Type <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerBtn, errors.type && styles.inputError]}
                  onPress={() => setShowTypePicker(v => !v)}
                >
                  <Text style={form.type ? styles.pickerVal : styles.pickerPlaceholder}>
                    {form.type || "Select food type ▾"}
                  </Text>
                </TouchableOpacity>
                <FieldError msg={errors.type} />
                {showTypePicker && (
                  <View style={styles.dropdown}>
                    {FOOD_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={styles.dropdownItem}
                        onPress={() => { set("type", t); setShowTypePicker(false); }}
                      >
                        <Text style={[
                          styles.dropdownText,
                          form.type === t && styles.dropdownTextActive,
                        ]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </View>

            {/* Row 2 — Expiry + Contact + Quantity */}
            <View style={styles.row}>

              {/* Expiry Date */}
              <View style={styles.column}>
                <Text style={styles.label}>
                  Expiry Date <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.expiry && styles.inputError]}
                  placeholder="YYYY-MM-DD  e.g. 2026-04-30"
                  value={form.expiry}
                  onChangeText={(v) => set("expiry", v)}
                  maxLength={10}
                />
                <Text style={styles.hintText}>Format: YYYY-MM-DD · Must be today or future</Text>
                <FieldError msg={errors.expiry} />
              </View>

              {/* Contact Number */}
              <View style={styles.column}>
                <Text style={styles.label}>
                  Contact Number <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.contact_no && styles.inputError]}
                  placeholder="10-digit mobile e.g. 9876543210"
                  value={form.contact_no}
                  onChangeText={(v) => set("contact_no", v.replace(/\D/g, ""))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Text style={styles.hintText}>Indian mobile number (starts with 6–9)</Text>
                <FieldError msg={errors.contact_no} />
              </View>

              {/* Quantity */}
              <View style={styles.column}>
                <Text style={styles.label}>
                  Quantity <Text style={styles.optional}>(Optional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="e.g. 10"
                  value={form.quantity}
                  onChangeText={(v) => set("quantity", v.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.hintText}>Number of servings / kg / packs</Text>
                <FieldError msg={errors.quantity} />
              </View>

            </View>

            {/* Row 3 — Pickup Address */}
            <View style={styles.fullRow}>
              <Text style={styles.label}>
                Pickup Address <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.pickup_location && styles.inputError]}
                placeholder="Full address e.g., 12 Gandhi Nagar, Coimbatore, Tamil Nadu"
                value={form.pickup_location}
                onChangeText={(v) => set("pickup_location", v)}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.hintText}>Include street, area and city for NGO to locate easily</Text>
              <FieldError msg={errors.pickup_location} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate("DonorDashboard", { donorId })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.postButton, submitting && styles.postButtonDisabled]}
                onPress={handlePostDonation}
                disabled={submitting}
              >
                <Text style={styles.postButtonText}>
                  {submitting ? "Posting..." : "Post Donation"}
                </Text>
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
  mainWrapper:          { flex: 1, backgroundColor: "#f7f9fc" },
  scrollContent:        { paddingVertical: 30, alignItems: "center" },
  container:            { width: Platform.OS === "web" ? "90%" : "100%", maxWidth: 1200, paddingHorizontal: 20 },

  /* Header */
  header:               { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingVertical: 15, paddingHorizontal: 30, borderBottomWidth: 1, borderBottomColor: "#eee", ...Platform.select({ web: { position: "sticky", top: 0, zIndex: 100 } }) },
  headerLeft:           { flexDirection: "row", alignItems: "center", gap: 10 },
  logoText:             { fontSize: 22, fontWeight: "bold", color: "#333" },
  headerCenter:         { flexDirection: "row", gap: 30, alignItems: "center" },
  navLink:              { fontSize: 15, color: "#555", fontWeight: "500" },
  activeNavLinkWrapper: { backgroundColor: "#e6f7e9", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  activeNavLink:        { color: "#28a745" },
  headerRight:          { flexDirection: "row", alignItems: "center", gap: 15 },
  iconButton:           { padding: 5 },
  logoutButton:         { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16 },
  logoutText:           { fontSize: 14, color: "#555", fontWeight: "500" },

  /* Form */
  title:                { fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 30 },
  formCard:             { backgroundColor: "#fff", padding: 30, borderRadius: 12, borderWidth: 1, borderColor: "#eaecef" },
  label:                { fontSize: 14, fontWeight: "600", color: "#4a4a4a", marginBottom: 6 },
  req:                  { color: "#e53935" },
  optional:             { color: "#aaa", fontWeight: "400", fontSize: 12 },
  input:                { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 15, fontSize: 15, marginBottom: 4 },
  inputError:           { borderColor: "#e53935", backgroundColor: "#fff8f8" },
  textArea:             { height: Platform.OS === "web" ? "auto" : 90, textAlignVertical: "top", minHeight: 90 },
  hintText:             { fontSize: 11, color: "#aaa", marginBottom: 12, marginTop: 2 },
  errorText:            { fontSize: 12, color: "#e53935", marginBottom: 10, fontWeight: "600" },

  /* Type picker */
  pickerBtn:            { justifyContent: "center" },
  pickerVal:            { fontSize: 15, color: "#1a1a1a" },
  pickerPlaceholder:    { fontSize: 15, color: "#aaa" },
  dropdown:             { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, backgroundColor: "#fff", marginBottom: 12, overflow: "hidden", zIndex: 999 },
  dropdownItem:         { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownText:         { fontSize: 14, color: "#444" },
  dropdownTextActive:   { color: "#28a745", fontWeight: "700" },

  /* Layout */
  row:                  { flexDirection: Platform.OS === "web" ? "row" : "column", gap: Platform.OS === "web" ? 30 : 0, marginBottom: 10, zIndex: 10 },
  column:               { flex: Platform.OS === "web" ? 1 : 0 },
  fullRow:              { width: "100%", zIndex: 1 },

  /* Buttons */
  actionButtons:        { flexDirection: "row", justifyContent: "flex-end", gap: 15, marginTop: 24 },
  cancelButton:         { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 25 },
  cancelButtonText:     { fontSize: 16, color: "#555", fontWeight: "600" },
  postButton:           { backgroundColor: "#28a745", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 30 },
  postButtonDisabled:   { backgroundColor: "#a5d6a7" },
  postButtonText:       { fontSize: 16, color: "#fff", fontWeight: "600" },
});