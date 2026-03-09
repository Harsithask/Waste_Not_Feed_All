import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function AvailableDonationsScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .or("status.ilike.available,status.is.null");

      if (error) throw error;
      setDonations(data || []);
    } catch (err) {
      window.alert("Could not load donations: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClaim = async (item) => {
    const confirmed = window.confirm(
      `Claim "${item.name}" from ${item.pickup_location || "unknown location"}?`
    );

    if (!confirmed) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || ngoId;

      if (!currentUserId) {
        window.alert("You must be logged in to claim donations.");
        return;
      }

      const { error } = await supabase
        .from("donations")
        .update({
          status: "claimed",
          claimed_by: currentUserId,
        })
        .eq("id", item.id);

      if (error) throw error;

      window.alert(`✅ "${item.name}" has been claimed successfully!`);
      fetchDonations();

    } catch (err) {
      window.alert("Error: " + err.message);
    }
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
        style={styles.claimBtn}
        onPress={() => handleClaim(item)}
      >
        <Text style={styles.claimBtnText}>✅ Claim This Donation</Text>
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
              onRefresh={() => {
                setRefreshing(true);
                fetchDonations();
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: {
    fontSize: 22, fontWeight: "bold",
    color: "#2e7d32", padding: 16, paddingBottom: 4,
  },
  count: { fontSize: 13, color: "#888", paddingHorizontal: 16, marginBottom: 4 },
  loadingText: { marginTop: 12, color: "#666" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    marginBottom: 14, shadowColor: "#000",
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  foodName: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  typeBadge: {
    backgroundColor: "#e8f5e9", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  typeText: { color: "#2e7d32", fontSize: 12, fontWeight: "600" },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  detailIcon: { fontSize: 14, marginRight: 6 },
  detailText: { fontSize: 14, color: "#555" },
  claimBtn: {
    backgroundColor: "#2e7d32", borderRadius: 10,
    paddingVertical: 12, marginTop: 12, alignItems: "center",
  },
  claimBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText: { fontSize: 14, color: "#999", marginTop: 4 },
});