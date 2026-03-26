import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
  ScrollView, TouchableOpacity, Modal, Platform,
} from "react-native";
import { getNGOEvents, createNGOEvent, completeNGOEvent, deleteNGOEvent } from "../../services/api";

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

export default function ManageEventsScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [form, setForm] = useState({ title: "", location: "", event_date: "", description: "" });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getNGOEvents(ngoId);
      setEvents(data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title)      { Alert.alert("Title is required");    return; }
    if (!form.location)   { Alert.alert("Location is required"); return; }
    if (!form.event_date) { Alert.alert("Date is required");     return; }

    setCreating(true);
    try {
      await createNGOEvent({ ngo_id: ngoId, ...form });
      setModalVisible(false);
      setForm({ title: "", location: "", event_date: "", description: "" });
      fetchEvents();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = (eventId, title) => {
    Alert.alert("Complete Event", `Mark "${title}" as completed?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Complete", onPress: async () => {
        try { await completeNGOEvent(eventId); fetchEvents(); }
        catch (err) { Alert.alert("Error", err.message); }
      }},
    ]);
  };

  const handleDelete = (eventId, title) => {
    Alert.alert("Delete Event", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteNGOEvent(eventId); fetchEvents(); }
        catch (err) { Alert.alert("Error", err.message); }
      }},
    ]);
  };

  const getStatusConfig = (status) => {
    if (status === "upcoming")  return { bg: C.primaryLight, text: C.primaryDark, label: "UPCOMING" };
    if (status === "completed") return { bg: C.surface,      text: C.muted,       label: "COMPLETED" };
    return                             { bg: "#fef9c3",      text: "#854d0e",     label: (status || "").toUpperCase() };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.heading}>Manage Events</Text>
          <Text style={styles.count}>{events.length} event(s)</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.newBtnText}>+ New Event</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySub}>Tap "+ New Event" to get started!</Text>
          </View>
        ) : (
          events.map((ev) => {
            const sc = getStatusConfig(ev.status);
            return (
              <View key={ev.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardDetail}>📍 {ev.location}</Text>
                <Text style={styles.cardDetail}>📆 {ev.event_date}</Text>
                {ev.description ? <Text style={styles.cardDesc}>{ev.description}</Text> : null}

                {ev.status !== "completed" && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(ev.id, ev.title)}>
                      <Text style={styles.completeBtnText}>Mark Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(ev.id, ev.title)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create New Event</Text>

            {[
              { placeholder: "Event Title *",           key: "title",       multi: false },
              { placeholder: "Location *",              key: "location",    multi: false },
              { placeholder: "Date * (e.g. 2024-12-25)",key: "event_date",  multi: false },
              { placeholder: "Description (optional)",  key: "description", multi: true  },
            ].map(f => (
              <TextInput
                key={f.key}
                style={[styles.input, f.multi && { height: 80, textAlignVertical: "top" }]}
                placeholder={f.placeholder}
                placeholderTextColor={C.muted}
                value={form[f.key]}
                onChangeText={t => setForm({ ...form, [f.key]: t })}
                multiline={f.multi}
              />
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate} disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color={C.white} />
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
  root:        { flex: 1, backgroundColor: C.surface },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  loadingText: { marginTop: 12, color: C.muted },

  pageHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: C.white, padding: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  heading: { fontSize: 20, fontWeight: "800", color: C.primaryDark },
  count:   { fontSize: 12, color: C.muted, marginTop: 2 },
  newBtn:  { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  newBtnText: { color: C.white, fontWeight: "700", fontSize: 13 },

  body: { padding: 12, gap: 8, flexGrow: 1 },

  card: {
    backgroundColor: C.white, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primaryDark, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 },
  cardTitle:  { fontSize: 15, fontWeight: "700", color: C.text, flex: 1 },
  badge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:  { fontSize: 10, fontWeight: "700" },
  cardDetail: { fontSize: 12, color: C.subtext, marginBottom: 2 },
  cardDesc:   { fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" },

  actions:        { flexDirection: "row", marginTop: 10, gap: 8 },
  completeBtn:    { flex: 1, backgroundColor: C.primaryLight, borderRadius: 8, paddingVertical: 7, alignItems: "center", borderWidth: 1, borderColor: C.primaryMid },
  completeBtnText:{ color: C.primaryDark, fontWeight: "700", fontSize: 13 },
  deleteBtn:      { flex: 1, backgroundColor: "#fff5f5", borderRadius: 8, paddingVertical: 7, alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  deleteBtnText:  { color: C.danger, fontWeight: "700", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: "800", color: C.primaryDark, marginBottom: 20 },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 12, marginBottom: 10, fontSize: 14,
    backgroundColor: C.surface, color: C.text,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 6 },
  cancelBtn:    { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 13, alignItems: "center" },
  cancelBtnText:{ color: C.subtext, fontWeight: "700" },
  createBtn:    { flex: 1, backgroundColor: C.primary, borderRadius: 10, padding: 13, alignItems: "center" },
  createBtnText:{ color: C.white, fontWeight: "700" },

  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.muted },
});