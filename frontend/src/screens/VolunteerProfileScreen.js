import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
  TextInput, Platform, KeyboardAvoidingView,
} from "react-native";
import { getVolunteerProfile, updateVolunteerProfile } from "../services/api";

const C = {
  primary:     "#2d6a4f",
  primaryDark: "#1b4332",
  primaryLight:"#d8f3dc",
  primarySoft: "#f1faf3",
  primaryMid:  "#74c69d",
  text:        "#1b2d25",
  subtext:     "#4a6560",
  muted:       "#95b5a8",
  border:      "#c8e6d4",
  surface:     "#f6faf7",
  white:       "#ffffff",
  danger:      "#dc2626",
};

export default function VolunteerProfileScreen({ navigation, route }) {
  const volunteerId    = route.params?.volunteerId;
  const volunteerEmail = route.params?.email;

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Editable fields
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [city,  setCity]  = useState("");

  useEffect(() => {
    if (!volunteerId && !volunteerEmail) {
      setLoading(false);
      Alert.alert("Error", "Volunteer info missing. Please log in again.");
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await getVolunteerProfile({ volunteerId, email: volunteerEmail });
      setProfile(result);
      setName(result.name  || "");
      setPhone(result.phone || "");
      setCity(result.city  || "");
    } catch (err) {
      console.log("Profile fetch error", err);
      Alert.alert("Error", "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Name is required"); return; }
    if (!volunteerId) { Alert.alert("Error", "Volunteer ID missing."); return; }

    setSaving(true);
    try {
      const updated = await updateVolunteerProfile(volunteerId, { name, phone, city });
      setProfile(updated);
      setEditing(false);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to saved values
    setName(profile?.name  || "");
    setPhone(profile?.phone || "");
    setCity(profile?.city  || "");
    setEditing(false);
  };

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Profile could not be loaded.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Back arrow — compact top-left */}
          <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
            <Text style={styles.backCircleText}>←</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name || "Volunteer"}</Text>
          <Text style={styles.profileEmail}>{profile.email || volunteerEmail || ""}</Text>

          {/* Edit / Cancel toggle */}
          {!editing ? (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Profile fields ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PROFILE DETAILS</Text>

          {/* Name */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={C.muted}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.name || "—"}</Text>
            )}
          </View>

          <View style={styles.fieldDivider} />

          {/* Email — read only always */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={[styles.fieldValue, { color: C.muted }]}>{profile.email || "—"}</Text>
          </View>

          <View style={styles.fieldDivider} />

          {/* Phone */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.phone || "—"}</Text>
            )}
          </View>

          <View style={styles.fieldDivider} />

          {/* City */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>City</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={city}
                onChangeText={setCity}
                placeholder="Enter your city"
                placeholderTextColor={C.muted}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.city || "—"}</Text>
            )}
          </View>

          <View style={styles.fieldDivider} />

          {/* Volunteer ID — always read only */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Volunteer ID</Text>
            <Text style={[styles.fieldValue, { color: C.muted, fontSize: 11 }]} numberOfLines={1}>
              {profile.id || "—"}
            </Text>
          </View>

          {profile.skills ? (
            <>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Skills</Text>
                <Text style={styles.fieldValue}>{profile.skills}</Text>
              </View>
            </>
          ) : null}

          {profile.transport ? (
            <>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Transport</Text>
                <Text style={styles.fieldValue}>{profile.transport}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* ── Save button (only in edit mode) ── */}
        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>
            }
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  body: { paddingBottom: 40 },

  centered: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: C.surface, padding: 32,
  },
  loadingText: { marginTop: 14, color: C.muted, fontSize: 14 },
  errorText:   { fontSize: 15, color: C.subtext, marginBottom: 20 },

  // ── Header ───────────────────────────────────────────────────────
  header: {
    backgroundColor: C.primaryDark,
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 28, paddingHorizontal: 20,
    alignItems: "center",
  },

  // Back arrow — small circle top-left corner
  backCircle: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 40,
    left: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  backCircleText: { color: C.white, fontSize: 18, fontWeight: "600" },

  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primary,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  avatarText:   { color: C.white, fontSize: 26, fontWeight: "800" },
  profileName:  { fontSize: 20, fontWeight: "800", color: C.white, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 18 },

  editBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  editBtnText: { color: C.white, fontWeight: "700", fontSize: 13 },

  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(220,38,38,0.15)",
    borderWidth: 1, borderColor: "rgba(220,38,38,0.3)",
  },
  cancelBtnText: { color: "#fca5a5", fontWeight: "700", fontSize: 13 },

  // ── Card ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  cardHeading: {
    fontSize: 10, fontWeight: "700", color: C.muted,
    letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },

  fieldRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 13, paddingHorizontal: 16,
    minHeight: 48,
  },
  fieldLabel: { fontSize: 13, color: C.muted, fontWeight: "600", flex: 1 },
  fieldValue: { fontSize: 14, color: C.text, fontWeight: "500", flex: 2, textAlign: "right" },
  fieldInput: {
    flex: 2, textAlign: "right",
    fontSize: 14, color: C.text, fontWeight: "500",
    borderBottomWidth: 1.5, borderBottomColor: C.primary,
    paddingBottom: 2,
  },
  fieldDivider: { height: 1, backgroundColor: C.surface, marginHorizontal: 16 },

  // ── Save button ───────────────────────────────────────────────────
  saveBtn: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.primary,
    borderRadius: 12, paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: C.white, fontWeight: "700", fontSize: 15 },

  backBtn:     { marginTop: 12, paddingVertical: 10, paddingHorizontal: 20 },
  backBtnText: { color: C.primary, fontWeight: "700", fontSize: 14 },
});