import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Platform,
} from "react-native";
import { getNGOProfile, updateNGOProfile } from "../../services/api";

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

// Read-only field row
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

// Editable field
const EditField = ({ label, value, onChange, placeholder, required, keyboard }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.req}>*</Text>}
    </Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || ""}
      keyboardType={keyboard || "default"}
      placeholderTextColor="#bbb"
    />
  </View>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function NGOProfileScreen({ navigation, route }) {
  const ngoId = route?.params?.ngoId || "";

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    name:                "",
    phone:               "",
    organization_name:   "",
    registration_number: "",
    government_id:       "",
    address:             "",
    city:                "",
    state:               "",
  });

  useEffect(() => { fetchProfile(); }, []);

  // ── Fetch ──────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getNGOProfile(ngoId);
      setProfile(data);
      // Pre-fill form with current values
      setForm({
        name:                data.name                || "",
        phone:               data.phone               || "",
        organization_name:   data.organization_name   || "",
        registration_number: data.registration_number || "",
        government_id:       data.government_id       || "",
        address:             data.address             || "",
        city:                data.city                || "",
        state:               data.state               || "",
      });
    } catch (err) {
      crossAlert("Error", safeMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Validate ───────────────────────────────
  const validate = () => {
    if (!form.name.trim())
      { crossAlert("Validation", "Name is required"); return false; }
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim()))
      { crossAlert("Validation", "Enter a valid 10-digit Indian phone number"); return false; }
    if (!form.organization_name.trim())
      { crossAlert("Validation", "Organization name is required"); return false; }
    if (!form.city.trim())
      { crossAlert("Validation", "City is required"); return false; }
    if (!form.state.trim())
      { crossAlert("Validation", "State is required"); return false; }
    return true;
  };

  // ── Save ───────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateNGOProfile(ngoId, {
        name:                form.name.trim(),
        phone:               form.phone.trim(),
        organization_name:   form.organization_name.trim(),
        registration_number: form.registration_number.trim() || null,
        government_id:       form.government_id.trim()       || null,
        address:             form.address.trim()             || null,
        city:                form.city.trim(),
        state:               form.state.trim(),
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

  // ── Cancel edit ────────────────────────────
  const handleCancel = () => {
    // Reset form to current profile values
    if (profile) {
      setForm({
        name:                profile.name                || "",
        phone:               profile.phone               || "",
        organization_name:   profile.organization_name   || "",
        registration_number: profile.registration_number || "",
        government_id:       profile.government_id       || "",
        address:             profile.address             || "",
        city:                profile.city                || "",
        state:               profile.state               || "",
      });
    }
    setEditing(false);
  };

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
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
      </View>
    );
  }

  // ── Render ─────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NGO Profile</Text>
        {!editing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
        {editing && <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar / org name banner */}
        <View style={styles.banner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile.organization_name || profile.name || "N")
                .charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orgName}>
            {profile.organization_name || profile.name}
          </Text>
          <Text style={styles.orgEmail}>{profile.email}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Verified NGO</Text>
          </View>
        </View>

        {/* ── VIEW MODE ── */}
        {!editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Profile Details</Text>

            <InfoRow label="Full Name"            value={profile.name} />
            <InfoRow label="Email"                value={profile.email} />
            <InfoRow label="Phone"                value={profile.phone} />
            <InfoRow label="Organization Name"    value={profile.organization_name} />
            <InfoRow label="Registration Number"  value={profile.registration_number} />
            <InfoRow label="Government ID"        value={profile.government_id} />
            <InfoRow label="Address"              value={profile.address} />
            <InfoRow label="City"                 value={profile.city} />
            <InfoRow label="State"                value={profile.state} />

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

            {/* Email — read only in edit mode too */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.fieldInputLocked}>
                <Text style={styles.fieldInputLockedText}>{profile.email}</Text>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            </View>

            <EditField
              label="Full Name" required
              value={form.name}
              onChange={(v) => setForm(p => ({ ...p, name: v }))}
              placeholder="Your full name"
            />
            <EditField
              label="Phone" required
              value={form.phone}
              onChange={(v) => setForm(p => ({ ...p, phone: v.replace(/\D/g, "") }))}
              placeholder="10-digit mobile number"
              keyboard="phone-pad"
            />
            <EditField
              label="Organization Name" required
              value={form.organization_name}
              onChange={(v) => setForm(p => ({ ...p, organization_name: v }))}
              placeholder="Registered organization name"
            />
            <EditField
              label="Registration Number"
              value={form.registration_number}
              onChange={(v) => setForm(p => ({ ...p, registration_number: v }))}
              placeholder="NGO registration number"
            />
            <EditField
              label="Government ID"
              value={form.government_id}
              onChange={(v) => setForm(p => ({ ...p, government_id: v }))}
              placeholder="Aadhar / PAN / other govt ID"
            />
            <EditField
              label="Address"
              value={form.address}
              onChange={(v) => setForm(p => ({ ...p, address: v }))}
              placeholder="Full address"
            />
            <EditField
              label="City" required
              value={form.city}
              onChange={(v) => setForm(p => ({ ...p, city: v }))}
              placeholder="e.g. Coimbatore"
            />
            <EditField
              label="State" required
              value={form.state}
              onChange={(v) => setForm(p => ({ ...p, state: v }))}
              placeholder="e.g. Tamil Nadu"
            />

            {/* Save / Cancel */}
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
  container:            { flex: 1, backgroundColor: "#f0f4f8" },
  center:               { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  scroll:               { paddingBottom: 40 },

  /* Header */
  header:               { backgroundColor: "#2e7d32", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, paddingTop: Platform.OS === "android" ? 40 : 14 },
  backBtn:              { paddingHorizontal: 8, paddingVertical: 4 },
  backBtnText:          { color: "#fff", fontSize: 16, fontWeight: "600" },
  headerTitle:          { color: "#fff", fontSize: 18, fontWeight: "700" },
  editBtn:              { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  editBtnText:          { color: "#fff", fontWeight: "700", fontSize: 13 },

  /* Banner */
  banner:               { backgroundColor: "#2e7d32", alignItems: "center", paddingBottom: 32, paddingTop: 8 },
  avatar:               { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 4 },
  avatarText:           { fontSize: 36, fontWeight: "800", color: "#2e7d32" },
  orgName:              { fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", paddingHorizontal: 20 },
  orgEmail:             { fontSize: 13, color: "#c8e6c9", marginTop: 4 },
  verifiedBadge:        { marginTop: 10, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  verifiedText:         { color: "#fff", fontSize: 12, fontWeight: "600" },

  /* Section */
  section:              { backgroundColor: "#fff", margin: 16, borderRadius: 14, padding: 20, elevation: 2 },
  sectionTitle:         { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  sectionSub:           { fontSize: 12, color: "#888", marginBottom: 16, marginTop: -10 },

  /* Info rows (view mode) */
  infoRow:              { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  infoLabel:            { width: 160, fontSize: 13, color: "#888", fontWeight: "600" },
  infoValue:            { flex: 1, fontSize: 14, color: "#1a1a1a", fontWeight: "500" },

  /* Edit mode fields */
  fieldWrap:            { marginBottom: 16 },
  fieldLabel:           { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  fieldInput:           { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fafafa" },
  fieldInputLocked:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: "#eee", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#f5f5f5" },
  fieldInputLockedText: { fontSize: 14, color: "#999" },
  lockIcon:             { fontSize: 14 },
  req:                  { color: "#e53935" },

  /* Edit actions */
  editActions:          { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn:            { flex: 1, borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, padding: 13, alignItems: "center" },
  cancelBtnText:        { color: "#555", fontWeight: "700" },
  saveBtn:              { flex: 1, backgroundColor: "#2e7d32", borderRadius: 8, padding: 13, alignItems: "center" },
  saveBtnDisabled:      { backgroundColor: "#a5d6a7" },
  saveBtnText:          { color: "#fff", fontWeight: "700" },

  /* Large edit button in view mode */
  editBtnLarge:         { marginTop: 20, backgroundColor: "#e8f5e9", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#2e7d32" },
  editBtnLargeText:     { color: "#2e7d32", fontWeight: "700", fontSize: 15 },
});