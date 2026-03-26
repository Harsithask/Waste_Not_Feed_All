import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Platform,
} from "react-native";

const BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";

// ── Same forest green palette as VolunteerDashboardScreen ──────────
const C = {
  primary:      "#2d6a4f",
  primaryDark:  "#1b4332",
  primaryLight: "#d8f3dc",
  primarySoft:  "#f1faf3",
  primaryMid:   "#74c69d",
  text:         "#1b2d25",
  subtext:      "#4a6560",
  muted:        "#95b5a8",
  border:       "#c8e6d4",
  surface:      "#f6faf7",
  white:        "#ffffff",
};

// ── Distance (Euclidean approximation) ────────────────────────────
function dist(a, b) {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
}

// ── Nearest-neighbour greedy route ────────────────────────────────
function nearestNeighbor(start, donors) {
  let route     = [];
  let current   = start;
  let remaining = [...donors];
  while (remaining.length > 0) {
    const nearest = remaining.reduce((prev, curr) =>
      dist(current, curr) < dist(current, prev) ? curr : prev
    );
    route.push(nearest);
    current   = nearest;
    remaining = remaining.filter(d => d !== nearest);
  }
  return route;
}

// ── Screen ────────────────────────────────────────────────────────
export default function DonorRouteScreen({ navigation }) {
  const [route,   setRoute]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Volunteer's base coordinates (replace with real GPS if needed)
  const volunteer = { lat: 11.1271, lng: 78.6569 };

  useEffect(() => { loadDonors(); }, []);

  async function loadDonors() {
    try {
      const res = await fetch(BASE_URL + "/donors");
      if (!res.ok) throw new Error("Server error " + res.status);
      const data   = await res.json();
      const donors = data.donors || [];
      setRoute(nearestNeighbor(volunteer, donors));
    } catch (err) {
      console.log(err);
      setError(err.message || "Could not load donors");
    } finally {
      setLoading(false);
    }
  }

  function openMaps(lat, lng, name) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place=${encodeURIComponent(name || "")}`;
    Linking.openURL(url);
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.centeredText}>Optimising pickup route…</Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load route</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDonors}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pickup Route</Text>
          <Text style={styles.headerSub}>Optimised collection order</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Route summary pill */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {route.length} stop{route.length !== 1 ? "s" : ""} · nearest-first order
          </Text>
        </View>

        {route.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No donors found</Text>
            <Text style={styles.emptySub}>Check back once donors are registered</Text>
          </View>
        ) : (
          route.map((d, i) => (
            <View key={i} style={styles.card}>
              {/* Step number + name */}
              <View style={styles.cardHead}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.donorName}>{d.name || "Unnamed Donor"}</Text>
                  <Text style={styles.donorCoords}>{d.lat?.toFixed(4)}, {d.lng?.toFixed(4)}</Text>
                </View>
              </View>

              {/* Food info */}
              {d.food ? (
                <View style={styles.foodRow}>
                  <Text style={styles.foodLabel}>Food</Text>
                  <Text style={styles.foodValue}>{d.food}</Text>
                </View>
              ) : null}

              {/* Navigate button */}
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => openMaps(d.lat, d.lng, d.name)}
              >
                <Text style={styles.navBtnText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.surface },

  centered:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  centeredText: { marginTop: 14, color: C.subtext, fontSize: 14 },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 6 },
  errorSub:   { fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 20 },
  retryBtn: {
    paddingVertical: 10, paddingHorizontal: 28,
    backgroundColor: C.primary, borderRadius: 10,
  },
  retryBtnText: { color: C.white, fontWeight: "700" },

  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.white,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primarySoft,
    justifyContent: "center", alignItems: "center",
  },
  backBtnText:  { fontSize: 18, color: C.primaryDark, fontWeight: "700" },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: C.text },
  headerSub:    { fontSize: 12, color: C.muted, marginTop: 1 },

  body: { padding: 20, gap: 12 },

  summaryBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14,
    alignSelf: "flex-start", borderWidth: 1, borderColor: C.primaryMid,
    marginBottom: 4,
  },
  summaryText: { fontSize: 13, fontWeight: "600", color: C.primaryDark },

  emptyBox:  { alignItems: "center", paddingTop: 60 },
  emptyEmoji:{ fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: C.muted, textAlign: "center" },

  card: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardHead:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: C.primaryMid,
    justifyContent: "center", alignItems: "center",
  },
  stepNum:     { fontSize: 14, fontWeight: "800", color: C.primaryDark },
  donorName:   { fontSize: 15, fontWeight: "700", color: C.text },
  donorCoords: { fontSize: 11, color: C.muted, marginTop: 2 },

  foodRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  foodLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  foodValue: { fontSize: 13, color: C.subtext, fontWeight: "500" },

  navBtn: {
    backgroundColor: C.primary,
    borderRadius: 10, paddingVertical: 10,
    alignItems: "center",
  },
  navBtnText: { color: C.white, fontWeight: "700", fontSize: 13 },
});