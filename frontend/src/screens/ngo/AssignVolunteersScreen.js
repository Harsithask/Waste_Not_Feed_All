import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { getAllVolunteers, getActiveEvents, assignVolunteer } from "../../services/api";
 
export default function AssignVolunteersScreen({ route }) {
  const ngoId = route?.params?.ngoId || "";
  const [volunteers,         setVolunteers]         = useState([]);
  const [events,             setEvents]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [selectedEvent,      setSelectedEvent]      = useState(null);
  const [selectedVolunteer,  setSelectedVolunteer]  = useState(null);
  const [task,               setTask]               = useState("");
  const [assigning,          setAssigning]          = useState(false);
 
  useEffect(() => { fetchData(); }, []);
 
  const fetchData = async () => {
    try {
      // GET /volunteers  +  GET /ngo/events/active
      const [volData, evData] = await Promise.all([
        getAllVolunteers(),
        getActiveEvents(),
      ]);
      setVolunteers(volData || []);
      setEvents(evData || []);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  };
 
  const handleAssign = () => {
    if (!selectedEvent)     { Alert.alert("Please select an event first");     return; }
    if (!selectedVolunteer) { Alert.alert("Please select a volunteer first");  return; }
 
    const vol = volunteers.find(v => v.id === selectedVolunteer);
    const ev  = events.find(e => e.id === selectedEvent);
 
    Alert.alert("Confirm Assignment", `Assign ${vol?.name} to "${ev?.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Assign",
        onPress: async () => {
          setAssigning(true);
          try {
            // POST /ngo/assign-volunteer
            await assignVolunteer({
              event_id:         selectedEvent,
              volunteer_id:     selectedVolunteer,
              task_description: task,
            });
            Alert.alert("✅ Done!", `${vol?.name} assigned to ${ev?.title}`);
            setSelectedEvent(null);
            setSelectedVolunteer(null);
            setTask("");
          } catch (err) {
            Alert.alert("Error", err.message);
          } finally {
            setAssigning(false);
          }
        },
      },
    ]);
  };
 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.heading}>🙋 Assign Volunteers</Text>
 
        {/* Step 1: Select Event */}
        <Text style={styles.stepLabel}>Step 1: Select an Event</Text>
        {events.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.noData}>No upcoming events.</Text>
            <Text style={styles.noDataSub}>Go to Manage Events and create one first!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 16, marginBottom: 8 }}>
            {events.map((ev) => (
              <TouchableOpacity key={ev.id}
                style={[styles.chip, selectedEvent === ev.id && styles.chipActive]}
                onPress={() => setSelectedEvent(ev.id)}>
                <Text style={[styles.chipText, selectedEvent === ev.id && styles.chipTextActive]}>
                  📅 {ev.title}
                </Text>
                <Text style={[styles.chipSub, selectedEvent === ev.id && { color: "#c8e6c9" }]}>
                  📍 {ev.location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
 
        {/* Step 2: Select Volunteer */}
        <Text style={styles.stepLabel}>Step 2: Select a Volunteer</Text>
        {volunteers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.noData}>No volunteers registered yet.</Text>
          </View>
        ) : (
          volunteers.map((vol) => (
            <TouchableOpacity key={vol.id}
              style={[styles.volunteerCard,
                selectedVolunteer === vol.id && styles.volunteerActive]}
              onPress={() => setSelectedVolunteer(vol.id)}>
              <View style={styles.volAvatar}>
                <Text style={styles.volAvatarText}>
                  {vol.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.volInfo}>
                <Text style={styles.volName}>{vol.name}</Text>
                <Text style={styles.volDetail}>📧 {vol.email}</Text>
                <Text style={styles.volDetail}>📍 {vol.city} • 📞 {vol.phone}</Text>
              </View>
              {selectedVolunteer === vol.id && <Text style={styles.checkmark}>✅</Text>}
            </TouchableOpacity>
          ))
        )}
 
        {/* Step 3: Task + Assign */}
        <View style={styles.bottomSection}>
          <Text style={styles.stepLabel}>Step 3: Add Task (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Handle food packing at venue"
            value={task}
            onChangeText={setTask}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.assignBtn,
              (!selectedEvent || !selectedVolunteer || assigning) && styles.assignBtnDisabled,
            ]}
            onPress={handleAssign}
            disabled={!selectedEvent || !selectedVolunteer || assigning}>
            <Text style={styles.assignBtnText}>
              {assigning ? "Assigning..." : "✅ Confirm Assignment"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#f0f4f8" },
  center:         { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:    { marginTop: 12, color: "#666" },
  heading:        { fontSize: 22, fontWeight: "bold", color: "#2e7d32", padding: 16, paddingBottom: 4 },
  stepLabel:      { fontSize: 15, fontWeight: "700", color: "#333", paddingHorizontal: 16, paddingVertical: 10 },
  emptyBox:       { paddingHorizontal: 16, marginBottom: 8 },
  noData:         { color: "#555", fontSize: 14, fontWeight: "600" },
  noDataSub:      { color: "#999", fontSize: 13, marginTop: 4 },
  chip:           { borderWidth: 2, borderColor: "#2e7d32", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, minWidth: 150, marginBottom: 8 },
  chipActive:     { backgroundColor: "#2e7d32" },
  chipText:       { color: "#2e7d32", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  chipSub:        { color: "#555", fontSize: 11, marginTop: 2 },
  volunteerCard:  { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 2, borderColor: "transparent", shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  volunteerActive: { borderColor: "#2e7d32", backgroundColor: "#e8f5e9" },
  volAvatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: "#2e7d32", justifyContent: "center", alignItems: "center", marginRight: 12 },
  volAvatarText:  { color: "#fff", fontSize: 20, fontWeight: "700" },
  volInfo:        { flex: 1 },
  volName:        { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  volDetail:      { fontSize: 12, color: "#666", marginTop: 2 },
  checkmark:      { fontSize: 20 },
  bottomSection:  { padding: 16 },
  input:          { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 14, backgroundColor: "#fff", minHeight: 60, textAlignVertical: "top" },
  assignBtn:      { backgroundColor: "#2e7d32", borderRadius: 10, padding: 15, alignItems: "center" },
  assignBtnDisabled: { backgroundColor: "#a5d6a7" },
  assignBtnText:  { color: "#fff", fontWeight: "700", fontSize: 15 },
});