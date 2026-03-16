import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
  Platform, Modal, TextInput,
} from "react-native";
import { API } from "../services/api";
 
let MapContainer, TileLayer, CircleMarker, Tooltip, useMap;
 
const TYPE_CONFIG = {
  homeless_shelter:   { color: "#d32f2f", emoji: "🏠", label: "Homeless Shelter" },
  orphanage:          { color: "#e64a19", emoji: "👶", label: "Orphanage" },
  old_age_home:       { color: "#7b1fa2", emoji: "👴", label: "Old Age Home" },
  community_kitchen:  { color: "#1565c0", emoji: "🍽️", label: "Community Kitchen" },
  slum_settlement:    { color: "#f57f17", emoji: "🏘️", label: "Slum Settlement" },
  ngo_distribution:   { color: "#2e7d32", emoji: "📦", label: "NGO / Community Hall" },
  govt_welfare:       { color: "#00838f", emoji: "🏛️", label: "Govt Welfare Centre" },
  low_income_housing: { color: "#4527a0", emoji: "🏗️", label: "Low Income Housing" },
};
const DEFAULT_TYPE = { color: "#e53935", emoji: "📍", label: "Need Point" };
 
const DISTRICT_CENTERS = {
  "All":        [11.1271, 77.5000],
  "Coimbatore": [11.0168, 76.9558],
  "Erode":      [11.3410, 77.7172],
  "Tiruppur":   [11.1075, 77.3411],
  "Nilgiris":   [11.4916, 76.7337],
  "Salem":      [11.6643, 78.1460],
  "Dindigul":   [10.3673, 77.9803],
  "Namakkal":   [11.2189, 78.1674],
  "Karur":      [10.9601, 78.0766],
};
 
const DISTRICT_ZOOM = {
  "All": 8, "Coimbatore": 12, "Erode": 12,
  "Tiruppur": 12, "Nilgiris": 11, "Salem": 12,
  "Dindigul": 12, "Namakkal": 12, "Karur": 12,
};
 
function FitBounds({ spots }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length > 0) {
      const bounds = spots.map((s) => [
        parseFloat(s.latitude), parseFloat(s.longitude)
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [spots]);
  return null;
}
 
export default function HungerMapScreen({ route, navigation }) {
  const ngoId = route?.params?.ngoId || "";
  const [allSpots,   setAllSpots]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mapReady,   setMapReady]   = useState(false);
  const [activeCity, setActiveCity] = useState("All");
  const [showAdd,    setShowAdd]    = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [newSpot,    setNewSpot]    = useState({
    place_name: "", type: "homeless_shelter",
    latitude: "", longitude: "", address: "", city: "Coimbatore",
  });
 
  const districts = Object.keys(DISTRICT_CENTERS);
  const spots = activeCity === "All"
    ? allSpots
    : allSpots.filter(s => s.city === activeCity);
 
  useEffect(() => {
    if (Platform.OS === "web") {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      import("react-leaflet").then((mod) => {
        MapContainer = mod.MapContainer;
        TileLayer    = mod.TileLayer;
        CircleMarker = mod.CircleMarker;
        Tooltip      = mod.Tooltip;
        useMap       = mod.useMap;
        setMapReady(true);
      });
    }
    fetchSpots();
  }, []);
 
  const fetchSpots = async () => {
    setLoading(true);
    try {
      const data = await API.get("/ngo/red-spots");
      setAllSpots(data || []);
    } catch (err) {
      console.log("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAddSpot = async () => {
    if (!newSpot.place_name) { window.alert("Place name is required"); return; }
    if (!newSpot.latitude)   { window.alert("Latitude is required");   return; }
    if (!newSpot.longitude)  { window.alert("Longitude is required");  return; }
    setAdding(true);
    try {
      await API.post("/ngo/red-spots", {
        ...newSpot,
        latitude:  parseFloat(newSpot.latitude),
        longitude: parseFloat(newSpot.longitude),
      });
      setShowAdd(false);
      setNewSpot({ place_name: "", type: "homeless_shelter", latitude: "", longitude: "", address: "", city: "Coimbatore" });
      fetchSpots();
    } catch (err) {
      window.alert("Error: " + err.message);
    } finally {
      setAdding(false);
    }
  };
 
  const typeCounts = spots.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});
 
  const renderMap = () => {
    if (Platform.OS !== "web") {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺️ Open in browser to view map</Text>
        </View>
      );
    }
    if (!mapReady) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator color="#d32f2f" />
          <Text style={{ marginTop: 8, color: "#666" }}>Loading map...</Text>
        </View>
      );
    }
 
    const center = DISTRICT_CENTERS[activeCity] || DISTRICT_CENTERS["All"];
    const zoom   = DISTRICT_ZOOM[activeCity]    || 8;
 
    return (
      <View style={styles.mapWrapper}>
        <MapContainer
          key={activeCity}
          center={center}
          zoom={zoom}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {spots.length > 0 && activeCity === "All" && (
            <FitBounds spots={spots} />
          )}
          {spots.map((spot, idx) => {
            const cfg = TYPE_CONFIG[spot.type] || DEFAULT_TYPE;
            return (
              <CircleMarker
                key={idx}
                center={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
                radius={10}
                pathOptions={{
                  color: cfg.color, fillColor: cfg.color,
                  fillOpacity: 0.8, weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div style={{ minWidth: 190 }}>
                    <div style={{ fontWeight: "bold", color: cfg.color, marginBottom: 4 }}>
                      {cfg.emoji} {spot.place_name}
                    </div>
                    <div>🏷️ {cfg.label}</div>
                    {spot.address && <div>📍 {spot.address}</div>}
                    <div>🏙️ {spot.city}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </View>
    );
  };
 
  return (
    <SafeAreaView style={styles.container}>
 
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📍 Food Need Map</Text>
          <Text style={styles.headerSub}>
            {spots.length} locations • {activeCity === "All" ? "8 Districts" : activeCity}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
 
      {/* District Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll} contentContainerStyle={{ padding: 8, gap: 6 }}>
        {districts.map((city) => {
          const count = city === "All"
            ? allSpots.length
            : allSpots.filter(s => s.city === city).length;
          return (
            <TouchableOpacity key={city}
              style={[styles.tab, activeCity === city && styles.tabActive]}
              onPress={() => setActiveCity(city)}>
              <Text style={[styles.tabText, activeCity === city && styles.tabTextActive]}>
                {city}
              </Text>
              <Text style={[styles.tabCount, activeCity === city && styles.tabCountActive]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
 
      {/* Type chips */}
      {!loading && spots.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.summaryScroll}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 6 }}>
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = TYPE_CONFIG[type] || DEFAULT_TYPE;
            return (
              <View key={type} style={[styles.chip, { borderColor: cfg.color }]}>
                <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.chipCount, { color: cfg.color }]}>{count}</Text>
                <Text style={styles.chipLabel}>{cfg.label}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
 
      {/* Map */}
      {loading
        ? <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#d32f2f" />
            <Text style={{ marginTop: 10, color: "#666" }}>Loading locations...</Text>
          </View>
        : renderMap()
      }
 
      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.legendScroll} contentContainerStyle={{ padding: 6, gap: 5 }}>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <View key={key} style={[styles.legendItem,
            { backgroundColor: cfg.color + "15", borderColor: cfg.color }]}>
            <Text style={styles.legendEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.legendText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        ))}
      </ScrollView>
 
      {/* Locations list */}
      <ScrollView style={styles.list}>
        <Text style={styles.listTitle}>📋 Locations ({spots.length})</Text>
        {spots.map((spot, idx) => {
          const cfg = TYPE_CONFIG[spot.type] || DEFAULT_TYPE;
          return (
            <View key={idx} style={[styles.spotCard, { borderLeftColor: cfg.color }]}>
              <Text style={styles.spotEmoji}>{cfg.emoji}</Text>
              <View style={styles.spotInfo}>
                <Text style={styles.spotName}>{spot.place_name}</Text>
                <Text style={styles.spotMeta}>{cfg.label} • {spot.city}</Text>
                {spot.address
                  ? <Text style={styles.spotAddress}>📍 {spot.address}</Text>
                  : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
 
      {/* Add Location Modal */}
      <Modal visible={showAdd} transparent animationType="slide"
        onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📍 Add a Location in Need</Text>
            <Text style={styles.modalSub}>
              Spotted people in need? Add this location.
            </Text>
 
            <TextInput style={styles.input} placeholder="Place Name *"
              value={newSpot.place_name}
              onChangeText={(t) => setNewSpot({ ...newSpot, place_name: t })} />
            <TextInput style={styles.input} placeholder="Address"
              value={newSpot.address}
              onChangeText={(t) => setNewSpot({ ...newSpot, address: t })} />
            <TextInput style={styles.input} placeholder="Latitude * (e.g. 11.0168)"
              value={newSpot.latitude} keyboardType="numeric"
              onChangeText={(t) => setNewSpot({ ...newSpot, latitude: t })} />
            <TextInput style={styles.input} placeholder="Longitude * (e.g. 76.9558)"
              value={newSpot.longitude} keyboardType="numeric"
              onChangeText={(t) => setNewSpot({ ...newSpot, longitude: t })} />
 
            <Text style={styles.typeLabel}>District:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}>
              {Object.keys(DISTRICT_CENTERS).filter(d => d !== "All").map((city) => (
                <TouchableOpacity key={city}
                  style={[styles.typeChip,
                    newSpot.city === city && { backgroundColor: "#c62828", borderColor: "#c62828" }]}
                  onPress={() => setNewSpot({ ...newSpot, city })}>
                  <Text style={[styles.typeChipText,
                    newSpot.city === city && { color: "#fff" }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
 
            <Text style={styles.typeLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity key={key}
                  style={[styles.typeChip,
                    newSpot.type === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setNewSpot({ ...newSpot, type: key })}>
                  <Text style={[styles.typeChipText,
                    newSpot.type === key && { color: "#fff" }]}>
                    {cfg.emoji} {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
 
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, adding && { opacity: 0.6 }]}
                onPress={handleAddSpot} disabled={adding}>
                {adding
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>Add Location</Text>
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
  container:          { flex: 1, backgroundColor: "#f0f4f8" },
  header:             { backgroundColor: "#c62828", padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle:        { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSub:          { fontSize: 12, color: "#ffcdd2", marginTop: 3 },
  addBtn:             { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  addBtnText:         { color: "#fff", fontWeight: "700", fontSize: 13 },
  tabsScroll:         { maxHeight: 52, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab:                { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd", flexDirection: "row", alignItems: "center", gap: 5 },
  tabActive:          { backgroundColor: "#c62828", borderColor: "#c62828" },
  tabText:            { fontSize: 12, fontWeight: "600", color: "#555" },
  tabTextActive:      { color: "#fff" },
  tabCount:           { fontSize: 11, color: "#888", backgroundColor: "#f0f0f0", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10 },
  tabCountActive:     { color: "#c62828", backgroundColor: "rgba(255,255,255,0.9)" },
  summaryScroll:      { maxHeight: 50 },
  chip:               { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipEmoji:          { fontSize: 13 },
  chipCount:          { fontSize: 15, fontWeight: "800" },
  chipLabel:          { fontSize: 10, color: "#666" },
  mapWrapper:         { height: 340, marginHorizontal: 12, marginTop: 8, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#ddd" },
  mapPlaceholder:     { height: 340, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  mapPlaceholderText: { color: "#888", textAlign: "center" },
  legendScroll:       { maxHeight: 44 },
  legendItem:         { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 14, paddingHorizontal: 7, paddingVertical: 3 },
  legendEmoji:        { fontSize: 11 },
  legendText:         { fontSize: 10, fontWeight: "600" },
  list:               { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  listTitle:          { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  spotCard:           { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 5, borderLeftWidth: 4, elevation: 1 },
  spotEmoji:          { fontSize: 20, marginRight: 10 },
  spotInfo:           { flex: 1 },
  spotName:           { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  spotMeta:           { fontSize: 11, color: "#888", marginTop: 1 },
  spotAddress:        { fontSize: 10, color: "#aaa", marginTop: 1 },
  modalOverlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 16 },
  modalCard:          { backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "90%" },
  modalTitle:         { fontSize: 18, fontWeight: "800", color: "#c62828", marginBottom: 4 },
  modalSub:           { fontSize: 13, color: "#666", marginBottom: 16 },
  input:              { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14 },
  typeLabel:          { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  typeChip:           { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  typeChipText:       { fontSize: 12, color: "#555", fontWeight: "600" },
  modalActions:       { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn:          { flex: 1, borderWidth: 1.5, borderColor: "#ddd", borderRadius: 8, padding: 12, alignItems: "center" },
  cancelBtnText:      { color: "#555", fontWeight: "700" },
  submitBtn:          { flex: 1, backgroundColor: "#c62828", borderRadius: 8, padding: 12, alignItems: "center" },
  submitBtnText:      { color: "#fff", fontWeight: "700" },
});