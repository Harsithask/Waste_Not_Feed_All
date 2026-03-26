import React from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  Alert, Platform, Modal,
} from "react-native";
import { logoutUser, getNgoNotifications, markNotificationRead } from "../../services/api";
import { useState, useEffect } from "react";

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

const cards = (ngoId) => [
  {
    title:    "Hunger Hotspots",
    subtitle: "AI-powered map of high food demand areas",
    letter:   "H",
    bg:       "#1b4332",
    screen:   "HungerMap",
    params:   { ngoId },
  },
  {
    title:    "Available Donations",
    subtitle: "Browse & claim food donations from donors",
    letter:   "D",
    bg:       "#2d6a4f",
    screen:   "AvailableDonations",
    params:   { ngoId },
  },
  {
    title:    "Manage Events",
    subtitle: "Create and track pickup/distribution events",
    letter:   "E",
    bg:       "#40916c",
    screen:   "ManageEvents",
    params:   { ngoId },
  },
  {
    title:    "Assign Volunteers",
    subtitle: "Assign registered volunteers to tasks",
    letter:   "V",
    bg:       "#52b788",
    screen:   "AssignVolunteers",
    params:   { ngoId },
  },
  {
    title:    "My Claims",
    subtitle: "View all donations your NGO has claimed",
    letter:   "C",
    bg:       "#74c69d",
    screen:   "MyClaims",
    params:   { ngoId },
  },
];

export default function NGODashboardScreen({ navigation, route }) {
  const ngoId = route?.params?.ngoId || "";

  const [notifications,     setNotifications]     = useState([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    if (!ngoId) return;
    try {
      const notifs = await getNgoNotifications(ngoId);
      if (notifs && notifs.length > 0) {
        setNotifications(notifs);
        setCurrentNotifIndex(0);
        setNotifModalVisible(true);
      }
    } catch (e) {
      console.log("NGO notifications fetch failed:", e);
    }
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

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Are you sure you want to sign out?")) return;
      await logoutUser();
      navigation.replace("Login");
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out", style: "destructive",
          onPress: async () => { await logoutUser(); navigation.replace("Login"); },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.root}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>NGO DASHBOARD</Text>
            <Text style={styles.headerTitle}>Waste Not, Feed All</Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* ✅ FIXED: badge uses styles.badge, placed correctly INSIDE the bell button */}
          <TouchableOpacity
            onPress={fetchNotifications}
            style={styles.bellWrapper}
          >
            <Text style={{ fontSize: 22 }}>🔔</Text>
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>5</Text>
            <Text style={styles.statLbl}>Modules</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>NGO</Text>
            <Text style={styles.statLbl}>Role</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>Live</Text>
            <Text style={styles.statLbl}>Status</Text>
          </View>
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>MODULES</Text>

        {cards(ngoId).map((card) => (
          <TouchableOpacity
            key={card.screen}
            style={styles.card}
            onPress={() => navigation.navigate(card.screen, card.params)}
            activeOpacity={0.75}
          >
            <View style={[styles.letterBox, { backgroundColor: card.bg }]}>
              <Text style={styles.letterText}>{card.letter}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSub}>{card.subtitle}</Text>
            </View>
            <View style={styles.arrowBox}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.signOutCard} onPress={handleLogout}>
          <Text style={styles.signOutCardText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Notification Modal ─────────────────────────────────── */}
      {/* ✅ FIXED: Modal is outside ScrollView, at root level */}
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
                : "Delivery Completed!"}
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

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  // Header
  header: {
    backgroundColor: C.primaryDark,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  headerLabel: { fontSize: 10, fontWeight: "700", color: C.primaryMid, letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.white, marginTop: 4 },
  signOutBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  signOutText: { color: "rgba(255,255,255,0.8)", fontWeight: "600", fontSize: 12 },

  // ✅ Bell wrapper + badge (correctly named, no more ngoNotifStyles reference)
  bellWrapper: { marginRight: 10, position: "relative" },
  badge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#e53e3e", borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    marginHorizontal: -20, paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statItem:    { flex: 1, alignItems: "center" },
  statNum:     { fontSize: 16, fontWeight: "800", color: C.white },
  statLbl:     { fontSize: 10, color: C.primaryMid, marginTop: 2, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  // Body
  body:         { padding: 16, gap: 8, paddingTop: 18 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, marginBottom: 4 },

  // Module cards
  card: {
    backgroundColor: C.white,
    borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primaryDark, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  letterBox:  { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  letterText: { fontSize: 18, fontWeight: "800", color: C.white },
  cardBody:   { flex: 1 },
  cardTitle:  { fontSize: 15, fontWeight: "700", color: C.text },
  cardSub:    { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 15 },
  arrowBox:   { width: 24, alignItems: "center" },
  arrowText:  { fontSize: 20, color: C.border, fontWeight: "300" },

  // Sign out card
  signOutCard: {
    marginTop: 4, borderRadius: 10, paddingVertical: 11,
    alignItems: "center", borderWidth: 1.5,
    borderColor: "#fecaca", backgroundColor: "#fff5f5",
  },
  signOutCardText: { color: C.danger, fontWeight: "700", fontSize: 13 },
});

const notifStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 28,
    width: "100%", maxWidth: 380, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#d8f3dc", justifyContent: "center",
    alignItems: "center", marginBottom: 12,
  },
  iconEmoji:    { fontSize: 28 },
  counter:      { fontSize: 12, color: "#95b5a8", marginBottom: 6 },
  title:        { fontSize: 18, fontWeight: "800", color: "#1b2d25", marginBottom: 8, textAlign: "center" },
  subtitle:     { fontSize: 13, color: "#4a6560", textAlign: "center", marginBottom: 16, lineHeight: 20 },
  detailBox:    { width: "100%", backgroundColor: "#f6faf7", borderRadius: 10, padding: 12, marginBottom: 18 },
  detailRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  detailLabel:  { fontSize: 10, fontWeight: "700", color: "#95b5a8", letterSpacing: 1 },
  detailValue:  { fontSize: 13, fontWeight: "600", color: "#1b2d25", flexShrink: 1, textAlign: "right" },
  btnPrimary: {
    backgroundColor: "#2d6a4f", borderRadius: 30, paddingVertical: 13,
    paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 10,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnGhost:     { paddingVertical: 8 },
  btnGhostText: { color: "#95b5a8", fontSize: 13 },
});