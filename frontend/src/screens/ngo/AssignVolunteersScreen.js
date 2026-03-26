import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, ScrollView, TouchableOpacity,
} from "react-native";
import { getAllVolunteers, getActiveEvents, assignVolunteer } from "../../services/api";

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

export default function AssignVolunteersScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [volunteers,        setVolunteers]        = useState([]);
  const [events,            setEvents]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedEvent,     setSelectedEvent]     = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [task,              setTask]              = useState("");
  const [assigning,         setAssigning]         = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [volData, evData] = await Promise.all([getAllVolunteers(), getActiveEvents()]);
      setVolunteers(volData || []);
      setEvents(evData || []);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (!selectedEvent)     { Alert.alert("Please select an event first");    return; }
    if (!selectedVolunteer) { Alert.alert("Please select a volunteer first"); return; }

    const vol = volunteers.find(v => v.id === selectedVolunteer);
    const ev  = events.find(e => e.id === selectedEvent);

    Alert.alert("Confirm", `Assign ${vol?.name} to "${ev?.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Assign", onPress: async () => {
        setAssigning(true);
        try {
          await assignVolunteer({ event_id: selectedEvent, volunteer_id: selectedVolunteer, task_description: task });
          Alert.alert("Done!", `${vol?.name} assigned to ${ev?.title}`);
          setSelectedEvent(null); setSelectedVolunteer(null); setTask("");
        } catch (err) {
          Alert.alert("Error", err.message);
        } finally {
          setAssigning(false);
        }
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <Text style={styles.stepLabel}>STEP 1 — Select an Event</Text>
        {events.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.noData}>No upcoming events.</Text>
            <Text style={styles.noDataSub}>Go to Manage Events and create one first.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {events.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventChip, selectedEvent === ev.id && styles.eventChipActive]}
                onPress={() => setSelectedEvent(ev.id)}
              >
                <Text style={[styles.eventChipTitle, selectedEvent === ev.id && { color: C.white }]}>
                  {ev.title}
                </Text>
                <Text style={[styles.eventChipSub, selectedEvent === ev.id && { color: C.primaryLight }]}>
                  {ev.location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.stepLabel}>STEP 2 — Select a Volunteer</Text>
        {volunteers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.noData}>No volunteers registered yet.</Text>
          </View>
        ) : (
          volunteers.map((vol) => (
            <TouchableOpacity
              key={vol.id}
              style={[styles.volCard, selectedVolunteer === vol.id && styles.volCardActive]}
              onPress={() => setSelectedVolunteer(vol.id)}
            >
              <View style={styles.volAvatar}>
                <Text style={styles.volAvatarText}>{vol.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.volInfo}>
                <Text style={styles.volName}>{vol.name}</Text>
                <Text style={styles.volDetail}>{vol.email}</Text>
                <Text style={styles.volDetail}>{vol.city}  ·  {vol.phone}</Text>
              </View>
              {selectedVolunteer === vol.id && (
                <View style={styles.selectedTick}>
                  <Text style={styles.selectedTickText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.stepLabel}>STEP 3 — Add Task (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Handle food packing at venue"
          placeholderTextColor={C.muted}
          value={task}
          onChangeText={setTask}
          multiline
        />

        <TouchableOpacity
          style={[styles.assignBtn, (!selectedEvent || !selectedVolunteer || assigning) && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={!selectedEvent || !selectedVolunteer || assigning}
        >
          <Text style={styles.assignBtnText}>
            {assigning ? "Assigning..." : "Confirm Assignment"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.surface },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: C.muted },

  body:      { padding: 14, gap: 2 },
  stepLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, marginTop: 16, marginBottom: 10 },

  emptyBox:   { padding: 4, marginBottom: 8 },
  noData:     { color: C.subtext, fontSize: 14, fontWeight: "600" },
  noDataSub:  { color: C.muted,   fontSize: 12, marginTop: 3 },

  eventChip: {
    borderWidth: 2, borderColor: C.primary, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 8, minWidth: 120, marginBottom: 4,
  },
  eventChipActive:  { backgroundColor: C.primary },
  eventChipTitle:   { color: C.primary, fontWeight: "700", fontSize: 13 },
  eventChipSub:     { color: C.subtext, fontSize: 11, marginTop: 2 },

  volCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 12, padding: 11,
    marginBottom: 6, borderWidth: 1.5, borderColor: C.border,
  },
  volCardActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  volAvatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: "center", alignItems: "center", marginRight: 12 },
  volAvatarText: { color: C.white, fontSize: 18, fontWeight: "700" },
  volInfo:       { flex: 1 },
  volName:       { fontSize: 14, fontWeight: "700", color: C.text },
  volDetail:     { fontSize: 12, color: C.muted, marginTop: 2 },
  selectedTick:  { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, justifyContent: "center", alignItems: "center" },
  selectedTickText: { color: C.white, fontWeight: "800", fontSize: 12 },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: C.white,
    minHeight: 60, textAlignVertical: "top", color: C.text,
    marginBottom: 16,
  },
  assignBtn:         { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  assignBtnDisabled: { opacity: 0.5 },
  assignBtnText:     { color: C.white, fontWeight: "700", fontSize: 15 },
});