import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { getAvailableDonations, assignDonation, getAssignedDonations, getVolunteerProfile, updateDonationStatus, getVolunteerStats } from "../services/api";

export default function VolunteerDashboardScreen({ navigation, route }) {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [assignedDonations, setAssignedDonations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [volunteerId, setVolunteerId] = useState(route?.params?.volunteerId);

  useEffect(() => {
    loadData();
  }, [volunteerId]);

  const loadData = async () => {
    if (!volunteerId) return;
    setLoading(true);
    try {
      const avail = await getAvailableDonations();
      setAvailableDonations(avail);

      const assigned = await getAssignedDonations(volunteerId);
      setAssignedDonations(assigned);

      const prof = await getVolunteerProfile(volunteerId);
      setProfile(prof);

      const stat = await getVolunteerStats(volunteerId);
      setStats(stat);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDonation = async (donationId) => {
    try {
      await assignDonation(donationId, volunteerId);
      Alert.alert("Success", "Donation assigned to you!");
      loadData();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to assign donation");
    }
  };

  const handleUpdateStatus = async (donationId, newStatus) => {
    try {
      await updateDonationStatus(donationId, newStatus, volunteerId);
      Alert.alert("Success", `Status updated to ${newStatus.replace('_', ' ')}!`);
      loadData();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const handleViewDonorDetails = (donation) => {
    navigation.navigate("DonationMap", { donation });
  };

  const handleProfile = () => {
    if (profile) {
      navigation.navigate("VolunteerProfile", { profile, volunteerId });
    } else {
      Alert.alert("Profile", "Loading profile...");
    }
  };

  const handleStats = () => {
    if (stats) {
      Alert.alert(
        "Your Stats",
        `Total Tasks: ${stats.total_tasks}\nCompleted: ${stats.completed_tasks}\nActive: ${stats.active_tasks}`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert("Stats", "Loading stats...");
    }
  };

  const handleLogout = () => {
    navigation.navigate("Login");
  };

  const renderDonation = ({ item }) => (
    <View style={styles.donationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodType}>{item.type || 'General'}</Text>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📍 {item.pickup_location || 'Location TBA'}</Text>
        <Text style={styles.detailText}>📅 Expires: {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}</Text>
        {item.contact_no && <Text style={styles.detailText}>📞 {item.contact_no}</Text>}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.detailsButton} onPress={() => handleViewDonorDetails(item)}>
          <Text style={styles.detailsButtonText}>ℹ️ Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton} onPress={() => handleAssignDonation(item.id)}>
          <Text style={styles.assignButtonText}>✅ Assign to Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAssigned = ({ item }) => (
    <View style={styles.donationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📍 {item.pickup_location || 'Location TBA'}</Text>
        <Text style={styles.detailText}>📅 Expires: {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}</Text>
      </View>

      <View style={styles.cardActions}>
        {item.status === 'assigned' && (
          <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus(item.id, 'picked_up')}>
            <Text style={styles.statusButtonText}>🚚 Mark Picked Up</Text>
          </TouchableOpacity>
        )}
        {item.status === 'picked_up' && (
          <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus(item.id, 'delivered')}>
            <Text style={styles.statusButtonText}>✅ Mark Delivered</Text>
          </TouchableOpacity>
        )}
        {item.status === 'delivered' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>🎉 Completed!</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🍽️ Waste Not Feed All</Text>
        <Text style={styles.subtitle}>Volunteer Dashboard</Text>
        {profile && <Text style={styles.welcome}>Welcome back, {profile.name || 'Volunteer'}! 👋</Text>}
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Your Impact</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completed_tasks || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.active_tasks || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_tasks || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>🔄 Loading donations...</Text>
        </View>
      )}

      {/* Available Donations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 Available Pickups</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{availableDonations.length}</Text>
          </View>
        </View>
        {availableDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No donations available right now</Text>
            <Text style={styles.emptySubtext}>Check back later!</Text>
          </View>
        ) : (
          availableDonations.map((item) => (
            <View key={item.id.toString()}>
              {renderDonation({ item })}
            </View>
          ))
        )}
      </View>

      {/* My Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚚 My Active Tasks</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{assignedDonations.length}</Text>
          </View>
        </View>
        {assignedDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active tasks</Text>
            <Text style={styles.emptySubtext}>Assign some donations to get started!</Text>
          </View>
        ) : (
          assignedDonations.map((item) => (
            <View key={item.id.toString()}>
              {renderAssigned({ item })}
            </View>
          ))
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleProfile}>
          <Text style={styles.primaryButtonText}>👤 My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#fff', padding: 25, paddingTop: 50,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2d3748', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#718096', marginBottom: 10 },
  welcome: { fontSize: 18, color: '#38a169', fontWeight: '600' },
  statsCard: {
    backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 15, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#38a169' },
  statLabel: { fontSize: 12, color: '#718096', marginTop: 5 },
  loadingCard: { backgroundColor: '#e6fffa', margin: 20, padding: 15, borderRadius: 10, alignItems: 'center' },
  loadingText: { color: '#38a169', fontSize: 16, fontWeight: '600' },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
  badge: { backgroundColor: '#38a169', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState: {
    backgroundColor: '#fff', padding: 30, borderRadius: 15, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  emptyText: { fontSize: 16, color: '#718096', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#a0aec0' },
  listContainer: { paddingBottom: 10 },
  donationCard: {
    backgroundColor: '#fff', marginBottom: 12, borderRadius: 15, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  foodName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', flex: 1 },
  foodType: { fontSize: 12, color: '#718096', backgroundColor: '#f7fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', color: '#fff', backgroundColor: '#3182ce', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardDetails: { marginBottom: 15 },
  detailText: { fontSize: 14, color: '#4a5568', marginBottom: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsButton: { backgroundColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  detailsButtonText: { color: '#4a5568', fontSize: 12, fontWeight: '600' },
  assignButton: { backgroundColor: '#38a169', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' },
  assignButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusButton: { backgroundColor: '#3182ce', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  statusButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  completedBadge: { backgroundColor: '#38a169', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  completedText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bottomContainer: { padding: 20, paddingBottom: 40 },
  primaryButton: {
    backgroundColor: '#38a169', paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', marginBottom: 12, shadowColor: '#38a169',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryButtonText: { color: '#4a5568', fontSize: 16, fontWeight: '600' },
});
