import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
  RefreshControl, TouchableOpacity, Platform,
} from "react-native";
import { getMyClaims, getAllVolunteers } from "../../services/api";

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

export default function MyClaimsScreen({ route, navigation }) {
  const ngoId = route?.params?.ngoId || "";
  const [claims,     setClaims]     = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = navigation.addListener("focus", fetchData);
    return unsub;
  }, [navigation]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = useCallback(async () => {
    try {
      const [claimsData, volData] = await Promise.all([getMyClaims(ngoId), getAllVolunteers()]);
      setClaims(claimsData || []);
      setVolunteers(volData || []);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load claims");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ngoId]);

  const getVolunteerName = (id) => {
    if (!id) return null;
    const v = volunteers.find(v => v.id === id);
    return v ? v.name : `Volunteer #${id.slice(0, 6)}`;
  };

  const getStatusConfig = (status) => {
    switch ((status || "").toLowerCase()) {
      case "claimed":   return { bg: C.surface,      text: C.subtext,     label: "CLAIMED"            };
      case "assigned":  return { bg: "#fef9c3",      text: "#854d0e",     label: "VOLUNTEER ASSIGNED" };
      case "picked_up": return { bg: C.primaryDark,  text: C.white,       label: "PICKED UP"          };
      case "delivered": return { bg: C.primaryLight, text: C.primaryDark, label: "DELIVERED ✓"        };
      default:          return { bg: C.surface,      text: C.muted,       label: (status || "UNKNOWN").toUpperCase() };
    }
  };

  const renderItem = ({ item }) => {
    const volunteerName = getVolunteerName(item.volunteer_id);
    const statusCfg     = getStatusConfig(item.status);
    const hasVolunteer  = !!item.volunteer_id;
    const status        = (item.status || "").toLowerCase();

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.foodName} numberOfLines={1}>{item.name || "Unnamed Donation"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Details */}
        {[
          { icon: "🏷️", val: item.type },
          { icon: "📍", val: item.pickup_location },
          { icon: "🧾", val: item.quantity },
          { icon: "📅", val: item.expiry ? `Expires: ${new Date(item.expiry).toDateString()}` : null },
          { icon: "📞", val: item.contact_no },
        ].filter(r => r.val).map((r, i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailIcon}>{r.icon}</Text>
            <Text style={styles.detailText}>{r.val}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {!hasVolunteer ? (
          <View style={styles.actionsRow}>
            <Text style={styles.noVolunteerText}>No volunteer assigned yet</Text>
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => navigation.navigate("AssignDonationVolunteer", { donation: item, ngoId })}
            >
              <Text style={styles.assignBtnText}>Assign Volunteer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.volRow}>
              <View style={styles.volAvatar}>
                <Text style={styles.volAvatarText}>{(volunteerName || "?")[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.volLabel}>Assigned Volunteer</Text>
                <Text style={styles.volName}>{volunteerName}</Text>
              </View>
            </View>

            {/* Progress track */}
            <View style={styles.track}>
              <View style={styles.trackStep}>
                <View style={[styles.trackDot, styles.trackDotDone]}>
                  <Text style={styles.trackDotText}>✓</Text>
                </View>
                <Text style={[styles.trackLabel, styles.trackLabelDone]}>Assigned</Text>
              </View>

              <View style={[styles.trackLine,
                (status === "picked_up" || status === "delivered") ? styles.trackLineDone : styles.trackLinePending
              ]} />

              <View style={styles.trackStep}>
                <View style={[styles.trackDot,
                  (status === "picked_up" || status === "delivered") ? styles.trackDotDone : styles.trackDotPending
                ]}>
                  <Text style={[styles.trackDotText,
                    !(status === "picked_up" || status === "delivered") && { color: C.muted }
                  ]}>
                    {(status === "picked_up" || status === "delivered") ? "✓" : "2"}
                  </Text>
                </View>
                <Text style={[styles.trackLabel,
                  (status === "picked_up" || status === "delivered") && styles.trackLabelDone
                ]}>Picked Up</Text>
                {item.picked_up_at ? (
                  <Text style={styles.trackTime}>
                    {new Date(item.picked_up_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.trackLine,
                status === "delivered" ? styles.trackLineDone : styles.trackLinePending
              ]} />

              <View style={styles.trackStep}>
                <View style={[styles.trackDot,
                  status === "delivered" ? styles.trackDotDelivered : styles.trackDotPending
                ]}>
                  <Text style={[styles.trackDotText, status !== "delivered" && { color: C.muted }]}>
                    {status === "delivered" ? "✓" : "3"}
                  </Text>
                </View>
                <Text style={[styles.trackLabel, status === "delivered" && styles.trackLabelDelivered]}>
                  Delivered
                </Text>
                {item.delivered_at ? (
                  <Text style={styles.trackTime}>
                    {new Date(item.delivered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading your claims...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.heading}>My Claims</Text>
        <Text style={styles.count}>{claims.length} donation(s) claimed</Text>
      </View>

      {claims.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No claims yet</Text>
          <Text style={styles.emptySub}>Go to Available Donations and claim some!</Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              colors={[C.primary]} tintColor={C.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.surface },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  loadingText: { marginTop: 12, color: C.muted },

  pageHeader: {
    backgroundColor: C.white, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  heading: { fontSize: 20, fontWeight: "800", color: C.primaryDark },
  count:   { fontSize: 12, color: C.muted, marginTop: 2 },

  card: {
    backgroundColor: C.white, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
    shadowColor: C.primaryDark, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodName:    { fontSize: 16, fontWeight: "700", color: C.text, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  detailRow:  { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  detailIcon: { fontSize: 13, marginRight: 6 },
  detailText: { fontSize: 12, color: C.subtext, flex: 1 },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 8 },

  actionsRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noVolunteerText: { color: C.muted, fontSize: 13, fontWeight: "600", flex: 1 },
  assignBtn:       { backgroundColor: C.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  assignBtnText:   { color: C.white, fontWeight: "700", fontSize: 13 },

  volRow:        { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  volAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: "center", alignItems: "center", marginRight: 10 },
  volAvatarText: { color: C.white, fontWeight: "700", fontSize: 15 },
  volLabel:      { fontSize: 10, color: C.muted, fontWeight: "600" },
  volName:       { fontSize: 14, fontWeight: "700", color: C.text },

  track:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  trackStep: { alignItems: "center", width: 60 },
  trackLabel:          { fontSize: 9, color: C.muted, marginTop: 4, fontWeight: "600", textAlign: "center" },
  trackLabelDone:      { color: C.primaryDark },
  trackLabelDelivered: { color: C.primary },
  trackTime:           { fontSize: 8, color: C.muted, marginTop: 2, textAlign: "center" },
  trackDot:          { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: C.border },
  trackDotDone:      { backgroundColor: C.primaryDark, borderColor: C.primaryDark },
  trackDotDelivered: { backgroundColor: C.primary,     borderColor: C.primary     },
  trackDotPending:   { backgroundColor: C.white,       borderColor: C.border      },
  trackDotText:      { fontSize: 11, fontWeight: "800", color: C.white },
  trackLine:        { flex: 1, height: 2, marginBottom: 10 },
  trackLineDone:    { backgroundColor: C.primaryDark },
  trackLinePending: { backgroundColor: C.border },

  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: "center" },
});