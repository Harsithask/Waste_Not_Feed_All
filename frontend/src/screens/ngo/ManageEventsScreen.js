import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  ScrollView, Modal
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function ManageEventsScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    event_date: "",
    description: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ngo_events")
        .select("*")
        .eq("ngo_id", ngoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title) { Alert.alert("Event title is required"); return; }
    if (!form.location) { Alert.alert("Location is required"); return; }
    if (!form.event_date) { Alert.alert("Event date is required"); return; }

    setCreating(true);
    try {
      const { error } = await supabase
        .from("ngo_events")
        .insert([{
          ngo_id: ngoId,
          title: form.title,
          location: form.location,
          event_date: form.event_date,
          description: form.description,
          status: "upcoming",
        }]);

      if (error) throw error;

      Alert.alert("✅ Event Created!", `"${form.title}" has been created.`);
      setModalVisible(false);
      setForm({ title: "", location: "", event_date: "", description: "" });
      fetchEvents();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (eventId, title) => {
    Alert.alert(
      "Complete Event",
      `Mark "${title}" as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("ngo_events")
                .update({ status: "completed" })
                .eq("id", eventId);

              if (error) throw error;
              Alert.alert("✅ Event marked as completed!");
              fetchEvents();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (eventId, title) => {
    Alert.alert(
      "Delete Event",
      `Delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("ngo_events")
                .delete()
                .eq("id", eventId);

              if (error) throw error;
              fetchEvents();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    if (status === "upcoming") return "#2e7d32";
    if (status === "completed") return "#757575";
    return "#f57c00";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>📅 My Events</Text>
          <Text style={styles.subheading}>{events.length} event(s) total</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newBtnText}>+ New Event</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.list}>
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No events yet.</Text>
            <Text style={styles.emptySub}>Tap "+ New Event" to get started!</Text>
          </View>
        ) : (
          events.map((ev) => (
            <View key={ev.id} style={styles.card}>

              {/* Status Badge */}
              <View style={[styles.badge,
                { backgroundColor: getStatusColor(ev.status) + "20",
                  borderColor: getStatusColor(ev.status) }]}>
                <Text style={[styles.badgeText,
                  { color: getStatusColor(ev.status) }]}>
                  {ev.status?.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.cardTitle}>{ev.title}</Text>
              <Text style={styles.cardDetail}>📍 {ev.location}</Text>
              <Text style={styles.cardDetail}>📆 {ev.event_date}</Text>
              {ev.description ? (
                <Text style={styles.cardDesc}>{ev.description}</Text>
              ) : null}

              {/* Action Buttons */}
              {ev.status !== "completed" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleComplete(ev.id, ev.title)}
                  >
                    <Text style={styles.completeBtnText}>✅ Mark Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(ev.id, ev.title)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🆕 Create New Event</Text>

            <TextInput
              style={styles.input}
              placeholder="Event Title *"
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Location *"
              value={form.location}
              onChangeText={(t) => setForm({ ...form, location: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date * (e.g. 2024-12-25)"
              value={form.event_date}
              onChangeText={(t) => setForm({ ...form, event_date: t })}
            />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Description (optional)"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.createBtnText}>Create Event</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  heading: { fontSize: 20, fontWeight: "bold", color: "#2e7d32" },
  subheading: { fontSize: 12, color: "#888", marginTop: 2 },
  newBtn: {
    backgroundColor: "#2e7d32", paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 8,
  },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { flex: 1, padding: 16 },
  emptyContainer: {
    alignItems: "center", justifyContent: "center",
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#555" },
  emptySub: { fontSize: 13, color: "#999", marginTop: 6 },
  card: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: 16, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, elevation: 3,
  },
  badge: {
    alignSelf: "flex-start", borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 10,
    paddingVertical: 3, marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  cardDetail: { fontSize: 13, color: "#555", marginBottom: 3 },
  cardDesc: { fontSize: 13, color: "#777", marginTop: 6, fontStyle: "italic" },
  actions: { flexDirection: "row", marginTop: 12, gap: 10 },
  completeBtn: {
    flex: 1, backgroundColor: "#e8f5e9", borderRadius: 8,
    padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2e7d32",
  },
  completeBtnText: { color: "#2e7d32", fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    flex: 1, backgroundColor: "#fdecea", borderRadius: 8,
    padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#e53935",
  },
  deleteBtnText: { color: "#e53935", fontWeight: "700", fontSize: 13 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 24, width: "100%", maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18, fontWeight: "bold",
    color: "#2e7d32", marginBottom: 16,
  },
  input: {
    borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8,
    padding: 12, marginBottom: 12, fontSize: 14, backgroundColor: "#fafafa",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#ddd",
    borderRadius: 8, padding: 12, alignItems: "center",
  },
  cancelBtnText: { color: "#555", fontWeight: "700" },
  createBtn: {
    flex: 1, backgroundColor: "#2e7d32",
    borderRadius: 8, padding: 12, alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "700" },
});