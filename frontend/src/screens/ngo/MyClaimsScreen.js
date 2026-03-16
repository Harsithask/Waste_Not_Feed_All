
import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { getMyClaims } from "../../services/api";
 
export default function MyClaimsScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [claims,     setClaims]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
 
  useEffect(() => { fetchClaims(); }, []);
 
  const fetchClaims = async () => {
    try {
      // GET /donations/claims/:ngoId
      const data = await getMyClaims(ngoId);
      setClaims(data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
 
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.claimedBadge}>
          <Text style={styles.claimedText}>✅ CLAIMED</Text>
        </View>
      </View>
 
      {item.type ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🏷️</Text>
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
      ) : null}
 
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
    </View>
  );
 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Loading your claims...</Text>
      </View>
    );
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>📦 My Claims</Text>
      <Text style={styles.count}>{claims.length} donation(s) claimed</Text>
 
      {claims.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No claims yet.</Text>
          <Text style={styles.emptySubText}>
            Go to Available Donations and claim some!
          </Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchClaims(); }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f0f4f8" },
  center:       { flex: 1, justifyContent: "center", alignItems: "center" },
  heading:      { fontSize: 22, fontWeight: "bold", color: "#9C27B0", padding: 16, paddingBottom: 4 },
  count:        { fontSize: 13, color: "#888", paddingHorizontal: 16, marginBottom: 4 },
  loadingText:  { marginTop: 12, color: "#666" },
  card:         { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  foodName:     { fontSize: 18, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  claimedBadge: { backgroundColor: "#e8f5e9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#2e7d32" },
  claimedText:  { color: "#2e7d32", fontSize: 11, fontWeight: "700" },
  detailRow:    { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  detailIcon:   { fontSize: 14, marginRight: 6 },
  detailText:   { fontSize: 14, color: "#555" },
  emptyIcon:    { fontSize: 60, marginBottom: 16 },
  emptyText:    { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubText: { fontSize: 14, color: "#999", marginTop: 4, textAlign: "center" },
});
