import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { getAllVolunteers, assignDonationToVolunteer } from "../../services/api";

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
};

export default function AssignDonationVolunteerScreen({ route, navigation }) {
  const donation = route?.params?.donation;
  const ngoId    = route?.params?.ngoId;
  const [volunteers,        setVolunteers]        = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [assigning,         setAssigning]         = useState(false);

  useEffect(() => {
    if (!donation) { Alert.alert("Error", "Donation details missing"); navigation.goBack(); return; }
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const data = await getAllVolunteers();
      setVolunteers(data || []);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load volunteers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedVolunteer) { Alert.alert("Select a volunteer first"); return; }
    setAssigning(true);
    try {
      await assignDonationToVolunteer(donation.id, selectedVolunteer);
      Alert.alert("Done!", "Volunteer assigned successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to assign volunteer.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading volunteers...</Text>
      </View>
    );
  }

  const fields = [
    { label: "Location", value: donation?.pickup_location },
    { label: "Quantity", value: donation?.quantity },
    { label: "Expires",  value: donation?.expiry ? new Date(donation.expiry).toDateString() : null },
  ].filter(f => f.value);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Text style={styles.headerIcon}>🙋</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Assign Volunteer</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{donation?.name || "Unnamed Donation"}</Text>
        </View>
      </View>

      {/* Donation summary */}
      <View style={styles.summaryCard}>
        {fields.map((f, i) => (
          <View key={i} style={[styles.summaryRow, i < fields.length - 1 && styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>{f.label}</Text>
            <Text style={styles.summaryValue}>{f.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>SELECT A VOLUNTEER</Text>

      {volunteers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>No volunteers available</Text>
        </View>
      ) : (
        <FlatList
          data={volunteers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const selected = selectedVolunteer === item.id;
            return (
              <TouchableOpacity
                style={[styles.volCard, selected && styles.volCardSelected]}
                onPress={() => setSelectedVolunteer(item.id)}
              >
                <View style={[styles.volAvatar, selected && styles.volAvatarSelected]}>
                  <Text style={styles.volAvatarText}>{(item.name || "?")[0].toUpperCase()}</Text>
                </View>
                <View style={styles.volInfo}>
                  <Text style={styles.volName}>{item.name || "Unnamed"}</Text>
                  <Text style={styles.volDetail}>{item.email || "No email"}</Text>
                  {item.city ? <Text style={styles.volDetail}>{item.city}</Text> : null}
                </View>
                {selected && (
                  <View style={styles.tick}>
                    <Text style={styles.tickText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.assignBtn, (!selectedVolunteer || assigning) && styles.assignBtnDisabled]}
          disabled={!selectedVolunteer || assigning}
          onPress={handleAssign}
        >
          <Text style={styles.assignBtnText}>
            {assigning ? "Assigning..." : "Assign Volunteer"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.surface },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: C.muted },

  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.white, padding: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, justifyContent: "center", alignItems: "center" },
  headerIcon:    { fontSize: 22 },
  headerTitle:   { fontSize: 17, fontWeight: "800", color: C.primaryDark },
  headerSub:     { fontSize: 12, color: C.muted, marginTop: 2 },

  summaryCard: {
    backgroundColor: C.white, marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 4,
  },
  summaryRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: C.surface },
  summaryLabel:     { fontSize: 12, color: C.muted, fontWeight: "600" },
  summaryValue:     { fontSize: 13, color: C.text,  fontWeight: "600" },

  sectionLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  volCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: C.border,
  },
  volCardSelected: { borderColor: C.primary, backgroundColor: C.primarySoft },
  volAvatar:         { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryLight, justifyContent: "center", alignItems: "center", marginRight: 12 },
  volAvatarSelected: { backgroundColor: C.primary },
  volAvatarText:     { color: C.primaryDark, fontSize: 17, fontWeight: "700" },
  volInfo:    { flex: 1 },
  volName:    { fontSize: 14, fontWeight: "700", color: C.text },
  volDetail:  { fontSize: 12, color: C.muted, marginTop: 2 },
  tick:       { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, justifyContent: "center", alignItems: "center" },
  tickText:   { color: C.white, fontWeight: "800", fontSize: 12 },

  footer:            { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  assignBtn:         { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  assignBtnDisabled: { opacity: 0.5 },
  assignBtnText:     { color: C.white, fontWeight: "700", fontSize: 15 },

  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText:  { fontSize: 15, color: C.muted },
});