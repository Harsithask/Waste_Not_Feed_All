import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  RefreshControl, Platform, Modal, ScrollView,
} from "react-native";
import { getAvailableDonations, claimDonation } from "../../services/api";
 
const SEVERITY_COLOR = {
  critical: "#d32f2f",
  high:     "#e64a19",
  moderate: "#f9a825",
  safe:     "#388e3c",
};
 
export default function AvailableDonationsScreen({ route, navigation }) {
  const ngoId = route?.params?.ngoId || "";
  const [donations,       setDonations]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [claiming,        setClaiming]        = useState(null);
  const [recommendation,  setRecommendation]  = useState(null);
  const [showModal,       setShowModal]       = useState(false);
 
  useEffect(() => { fetchDonations(); }, []);
 
  const fetchDonations = async () => {
    try {
      const data = await getAvailableDonations();
      setDonations(data || []);
    } catch (err) {
      alert("Could not load donations: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
 
  const handleClaim = async (item) => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`Claim "${item.name}" from ${item.pickup_location || "unknown location"}?`)
      : await new Promise((resolve) =>
          require("react-native").Alert.alert(
            "Claim Donation",
            `Claim "${item.name}"?`,
            [
              { text: "Cancel", onPress: () => resolve(false) },
              { text: "Claim",  onPress: () => resolve(true)  },
            ]
          )
        );
 
    if (!confirmed) return;
 
    setClaiming(item.id);
    try {
      // claimDonation now returns { message, donation, recommendation, rec_message }
      const result = await claimDonation(item.id, ngoId);
 
      // Show recommendation modal if available
      if (result.recommendation) {
        setRecommendation({
          zone:        result.recommendation,
          rec_message: result.rec_message,
          donation:    item,
        });
        setShowModal(true);
      } else {
        if (Platform.OS === "web") {
          window.alert(`✅ "${item.name}" claimed! No hotspot data yet — run analysis from Hunger Map.`);
        }
      }
 
      fetchDonations();
    } catch (err) {
      if (Platform.OS === "web") {
        window.alert("Error: " + err.message);
      }
    } finally {
      setClaiming(null);
    }
  };
 
  // ── Recommendation Modal ──────────────────────────────
  const renderModal = () => {
    if (!recommendation) return null;
    const { zone, rec_message, donation } = recommendation;
    const color = SEVERITY_COLOR[zone.severity] || "#e53935";
 
    return (
      <Modal visible={showModal} transparent animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
 
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: color }]}>
              <Text style={styles.modalHeaderText}>📍 Red Zone Recommendation</Text>
              <Text style={styles.modalHeaderSub}>
                Donation claimed successfully!
              </Text>
            </View>
 
            <ScrollView style={styles.modalBody}>
 
              {/* Claimed donation */}
              <View style={styles.donationInfo}>
                <Text style={styles.donationInfoLabel}>✅ Claimed Donation</Text>
                <Text style={styles.donationInfoName}>{donation.name}</Text>
                {donation.pickup_location ? (
                  <Text style={styles.donationInfoLocation}>
                    📍 Pickup: {donation.pickup_location}
                  </Text>
                ) : null}
              </View>
 
              {/* Recommendation */}
              <View style={[styles.zoneCard, { borderColor: color }]}>
                <Text style={styles.zoneCardLabel}>🚨 Deliver Food To:</Text>
                <Text style={[styles.zoneName, { color }]}>{zone.zone_label}</Text>
 
                <View style={[styles.severityBadge, { backgroundColor: color + "20", borderColor: color }]}>
                  <Text style={[styles.severityText, { color }]}>
                    {zone.severity?.toUpperCase()}
                  </Text>
                </View>
 
                <View style={styles.zoneStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{zone.total_demand}</Text>
                    <Text style={styles.statLabel}>Total Demand</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{zone.scheduled_supply}</Text>
                    <Text style={styles.statLabel}>Current Supply</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color }]}>{zone.gap_percentage}%</Text>
                    <Text style={styles.statLabel}>Gap</Text>
                  </View>
                  {zone.distance_km ? (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{zone.distance_km} km</Text>
                      <Text style={styles.statLabel}>Distance</Text>
                    </View>
                  ) : null}
                </View>
 
                <Text style={styles.recMessage}>{rec_message}</Text>
              </View>
 
            </ScrollView>
 
            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.viewMapBtn}
                onPress={() => {
                  setShowModal(false);
                  navigation.navigate("HungerMap", { ngoId });
                }}
              >
                <Text style={styles.viewMapBtnText}>🗺️ View on Map</Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeBtnText}>Got it ✓</Text>
              </TouchableOpacity>
            </View>
 
          </View>
        </View>
      </Modal>
    );
  };
 
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        ) : null}
      </View>
 
      {item.pickup_location ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.pickup_location}</Text>
        </View>
      ) : null}
 
      {item.expiry ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            Expires: {new Date(item.expiry).toDateString()}
          </Text>
        </View>
      ) : null}
 
      {item.contact_no ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📞</Text>
          <Text style={styles.detailText}>{item.contact_no}</Text>
        </View>
      ) : null}
 
      <TouchableOpacity
        style={[styles.claimBtn, claiming === item.id && { opacity: 0.6 }]}
        onPress={() => handleClaim(item)}
        disabled={claiming === item.id}
      >
        {claiming === item.id
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.claimBtnText}>✅ Claim This Donation</Text>
        }
      </TouchableOpacity>
    </View>
  );
 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading donations...</Text>
      </View>
    );
  }
 
  return (
    <SafeAreaView style={styles.container}>
      {renderModal()}
 
      <Text style={styles.heading}>🍱 Available Donations</Text>
      <Text style={styles.count}>{donations.length} donation(s) available</Text>
 
      {donations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🫙</Text>
          <Text style={styles.emptyText}>No donations available right now.</Text>
          <Text style={styles.emptySubText}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDonations(); }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f0f4f8" },
  center:           { flex: 1, justifyContent: "center", alignItems: "center" },
  heading:          { fontSize: 22, fontWeight: "bold", color: "#2e7d32", padding: 16, paddingBottom: 4 },
  count:            { fontSize: 13, color: "#888", paddingHorizontal: 16, marginBottom: 4 },
  loadingText:      { marginTop: 12, color: "#666" },
  card:             { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  foodName:         { fontSize: 18, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  typeBadge:        { backgroundColor: "#e8f5e9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeText:         { color: "#2e7d32", fontSize: 12, fontWeight: "600" },
  detailRow:        { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  detailIcon:       { fontSize: 14, marginRight: 6 },
  detailText:       { fontSize: 14, color: "#555" },
  claimBtn:         { backgroundColor: "#2e7d32", borderRadius: 10, paddingVertical: 12, marginTop: 12, alignItems: "center" },
  claimBtnText:     { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyIcon:        { fontSize: 60, marginBottom: 16 },
  emptyText:        { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText:     { fontSize: 14, color: "#999", marginTop: 4 },
 
  // Modal
  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard:        { backgroundColor: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden", maxHeight: "85%" },
  modalHeader:      { padding: 20 },
  modalHeaderText:  { fontSize: 18, fontWeight: "bold", color: "#fff" },
  modalHeaderSub:   { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  modalBody:        { padding: 16 },
  donationInfo:     { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 12, marginBottom: 14 },
  donationInfoLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  donationInfoName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  donationInfoLocation: { fontSize: 13, color: "#666", marginTop: 3 },
  zoneCard:         { borderWidth: 2, borderRadius: 12, padding: 16, marginBottom: 8 },
  zoneCardLabel:    { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 6 },
  zoneName:         { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  severityBadge:    { alignSelf: "flex-start", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  severityText:     { fontSize: 12, fontWeight: "700" },
  zoneStats:        { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  statItem:         { alignItems: "center", minWidth: 70 },
  statValue:        { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  statLabel:        { fontSize: 11, color: "#888", marginTop: 2 },
  recMessage:       { fontSize: 13, color: "#555", lineHeight: 18, fontStyle: "italic" },
  modalActions:     { flexDirection: "row", padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: "#eee" },
  viewMapBtn:       { flex: 1, backgroundColor: "#1a237e", borderRadius: 10, padding: 13, alignItems: "center" },
  viewMapBtnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  closeBtn:         { flex: 1, backgroundColor: "#2e7d32", borderRadius: 10, padding: 13, alignItems: "center" },
  closeBtnText:     { color: "#fff", fontWeight: "700", fontSize: 14 },
});