import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, Modal,
} from "react-native";
import { API, logoutUser } from "../services/api";
import DonationCard from "../components/DonationCard";
import { Ionicons } from "@expo/vector-icons";
import { getDonorNotifications, markNotificationRead } from "../services/api";

const DonorDashboard = ({ navigation, route }) => {
  const donorId = route?.params?.donorId || "";

  const [donations,         setDonations]         = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [notifications,     setNotifications]     = useState([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);

  // ✅ FIXED: was "uuseEffect" (typo) — this was causing the blank page
  useEffect(() => { fetchDonations(); fetchNotifications(); }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/donations");
      const dataToSet = res.data ? res.data : res;
      setDonations(Array.isArray(dataToSet) ? dataToSet : []);
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!donorId) return;
    try {
      const notifs = await getDonorNotifications(donorId);
      if (notifs && notifs.length > 0) {
        setNotifications(notifs);
        setCurrentNotifIndex(0);
        setNotifModalVisible(true);
      }
    } catch (e) {
      console.log("Donor notifications fetch failed:", e);
    }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (e) { console.warn("Logout error:", e.message); }
    finally { navigation.replace("Login"); }
  };

  const handleDismissNotification = async () => {
    const current = notifications[currentNotifIndex];
    if (current) {
      try { await markNotificationRead(current.id); } catch (e) {}
    }
    const next = currentNotifIndex + 1;
    if (next < notifications.length) {
      setCurrentNotifIndex(next);
    } else {
      setNotifModalVisible(false);
      setNotifications([]);
      setCurrentNotifIndex(0);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate("DonorHome", { donorId })}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.navBrand}>
            🍱 <Text style={styles.navBrandBold}>FoodRescue</Text>
          </Text>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => navigation.navigate("AddDonation", { donorId })}
          >
            <Text style={styles.navLinkActive}>Post Donation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLink}
            onPress={() => navigation.navigate("DonorDashboard", { donorId })}
          >
            <Text style={styles.navLinkText}>My Donations</Text>
          </TouchableOpacity>

          {/* 🔔 Notification bell */}
          <TouchableOpacity style={styles.navLink} onPress={fetchNotifications}>
            <View>
              <Ionicons name="notifications-outline" size={22} color="#555" />
              {notifications.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 2 }]}>FOOD ITEM</Text>
        <Text style={styles.headerText}>TYPE</Text>
        <Text style={styles.headerText}>EXPIRY</Text>
        <Text style={styles.headerText}>STATUS</Text>
        <Text style={[styles.headerText, { textAlign: "left" }]}>ACTIONS</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    // ✅ FIXED: Modal moved outside FlatList, at root View level
    <View style={styles.container}>
      <FlatList
        data={donations}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <DonationCard
            donation={item}
            onViewDetails={(donation) =>
              navigation.navigate("DonationDetails", { donation })
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No donations found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {/* ✅ FIXED: Modal is now at root level, outside FlatList */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissNotification}
      >
        <View style={notifStyles.overlay}>
          <View style={notifStyles.card}>
            <View style={notifStyles.iconCircle}>
              <Text style={notifStyles.iconEmoji}>🔔</Text>
            </View>
            {notifications.length > 1 && (
              <Text style={notifStyles.counter}>
                {currentNotifIndex + 1} of {notifications.length}
              </Text>
            )}
            <Text style={notifStyles.title}>
              {notifications[currentNotifIndex]?.type === "donation_accepted"
                ? "Donation Accepted!"
                : notifications[currentNotifIndex]?.type === "delivery_completed"
                ? "Delivery Completed!"
                : "New Notification"}
            </Text>
            <Text style={notifStyles.subtitle}>
              {notifications[currentNotifIndex]?.message}
            </Text>
            <View style={notifStyles.detailBox}>
              {[
                { label: "FOOD ITEM",    value: notifications[currentNotifIndex]?.donation_name },
                { label: "PICKUP POINT", value: notifications[currentNotifIndex]?.pickup_location },
              ].filter(r => r.value).map(row => (
                <View key={row.label} style={notifStyles.detailRow}>
                  <Text style={notifStyles.detailLabel}>{row.label}</Text>
                  <Text style={notifStyles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={notifStyles.btnPrimary} onPress={handleDismissNotification}>
              <Text style={notifStyles.btnPrimaryText}>
                {currentNotifIndex + 1 < notifications.length ? "Next →" : "Got it"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={notifStyles.btnGhost}
              onPress={() => setNotifModalVisible(false)}
            >
              <Text style={notifStyles.btnGhostText}>Remind me later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DonorDashboard;

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f7f9fc" },
  listContent:  { padding: Platform.OS === "web" ? 40 : 15, paddingBottom: 100 },
  center:       { flex: 1, justifyContent: "center", alignItems: "center" },

  navbar:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee", marginBottom: 24 },
  navLeft:      { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:      { padding: 4 },
  navBrand:     { fontSize: 18, color: "#1a1a1a" },
  navBrandBold: { fontWeight: "800" },
  navRight:     { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink:      { paddingHorizontal: 12, paddingVertical: 6 },
  navLinkActive:{ fontSize: 14, fontWeight: "700", color: "#28a745", backgroundColor: "#e8f5e9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  navLinkText:  { fontSize: 14, color: "#555", fontWeight: "600" },

  logoutBtn:    { borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  logoutText:   { fontSize: 13, color: "#555", fontWeight: "600" },

  headerContainer: { marginBottom: 10 },
  tableHeader:  { flexDirection: "row", backgroundColor: "#f8f9fa", paddingVertical: 15, paddingHorizontal: 15, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderColor: "#eee", alignItems: "center" },
  headerText:   { flex: 1, fontSize: 12, fontWeight: "700", color: "#6c757d", textTransform: "uppercase" },

  emptyState:   { padding: 60, alignItems: "center", backgroundColor: "#fff", borderRadius: 12 },
  emptyText:    { color: "#999", fontSize: 16 },

  notifBadge:   { position: "absolute", top: -4, right: -4, backgroundColor: "#e53e3e", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 },
  notifBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

const notifStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(15,23,42,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
  card:         { backgroundColor: "#ffffff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 380, alignItems: "center", shadowColor: "#081c15", shadowOpacity: 0.18, shadowRadius: 24, elevation: 20 },
  iconCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "#d8f3dc", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  iconEmoji:    { fontSize: 34 },
  counter:      { fontSize: 12, fontWeight: "700", color: "#95b5a8", marginBottom: 6 },
  title:        { fontSize: 22, fontWeight: "800", color: "#1b2d25", marginBottom: 6, textAlign: "center" },
  subtitle:     { fontSize: 14, color: "#4a6560", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  detailBox:    { width: "100%", backgroundColor: "#f6faf7", borderRadius: 12, borderWidth: 1, borderColor: "#c8e6d4", padding: 4, marginBottom: 22 },
  detailRow:    { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1faf3" },
  detailLabel:  { fontSize: 10, fontWeight: "700", color: "#95b5a8", letterSpacing: 0.8, marginBottom: 3 },
  detailValue:  { fontSize: 14, fontWeight: "600", color: "#1b2d25" },
  btnPrimary:   { backgroundColor: "#2d6a4f", borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 10 },
  btnPrimaryText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  btnGhost:     { paddingVertical: 10, paddingHorizontal: 20, alignItems: "center" },
  btnGhostText: { fontSize: 13, color: "#95b5a8", fontWeight: "600" },
});