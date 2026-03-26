import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, ScrollView, RefreshControl,
  Platform, Modal, ActivityIndicator, Animated,
} from "react-native";
import {
  getAssignedDonations,
  getVolunteerProfile,
  updateDonationStatus,
  getVolunteerStats,
  getDonationDetails,
  getVolunteerNotifications,
  markNotificationRead,
} from "../services/api";

// ─── Colour palette — deep forest green (like the reference image) ─
const C = {
  primary:      "#2d6a4f",   // deep forest green
  primaryDark:  "#1b4332",   // darker forest green
  primaryLight: "#d8f3dc",   // very soft mint
  primarySoft:  "#f1faf3",   // near-white green tint
  primaryMid:   "#74c69d",   // mid green

  // Mapped aliases (so no other refs break)
  amber:        "#2d6a4f",
  amberLight:   "#d8f3dc",
  rose:         "#dc2626",   // sign out only
  indigo:       "#2d6a4f",
  indigoLight:  "#d8f3dc",

  // Neutrals — warm not cool
  dark:         "#081c15",
  text:         "#1b2d25",
  subtext:      "#4a6560",
  muted:        "#95b5a8",
  border:       "#c8e6d4",
  surface:      "#f6faf7",
  white:        "#ffffff",
};

export default function VolunteerDashboardScreen({ navigation, route }) {
  const [ngoAssignedDonations, setNgoAssignedDonations] = useState([]);
  const [activeDonations,      setActiveDonations]      = useState([]);
  const [completedDonations,   setCompletedDonations]   = useState([]);
  const [profile,    setProfile]    = useState(null);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState("assigned");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [notifications,     setNotifications]     = useState([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);

  const drawerAnim = useState(new Animated.Value(-300))[0];

  const volunteerId    = route?.params?.volunteerId || null;
  const volunteerEmail = route?.params?.email || null;

  // ── Drawer ────────────────────────────────────────────────────────
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: false, tension: 65, friction: 11 }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: -300, duration: 220, useNativeDriver: false }).start(() => setDrawerOpen(false));
  };

  // ── Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (volunteerId || volunteerEmail) loadData();
  }, [volunteerId, volunteerEmail]);

  const loadData = useCallback(async () => {
    if (!volunteerId && !volunteerEmail) return;
    setLoading(true);
    try {
      if (volunteerId) {
        const all = (await getAssignedDonations(volunteerId)) || [];
        setNgoAssignedDonations(all.filter(d => d.status === "assigned"));
        setActiveDonations(all.filter(d => d.status === "picked_up"));
        setCompletedDonations(all.filter(d => d.status === "delivered"));
      }
      const prof = await getVolunteerProfile({ volunteerId, email: volunteerEmail });
      setProfile(prof);
      const effectiveId = volunteerId || prof?.id;
      if (effectiveId) {
        const stat = await getVolunteerStats(effectiveId);
        setStats(stat);
      }
      const notifs = await getVolunteerNotifications(effectiveId);
        if (notifs && notifs.length > 0) {
          setNotifications(notifs);
          setCurrentNotifIndex(0);
          setNotifModalVisible(true);   // show popup on login
        }
    } catch (err) {
      console.log("loadData:", err);
      Alert.alert("Error", "Could not load data. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [volunteerId, volunteerEmail]);

  // ── Status update ─────────────────────────────────────────────────
  const handleUpdateStatus = (item, newStatus) => {
    if (!volunteerId) { Alert.alert("Error", "Please log in again."); return; }

    const label   = newStatus === "picked_up" ? "Mark as Picked Up" : "Mark as Delivered";
    const message = newStatus === "picked_up"
      ? "Confirm you have collected this donation."
      : "Confirm this donation has been delivered.";

    const execute = async () => {
      setUpdatingId(item.id);
      try {
        await updateDonationStatus(item.id, newStatus, volunteerId);
        if (newStatus === "picked_up") {
          setNgoAssignedDonations(p => p.filter(d => d.id !== item.id));
          setActiveDonations(p => [...p, { ...item, status: "picked_up" }]);
          setActiveTab("pickedup");
        } else {
          setActiveDonations(p => p.filter(d => d.id !== item.id));
          setCompletedDonations(p => [...p, { ...item, status: "delivered" }]);
          setActiveTab("completed");
        }
      } catch (err) {
        const msg = err.message || "Unknown error";
        console.log("STATUS UPDATE FAILED:", item.id, newStatus, volunteerId, msg);
        if (Platform.OS === "web") {
          window.alert("Failed: " + msg + " — Check browser console.");
        } else {
          Alert.alert("Update Failed", msg);
        }
      } finally {
        setUpdatingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(label + "?\n" + message)) execute();
    } else {
      Alert.alert(label, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: execute },
      ]);
    }
  };

  // ── Details ───────────────────────────────────────────────────────
  const handleViewDetails = async (donation) => {
    setDetailModal({ ...donation, _loading: true });
    try {
      const d = await getDonationDetails(donation.id);
      setDetailModal({ ...d, _loading: false });
    } catch {
      setDetailModal({ ...donation, _loading: false, _error: true });
    }
  };

  const handleLogout  = () => navigation.replace("Login");
  const handleDismissNotification = async () => {
    const current = notifications[currentNotifIndex];
    if (!current) { setNotifModalVisible(false); return; }

    // Mark as read in backend
    try {
      await markNotificationRead(current.id);
    } catch (e) {
      console.log("mark read failed:", e);
    }

    const nextIndex = currentNotifIndex + 1;
    if (nextIndex < notifications.length) {
      // Show next notification
      setCurrentNotifIndex(nextIndex);
    } else {
      // All dismissed — close modal
      setNotifModalVisible(false);
      setNotifications([]);
      setCurrentNotifIndex(0);
      // Jump to assigned tab so they see their task
      setActiveTab("assigned");
    }
  };
  const handleProfile = () => { closeDrawer(); navigation.navigate("VolunteerProfile", { volunteerId, email: volunteerEmail }); };

  // ── Helpers ───────────────────────────────────────────────────────
  const tabs = [
    { key: "assigned",  label: "Assigned",  count: ngoAssignedDonations.length },
    { key: "pickedup",  label: "Picked Up", count: activeDonations.length },
    { key: "completed", label: "Done",      count: completedDonations.length },
  ];
  const currentData = () => {
    if (activeTab === "assigned")  return ngoAssignedDonations;
    if (activeTab === "pickedup")  return activeDonations;
    return completedDonations;
  };
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Volunteer";
  const initials  = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // ── Card ──────────────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const isDone     = activeTab === "completed";
    const isPickedup = activeTab === "pickedup";
    const isAssigned = activeTab === "assigned";

    const accentBg   = isDone ? C.primaryLight : isPickedup ? "#d8f3dc" : C.primarySoft;
    const accentText = isDone ? C.primaryDark  : isPickedup ? C.primaryDark : C.primary;
    const statusLabel = isDone ? "DELIVERED" : isPickedup ? "IN TRANSIT" : "PENDING";

    return (
      <View style={styles.card}>
        {/* Coloured left stripe */}
        <View style={[styles.cardStripe, {
          backgroundColor: isDone ? C.primaryDark : isPickedup ? C.primary : "#4ade80"
        }]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || item.food_type || "Unnamed Donation"}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: accentBg }]}>
              <Text style={[styles.statusPillText, { color: accentText }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.cardLocRow}>
            <Text style={styles.cardLocDot}>●</Text>
            <Text style={styles.cardLoc} numberOfLines={1}>
              {item.pickup_location || "Location not specified"}
            </Text>
          </View>

          {/* Chips */}
          {(item.quantity || item.expiry || item.contact_no) ? (
            <View style={styles.chipRow}>
              {item.quantity   ? <View style={styles.chip}><Text style={styles.chipText}>{item.quantity}</Text></View> : null}
              {item.expiry     ? <View style={styles.chip}><Text style={styles.chipText}>Exp {new Date(item.expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Text></View> : null}
              {item.contact_no ? <View style={styles.chip}><Text style={styles.chipText}>{item.contact_no}</Text></View> : null}
              {isDone && item.delivered_at ? <View style={[styles.chip, { backgroundColor: C.primaryLight }]}><Text style={[styles.chipText, { color: C.primary }]}>{new Date(item.delivered_at).toLocaleDateString()}</Text></View> : null}
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => handleViewDetails(item)}>
              <Text style={styles.btnGhostText}>Details</Text>
            </TouchableOpacity>

            {(isAssigned || isPickedup) && (
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => navigation.navigate("DonationMap", { donation: item })}
              >
                <Text style={styles.btnOutlineText}>📍 Route</Text>
              </TouchableOpacity>
            )}

            {isAssigned && (
              <TouchableOpacity
                style={[styles.btnPrimary, updatingId === item.id && styles.btnPrimaryLoading]}
                disabled={updatingId === item.id}
                onPress={() => updatingId ? null : handleUpdateStatus(item, "picked_up")}
              >
                <Text style={styles.btnPrimaryText}>
                  {updatingId === item.id ? "..." : "Picked Up"}
                </Text>
              </TouchableOpacity>
            )}

            {isPickedup && (
              <TouchableOpacity
                style={[styles.btnAmber, updatingId === item.id && styles.btnPrimaryLoading]}
                disabled={updatingId === item.id}
                onPress={() => updatingId ? null : handleUpdateStatus(item, "delivered")}
              >
                <Text style={styles.btnPrimaryText}>
                  {updatingId === item.id ? "..." : "Delivered"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* Drawer overlay */}
      {drawerOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeDrawer} />
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        {/* Drawer top */}
        <View style={styles.drawerTop}>
          <View style={styles.drawerAvatar}>
            <Text style={styles.drawerAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.drawerName}>{profile?.name || "Volunteer"}</Text>
          <Text style={styles.drawerEmail}>{profile?.email || volunteerEmail || ""}</Text>
        </View>

        {/* Drawer nav */}
        <View style={styles.drawerNav}>
          <Text style={styles.drawerNavLabel}>NAVIGATION</Text>
          {[
            { key: "assigned",  label: "Assigned Tasks", count: ngoAssignedDonations.length, color: "#4ade80"      },
            { key: "pickedup",  label: "Picked Up",       count: activeDonations.length,      color: C.primary      },
            { key: "completed", label: "Completed",       count: completedDonations.length,   color: C.primaryDark  },
          ].map(it => (
            <TouchableOpacity
              key={it.key}
              style={[styles.drawerItem, activeTab === it.key && styles.drawerItemActive]}
              onPress={() => { setActiveTab(it.key); closeDrawer(); }}
            >
              <View style={[styles.drawerItemDot, { backgroundColor: it.color }]} />
              <Text style={[styles.drawerItemText, activeTab === it.key && { color: C.primary, fontWeight: "700" }]}>
                {it.label}
              </Text>
              <View style={[styles.drawerCount, activeTab === it.key && { backgroundColor: C.primaryLight }]}>
                <Text style={[styles.drawerCountText, activeTab === it.key && { color: C.primary }]}>{it.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.drawerDivider} />

        <TouchableOpacity style={styles.drawerAction} onPress={handleProfile}>
          <Text style={styles.drawerActionText}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerAction} onPress={handleLogout}>
          <Text style={[styles.drawerActionText, { color: C.rose }]}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main */}
      <View style={styles.main}>

        {/* Hero header */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.hamburger} onPress={openDrawer}>
            <View style={styles.bar} />
            <View style={[styles.bar, { width: 18 }]} />
            <View style={styles.bar} />
          </TouchableOpacity>

          <View style={styles.heroText}>
            <Text style={styles.heroGreeting}>{getGreeting()},</Text>
            <Text style={styles.heroName}>{firstName} 👋</Text>
          </View>

          <TouchableOpacity style={styles.avatarBtn} onPress={handleProfile}>
            <Text style={styles.avatarBtnText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        {stats && (
          <View style={styles.statsRow}>
            {[
              { n: stats.total_tasks     || 0, l: "Total",     bg: C.primaryLight, fg: C.primaryDark },
              { n: stats.active_tasks    || 0, l: "Active",    bg: "#d8f3dc",      fg: "#2d6a4f"     },
              { n: stats.completed_tasks || 0, l: "Completed", bg: C.primarySoft,  fg: C.primary     },
            ].map(s => (
              <View key={s.l} style={[styles.statCard, { backgroundColor: s.bg }]}>
                <Text style={[styles.statNum, { color: s.fg }]}>{s.n}</Text>
                <Text style={[styles.statLbl, { color: s.fg }]}>{s.l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Loading your tasks…</Text>
          </View>
        ) : (
          <FlatList
            data={currentData()}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadData(); }}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyCircle}>
                  <Text style={styles.emptyEmoji}>
                    {activeTab === "assigned" ? "📋" : activeTab === "pickedup" ? "🚚" : "✅"}
                  </Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === "assigned"  ? "No assignments yet"
                   : activeTab === "pickedup" ? "Nothing in transit"
                   : "No completed deliveries"}
                </Text>
                <Text style={styles.emptySub}>
                  {activeTab === "assigned"  ? "An NGO will assign donations to you here"
                   : activeTab === "pickedup" ? "Mark a task as picked up to see it here"
                   : "Delivered donations will appear here"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Details modal */}
      <Modal visible={!!detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {detailModal?._loading ? "Fetching details…" : detailModal?.name || "Donation Details"}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModal(null)}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailModal?._loading ? (
              <View style={styles.modalLoading}><ActivityIndicator size="large" color={C.primary} /></View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {detailModal?._error && (
                  <View style={styles.modalErrBanner}>
                    <Text style={styles.modalErrText}>Showing cached data — server unavailable</Text>
                  </View>
                )}
                {[
                  { label: "Food Item",   value: detailModal?.name },
                  { label: "Type",        value: detailModal?.type },
                  { label: "Quantity",    value: detailModal?.quantity },
                  { label: "Location",    value: detailModal?.pickup_location || detailModal?.location },
                  { label: "Contact",     value: detailModal?.contact_no },
                  { label: "Expiry",      value: detailModal?.expiry ? new Date(detailModal.expiry).toLocaleString() : null },
                  { label: "Status",      value: detailModal?.status },
                  { label: "Posted",      value: detailModal?.created_at ? new Date(detailModal.created_at).toLocaleString() : null },
                  { label: "Picked Up",   value: detailModal?.picked_up_at ? new Date(detailModal.picked_up_at).toLocaleString() : null },
                  { label: "Delivered",   value: detailModal?.delivered_at ? new Date(detailModal.delivered_at).toLocaleString() : null },
                ].filter(r => r.value).map(row => (
                  <View key={row.label} style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>{row.label}</Text>
                    <Text style={styles.modalRowValue}>{row.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* small pill close at bottom — replaces big full-width button */}
            <TouchableOpacity style={styles.modalPillClose} onPress={() => setDetailModal(null)}>
              <Text style={styles.modalPillCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ── Notification Modal ── */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissNotification}
      >
        <View style={notifStyles.overlay}>
          <View style={notifStyles.card}>

            {/* Icon */}
            <View style={notifStyles.iconCircle}>
              <Text style={notifStyles.iconEmoji}>🔔</Text>
            </View>

            {/* Counter if multiple */}
            {notifications.length > 1 && (
              <Text style={notifStyles.counter}>
                {currentNotifIndex + 1} of {notifications.length}
              </Text>
            )}

            <Text style={notifStyles.title}>New Task Assigned!</Text>
            <Text style={notifStyles.subtitle}>
              An NGO has assigned you a food pickup task.
            </Text>

            {/* Task details */}
            <View style={notifStyles.detailBox}>
              {[
                { label: "FOOD ITEM",    value: notifications[currentNotifIndex]?.donation_name },
                { label: "PICKUP POINT", value: notifications[currentNotifIndex]?.pickup_location },
                { label: "QUANTITY",     value: notifications[currentNotifIndex]?.quantity },
              ].filter(r => r.value).map(row => (
                <View key={row.label} style={notifStyles.detailRow}>
                  <Text style={notifStyles.detailLabel}>{row.label}</Text>
                  <Text style={notifStyles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={notifStyles.btnPrimary}
              onPress={handleDismissNotification}
            >
              <Text style={notifStyles.btnPrimaryText}>
                {currentNotifIndex + 1 < notifications.length
                  ? "Next Notification →"
                  : "Got it — View My Tasks"}
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
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.surface },  // surface = #f6faf7
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.5)", zIndex: 10 },

  // ── Drawer ──────────────────────────────────────────────────────
  drawer: {
    position: "absolute", top: 0, bottom: 0, width: 300,
    backgroundColor: C.white, zIndex: 20,
    paddingTop: 60, paddingBottom: 40,
    shadowColor: C.dark, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
    borderTopRightRadius: 24, borderBottomRightRadius: 24,
  },
  drawerTop: {
    paddingHorizontal: 24, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  drawerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  drawerAvatarText: { color: C.white, fontSize: 20, fontWeight: "800" },
  drawerName:       { fontSize: 17, fontWeight: "700", color: C.text },
  drawerEmail:      { fontSize: 12, color: C.muted, marginTop: 2 },

  drawerNav:      { paddingTop: 20, paddingHorizontal: 16 },
  drawerNavLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, paddingHorizontal: 8, marginBottom: 8 },
  drawerItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4,
  },
  drawerItemActive:  { backgroundColor: C.primarySoft },
  drawerItemDot:     { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  drawerItemText:    { flex: 1, fontSize: 15, fontWeight: "600", color: C.subtext },
  drawerCount: {
    minWidth: 24, height: 24, borderRadius: 12,
    backgroundColor: C.surface,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 6,
  },
  drawerCountText:  { fontSize: 12, fontWeight: "700", color: C.subtext },
  drawerDivider:    { height: 1, backgroundColor: C.border, marginHorizontal: 24, marginVertical: 16 },
  drawerAction:     { paddingVertical: 12, paddingHorizontal: 24 },
  drawerActionText: { fontSize: 15, fontWeight: "600", color: C.subtext },

  // ── Main ────────────────────────────────────────────────────────
  main: { flex: 1 },

  // Hero header — clean white bar, no big filled block
  hero: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  hamburger:    { width: 36, gap: 5, paddingVertical: 4 },
  bar:          { height: 2.5, width: 22, backgroundColor: C.primaryDark, borderRadius: 2 },
  heroText:     { flex: 1, paddingHorizontal: 14 },
  heroGreeting: { fontSize: 12, color: C.muted, fontWeight: "500", letterSpacing: 0.3 },
  heroName:     { fontSize: 20, color: C.primaryDark, fontWeight: "800", marginTop: 1 },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primaryLight,
    borderWidth: 2, borderColor: C.primaryMid,
    justifyContent: "center", alignItems: "center",
  },
  avatarBtnText: { color: C.primaryDark, fontSize: 13, fontWeight: "800" },

  // Stats
  statsRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  statCard: {
    flex: 1, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.white,
  },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLbl: { fontSize: 10, fontWeight: "600", marginTop: 2, opacity: 0.75 },

  // Tabs
  tabStrip: {
    flexDirection: "row", gap: 0,
    marginHorizontal: 20, marginTop: 16, marginBottom: 10,
    backgroundColor: C.border,
    borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 9,
    borderRadius: 9, gap: 5,
  },
  tabActive:         { backgroundColor: C.white, shadowColor: C.dark, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:           { fontSize: 12, fontWeight: "600", color: C.muted },
  tabTextActive:     { color: C.text },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.muted,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 4,
  },
  tabBadgeActive:    { backgroundColor: C.primary },
  tabBadgeText:      { fontSize: 10, fontWeight: "700", color: C.white },
  tabBadgeTextActive:{ color: C.white },

  // List
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  loadingBox:  { alignItems: "center", paddingTop: 80 },
  loadingText: { marginTop: 14, color: C.subtext, fontSize: 14 },

  empty:       { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primaryLight,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8, textAlign: "center" },
  emptySub:   { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },

  // Card — spacious, clean
  card: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.dark, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  cardStripe: { width: 4 },
  cardBody:   { flex: 1, padding: 18 },
  cardHead:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  cardTitle:  { flex: 1, fontSize: 16, fontWeight: "700", color: C.text, lineHeight: 22 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  statusPillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  cardLocRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 6 },
  cardLocDot: { fontSize: 7, color: C.primary },
  cardLoc:    { fontSize: 13, color: C.subtext, flex: 1, lineHeight: 18 },

  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  chip:     { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.primarySoft, borderRadius: 20, borderWidth: 1, borderColor: C.primaryLight },
  chipText: { fontSize: 11, color: C.primary, fontWeight: "600" },

  cardActions: {
    flexDirection: "row", gap: 8,
    alignItems: "center", marginTop: 4,
  },
  btnGhost: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  btnGhostText:  { fontSize: 12, fontWeight: "600", color: C.subtext },
  btnOutline: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  btnOutlineText: { fontSize: 12, fontWeight: "600", color: C.primary },
  btnPrimary: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  btnAmber: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8,
    backgroundColor: C.primaryDark,
    alignItems: "center", justifyContent: "center",
  },
  btnPrimaryText:   { fontSize: 12, fontWeight: "700", color: C.white },
  btnPrimaryLoading:{ opacity: 0.55 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 36, maxHeight: "82%",
  },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 20 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle:     { fontSize: 20, fontWeight: "800", color: C.text, flex: 1, marginRight: 12 },
  modalCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  modalCloseTxt:  { fontSize: 14, color: C.subtext, fontWeight: "700" },
  modalLoading:   { alignItems: "center", paddingVertical: 40 },
  modalErrBanner: { backgroundColor: C.amberLight, borderRadius: 10, padding: 10, marginBottom: 16 },
  modalErrText:   { fontSize: 12, color: C.amber },
  modalRow:       { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.surface },
  modalRowLabel:  { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" },
  modalRowValue:  { fontSize: 15, fontWeight: "500", color: C.text },
  modalCloseFullBtn: { marginTop: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  modalCloseFullTxt: { color: C.white, fontWeight: "700", fontSize: 16 },
  modalPillClose: {
    alignSelf: "center", marginTop: 18,
    paddingVertical: 8, paddingHorizontal: 32,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  modalPillCloseTxt: { fontSize: 13, fontWeight: "600", color: C.subtext },
  notifStyles: {},
});

const notifStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#081c15",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#d8f3dc",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
  },
  iconEmoji:  { fontSize: 34 },
  counter: {
    fontSize: 12, fontWeight: "700",
    color: "#95b5a8", marginBottom: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22, fontWeight: "800",
    color: "#1b2d25", marginBottom: 6, textAlign: "center",
  },
  subtitle: {
    fontSize: 14, color: "#4a6560",
    textAlign: "center", marginBottom: 20, lineHeight: 20,
  },
  detailBox: {
    width: "100%", backgroundColor: "#f6faf7",
    borderRadius: 12, borderWidth: 1,
    borderColor: "#c8e6d4", padding: 4, marginBottom: 22,
  },
  detailRow: {
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: "#f1faf3",
  },
  detailLabel: {
    fontSize: 10, fontWeight: "700",
    color: "#95b5a8", letterSpacing: 0.8, marginBottom: 3,
  },
  detailValue: {
    fontSize: 14, fontWeight: "600", color: "#1b2d25",
  },
  btnPrimary: {
    backgroundColor: "#2d6a4f", borderRadius: 30,
    paddingVertical: 14, paddingHorizontal: 32,
    width: "100%", alignItems: "center", marginBottom: 10,
  },
  btnPrimaryText: {
    color: "#ffffff", fontWeight: "700", fontSize: 15,
  },
  btnGhost: {
    paddingVertical: 10, paddingHorizontal: 20,
    alignItems: "center",
  },
  btnGhostText: {
    fontSize: 13, color: "#95b5a8", fontWeight: "600",
  },
});

