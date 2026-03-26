import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { Search, Bell, User, HeartHandshake } from "lucide-react-native";
import { getDonorProfile, updateDonorProfile, logoutUser } from "../services/api";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const safeMsg = (err) => {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  return JSON.stringify(err);
};

const crossAlert = (title, msg) => {
  if (Platform.OS === "web") window.alert(`${title}\n${msg ?? ""}`);
  else Alert.alert(title, msg);
};

const isValidPhone = (str) => /^[6-9]\d{9}$/.test(str.trim());

const isValidDonorId = (id) =>
  id && id !== "null" && id !== "undefined" && String(id).trim() !== "";

// ─────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────

const Navbar = ({ navigation, donorId, onLogout }) => (
  <View style={styles.navbar}>
    <View style={styles.navLeft}>
      <HeartHandshake size={26} color="#28a745" />
      <Text style={styles.navLogo}>FoodRescue</Text>
    </View>

    <View style={styles.navCenter}>
      <TouchableOpacity onPress={() => navigation.navigate("DonorHome", { donorId })}>
        <Text style={styles.navLink}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("AddDonation", { donorId })}>
        <Text style={styles.navLink}>Post Donation</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("DonorDashboard", { donorId })}>
        <Text style={styles.navLink}>My Donations</Text>
      </TouchableOpacity>
      {/* Profile — active */}
      <View style={styles.activeNavLinkWrapper}>
        <Text style={[styles.navLink, styles.activeNavLink]}>My Profile</Text>
      </View>
    </View>

    <View style={styles.navRight}>
      <TouchableOpacity style={styles.iconButton}>
        <Search size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Bell size={20} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <User size={20} color="#28a745" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Reusable components
// ─────────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

const EditField = ({ label, value, onChange, placeholder, required, keyboard, locked }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.req}>*</Text>}
    </Text>
    {locked ? (
      <View style={styles.fieldLocked}>
        <Text style={styles.fieldLockedText}>{value}</Text>
        <Text>🔒</Text>
      </View>
    ) : (
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ""}
        keyboardType={keyboard || "default"}
        placeholderTextColor="#bbb"
      />
    )}
  </View>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function DonorProfileScreen({ navigation, route }) {

  // ── Safely extract donorId ─────────────────
  const rawId   = route?.params?.donorId;
  const donorId = isValidDonorId(rawId) ? String(rawId).trim() : null;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  // ── Guard: redirect to Login if no valid donorId ──
  useEffect(() => {
    if (!donorId) {
      crossAlert("Session Error", "Donor ID is missing. Please log in again.");
      navigation.replace("Login");
      return;
    }
    fetchProfile();
  }, []);

  // ── Fetch ──────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getDonorProfile(donorId);
      setProfile(data);
      setForm({
        name:    data.name    || "",
        phone:   data.phone   || "",
        address: data.address || "",
      });
    } catch (err) {
      crossAlert("Error", safeMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────
  const handleLogout = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Are you sure you want to logout?")
        : await new Promise((resolve) =>
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel",      onPress: () => resolve(false) },
              { text: "Logout", style: "destructive", onPress: () => resolve(true)  },
            ])
          );
    if (!confirmed) return;
    try { await logoutUser(); } catch (e) { console.warn(e); }
    navigation.replace("Login");
  };

  // ── Validate ───────────────────────────────
  const validate = () => {
    if (!form.name.trim())
      { crossAlert("Validation", "Name is required"); return false; }
    if (form.name.trim().length < 2)
      { crossAlert("Validation", "Name must be at least 2 characters"); return false; }
    if (!form.phone.trim() || !isValidPhone(form.phone))
      { crossAlert("Validation", "Enter a valid 10-digit Indian phone number"); return false; }
    return true;
  };

  // ── Save ───────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateDonorProfile(donorId, {
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        address: form.address.trim() || null,
      });
      setProfile(updated);
      setEditing(false);
      crossAlert("Success", "Profile updated successfully!");
    } catch (err) {
      crossAlert("Error", safeMsg(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ─────────────────────────────────
  const handleCancel = () => {
    if (profile) {
      setForm({
        name:    profile.name    || "",
        phone:   profile.phone   || "",
        address: profile.address || "",
      });
    }
    setEditing(false);
  };

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e53935", fontSize: 16 }}>
          ⚠️ Could not load profile.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={fetchProfile}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      <Navbar navigation={navigation} donorId={donorId} onLogout={handleLogout} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile.name || "D").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bannerName}>{profile.name}</Text>
          <Text style={styles.bannerEmail}>{profile.email}</Text>
          <View style={styles.donorBadge}>
            <Text style={styles.donorBadgeText}>💚 Food Donor</Text>
          </View>
          {profile.created_at && (
            <Text style={styles.joinedText}>
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-IN", {
                month: "long", year: "numeric",
              })}
            </Text>
          )}
        </View>

        {/* ── VIEW MODE ── */}
        {!editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Profile Details</Text>

            <InfoRow label="Full Name" value={profile.name} />
            <InfoRow label="Email"     value={profile.email} />
            <InfoRow label="Phone"     value={profile.phone} />
            <InfoRow label="Address"   value={profile.address} />

            <TouchableOpacity
              style={styles.editBtnLarge}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editBtnLargeText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── EDIT MODE ── */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✏️ Edit Profile</Text>
            <Text style={styles.sectionSub}>
              Email cannot be changed. Fields marked * are required.
            </Text>

            <EditField label="Email" value={profile.email} locked />

            <EditField
              label="Full Name" required
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Your full name"
            />

            <EditField
              label="Phone" required
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v.replace(/\D/g, "") }))}
              placeholder="10-digit mobile number"
              keyboard="phone-pad"
            />

            <EditField
              label="Address"
              value={form.address}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
              placeholder="Your full address"
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>💾 Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f7f9fc" },
  center:               { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  scroll:               { paddingBottom: 40 },

  /* Navbar */
  navbar:               { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#eee", ...Platform.select({ web: { position: "sticky", top: 0, zIndex: 100 } }) },
  navLeft:              { flexDirection: "row", alignItems: "center", gap: 10 },
  navLogo:              { fontSize: 20, fontWeight: "bold", color: "#333" },
  navCenter:            { flexDirection: "row", alignItems: "center", gap: 24 },
  navLink:              { fontSize: 15, color: "#555", fontWeight: "500" },
  activeNavLinkWrapper: { backgroundColor: "#e6f7e9", paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  activeNavLink:        { color: "#28a745", fontWeight: "700" },
  navRight:             { flexDirection: "row", alignItems: "center", gap: 14 },
  iconButton:           { padding: 5 },
  logoutButton:         { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14 },
  logoutText:           { fontSize: 14, color: "#555", fontWeight: "500" },

  /* Banner */
  banner:               { backgroundColor: "#28a745", alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
  avatar:               { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 4 },
  avatarText:           { fontSize: 36, fontWeight: "800", color: "#28a745" },
  bannerName:           { fontSize: 22, fontWeight: "800", color: "#fff" },
  bannerEmail:          { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  donorBadge:           { marginTop: 10, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  donorBadgeText:       { color: "#fff", fontSize: 12, fontWeight: "600" },
  joinedText:           { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 6 },

  /* Section */
  section:              { backgroundColor: "#fff", margin: 16, borderRadius: 14, padding: 20, elevation: 2 },
  sectionTitle:         { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  sectionSub:           { fontSize: 12, color: "#888", marginBottom: 16, marginTop: -10 },

  /* Info rows */
  infoRow:              { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  infoLabel:            { width: 120, fontSize: 13, color: "#888", fontWeight: "600" },
  infoValue:            { flex: 1, fontSize: 14, color: "#1a1a1a", fontWeight: "500" },

  /* Edit fields */
  fieldWrap:            { marginBottom: 16 },
  fieldLabel:           { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  fieldInput:           { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fafafa" },
  fieldLocked:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: "#eee", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#f5f5f5" },
  fieldLockedText:      { fontSize: 14, color: "#999" },
  req:                  { color: "#e53935" },

  /* Edit actions */
  editActions:          { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn:            { flex: 1, borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, padding: 13, alignItems: "center" },
  cancelBtnText:        { color: "#555", fontWeight: "700" },
  saveBtn:              { flex: 1, backgroundColor: "#28a745", borderRadius: 8, padding: 13, alignItems: "center" },
  saveBtnDisabled:      { backgroundColor: "#a5d6a7" },
  saveBtnText:          { color: "#fff", fontWeight: "700" },

  /* Large edit button */
  editBtnLarge:         { marginTop: 20, backgroundColor: "#e8f5e9", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#28a745" },
  editBtnLargeText:     { color: "#28a745", fontWeight: "700", fontSize: 15 },

  /* Retry button */
  retryBtn:             { marginTop: 16, backgroundColor: "#28a745", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText:         { color: "#fff", fontWeight: "700", fontSize: 14 },
});
