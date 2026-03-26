import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, RefreshControl, Platform,
} from "react-native";
import { getAvailableDonations, claimDonation } from "../../services/api";

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

export default function AvailableDonationsScreen({ route, navigation }) {
  const ngoId = route?.params?.ngoId || "";
  const [donations,  setDonations]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming,   setClaiming]   = useState(null);

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      const data = await getAvailableDonations();
      setDonations(data || []);
    } catch (err) {
      Alert.alert("Error", "Could not load donations: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClaim = async (item) => {
    if (!ngoId) { Alert.alert("Error", "NGO ID not found. Please log in again."); return; }

    const confirmed = Platform.OS === "web"
      ? window.confirm(`Claim "${item.name}"?`)
      : await new Promise(resolve =>
          Alert.alert("Claim Donation",
            `Claim "${item.name}" from ${item.pickup_location || "unknown location"}?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Claim",  onPress: () => resolve(true) },
            ]
          )
        );

    if (!confirmed) return;

    setClaiming(item.id);
    try {
      await claimDonation(item.id, ngoId);
      setDonations(prev => prev.filter(d => d.id !== item.id));
      if (Platform.OS === "web") {
        window.alert(`"${item.name}" claimed! Assign a volunteer from My Claims.`);
      } else {
        Alert.alert("Claimed!", `"${item.name}" claimed successfully.`, [
          { text: "Go to My Claims", onPress: () => navigation.navigate("MyClaims", { ngoId }) },
          { text: "Stay Here", style: "cancel" },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to claim donation");
    } finally {
      setClaiming(null);
    }
  };

  const renderItem = ({ item }) => {
    const isClaiming = claiming === item.id;

    return (
      <View style={styles.card}>

        {/* Top row: name + Claim button side by side */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
            {item.type ? (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            ) : null}
          </View>

          {/* Compact Claim button — top right */}
          <TouchableOpacity
            style={[styles.claimBtn, isClaiming && styles.claimBtnDisabled]}
            onPress={() => handleClaim(item)}
            disabled={isClaiming || claiming !== null}
            activeOpacity={0.8}
          >
            <Text style={styles.claimBtnText}>{isClaiming ? "..." : "Claim"}</Text>
          </TouchableOpacity>
        </View>

        {/* Details — compact rows */}
        <View style={styles.detailsBlock}>
          {item.pickup_location ? (
            <Text style={styles.detailLine} numberOfLines={1}>
              <Text style={styles.detailKey}>Location  </Text>{item.pickup_location}
            </Text>
          ) : null}
          {item.expiry ? (
            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Expires  </Text>
              {new Date(item.expiry).toDateString()}
            </Text>
          ) : null}
          {item.quantity ? (
            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Quantity  </Text>{item.quantity}
            </Text>
          ) : null}
          {item.contact_no ? (
            <Text style={styles.detailLine}>
              <Text style={styles.detailKey}>Contact  </Text>{item.contact_no}
            </Text>
          ) : null}
        </View>

      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading donations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.heading}>Available Donations</Text>
        <Text style={styles.count}>{donations.length} available</Text>
      </View>

      {donations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>—</Text>
          <Text style={styles.emptyTitle}>No donations available</Text>
          <Text style={styles.emptySub}>Check back later or pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDonations(); }}
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
    backgroundColor: C.white,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
  },
  heading: { fontSize: 19, fontWeight: "800", color: C.primaryDark },
  count:   { fontSize: 12, color: C.muted },

  // ── Card ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 14, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primaryDark, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  // Top row: name/badge left, claim button right
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  cardTopLeft: { flex: 1 },
  foodName: {
    fontSize: 15, fontWeight: "700", color: C.text,
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.primaryLight, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typeText: { color: C.primaryDark, fontSize: 10, fontWeight: "600" },

  // Compact claim button — top right corner
  claimBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  claimBtnDisabled: { opacity: 0.55 },
  claimBtnText: { color: C.white, fontWeight: "700", fontSize: 13 },

  // Detail lines — no icons, clean key-value
  detailsBlock: { gap: 3 },
  detailLine:   { fontSize: 12, color: C.subtext, lineHeight: 18 },
  detailKey:    { color: C.muted, fontWeight: "600" },

  emptyEmoji: { fontSize: 32, color: C.muted, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
  emptySub:   { fontSize: 12, color: C.muted, textAlign: "center" },
});