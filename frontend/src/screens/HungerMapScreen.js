import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Linking, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const BASE_URL = "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" }, ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const SEVERITY = {
  critical: { bg: "#FFF0F0", border: "#E53935", text: "#B71C1C", dot: "#E53935" },
  high:     { bg: "#FFF8E1", border: "#FB8C00", text: "#E65100", dot: "#FB8C00" },
  moderate: { bg: "#E8F5E9", border: "#43A047", text: "#1B5E20", dot: "#43A047" },
  safe:     { bg: "#E3F2FD", border: "#1E88E5", text: "#0D47A1", dot: "#1E88E5" },
};

function severityOf(gapPct) {
  if (gapPct >= 80) return "critical";
  if (gapPct >= 60) return "high";
  if (gapPct >= 30) return "moderate";
  return "safe";
}

const StatCard = ({ icon, label, value, color, subtitle }) => (
  <View style={[S.statCard, { borderTopColor: color }]}>
    <View style={[S.statIconWrap, { backgroundColor: color + "18" }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
    <Text style={S.statValue}>{value}</Text>
    <Text style={S.statLabel}>{label}</Text>
    {subtitle ? <Text style={S.statSub}>{subtitle}</Text> : null}
  </View>
);

const AlertCard = ({ alert }) => {
  const sev = alert.severity || "high";
  const c   = SEVERITY[sev] || SEVERITY.high;
  const gap = Number(alert.gap_percentage || 0);
  const openMap = () => alert.centroid_lat &&
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${alert.centroid_lat},${alert.centroid_lng}`);
  
  return (
    <View style={[S.alertCard, { borderLeftColor: c.border, backgroundColor: c.bg }]}>
      <View style={S.alertTop}>
        <View style={[S.alertDot, { backgroundColor: c.dot }]} />
        <Text style={[S.alertZone, { color: c.text }]}>{alert.zone_label}</Text>
        <div style={[S.severityPill, { backgroundColor: c.border }]}>
          <Text style={S.severityPillText}>{sev.toUpperCase()}</Text>
        </div>
      </View>
      <View style={S.alertGapRow}>
        <Text style={[S.alertGapLabel, { color: c.text }]}>Demand unmet:</Text>
        <View style={S.alertGapTrack}>
          <View style={[S.alertGapFill, { width: `${Math.min(100, gap)}%`, backgroundColor: c.border }]} />
        </View>
        <Text style={[S.alertGapPct, { color: c.text }]}>{gap.toFixed(0)}%</Text>
      </View>
      <Text style={[S.alertDetail, { color: c.text }]}>
        Demand: {alert.total_demand ?? "-"}  Supply: {alert.supply ?? "-"}
      </Text>
      <TouchableOpacity style={[S.alertMapBtn, { borderColor: c.border }]} onPress={openMap}>
        <MaterialIcons name="place" size={13} color={c.text} />
        <Text style={[S.alertMapBtnText, { color: c.text }]}>View Map</Text>
      </TouchableOpacity>
    </View>
  );
};

const MapPanel = ({ clusters, loading }) => {
  if (loading) return (
    <View style={S.mapLoader}>
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={S.mapLoaderText}>Loading AI Analytics...</Text>
    </View>
  );

  const first  = clusters[0];
  const center = first ? `${first.centroid_lat},${first.centroid_lng}` : "11.1271,78.6569";
  
  return (
    <View style={S.nativeMap}>
      <MaterialIcons name="map" size={36} color="#2E7D32" />
      <Text style={S.nativeMapTitle}>Cluster Centroids Found: {clusters.length}</Text>
      {clusters.length === 0
        ? <Text style={S.nativeMapEmpty}>No data yet. Run analysis below.</Text>
        : clusters.slice(0, 8).map(c => (
            <TouchableOpacity key={c.zone_label}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${c.centroid_lat},${c.centroid_lng}`)}>
              <Text style={[S.nativeMapRow, c.red_zone && { color: "#E53935", fontWeight: "bold" }]}>
                {c.red_zone ? "🚨" : "📍"} {c.zone_label} ({Number(c.centroid_lat).toFixed(4)})
              </Text>
            </TouchableOpacity>
          ))
      }
    </View>
  );
};

const ClusterRow = ({ item, index }) => {
  const sev = item.severity || severityOf(item.gap_percentage || 0);
  const c   = SEVERITY[sev] || SEVERITY.safe;
  const gap = Number(item.gap_percentage || 0);
  return (
    <View style={[S.tableRow, index % 2 === 1 && S.tableRowAlt]}>
      <Text style={[S.td, { flex: 1.3, fontWeight: "600" }]}>{item.zone_label}</Text>
      <Text style={[S.td, { flex: 0.8 }]}>{item.point_count}</Text>
      <Text style={[S.td, { flex: 0.9 }]}>{item.total_demand}</Text>
      <View style={[S.td, { flex: 1.1 }]}>
        <View style={S.gapTrack}>
          <View style={[S.gapFill, { width: `${Math.min(100, gap)}%`, backgroundColor: c.border }]} />
        </View>
        <Text style={{ fontSize: 10 }}>{gap.toFixed(0)}%</Text>
      </View>
      <TouchableOpacity style={[S.td, { flex: 0.7, alignItems: "center" }]}
        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.centroid_lat},${item.centroid_lng}`)}>
        <MaterialIcons name="open-in-new" size={16} color="#2E7D32" />
      </TouchableOpacity>
    </View>
  );
};

export default function HungerMapScreen({ navigation }) {
  const [mapLoading, setMapLoading] = useState(true);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [clusters,   setClusters]   = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [kValue,     setKValue]     = useState(5);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("map");

  const loadData = useCallback(async () => {
    setMapLoading(true); setError(null);
    try {
      const mapData = await apiFetch("/hotspot/analyze?k=" + kValue, { method: "POST" });
      setClusters(mapData.clusters || []);
      const alertData = await apiFetch("/hotspot/alerts");
      setAlerts(alertData.alerts || []);
    } catch (e) {
      setError("Connect to FastAPI server to see AI Hotspots.");
    } finally { setMapLoading(false); }
  }, [kValue]);

  useEffect(() => { loadData(); }, [loadData]);

  const redCount = clusters.filter(c => c.red_zone).length;

  return (
    <ScrollView style={S.screen} contentContainerStyle={S.content}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#2E7D32" />
        </TouchableOpacity>
        <View>
          <Text style={S.title}>Hunger Hotspot Map</Text>
          <Text style={S.subtitle}>Unsupervised Machine Learning Analysis</Text>
        </View>
        <TouchableOpacity style={S.btnPrimary} onPress={loadData} disabled={analyzing}>
          <Text style={S.btnPrimaryTxt}>{analyzing ? "Analyzing..." : "Refresh AI"}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={S.errBanner}>
          <Text style={S.errText}>{error}</Text>
        </View>
      )}

      <View style={S.statsRow}>
        <StatCard icon="layers" label="Sectors" value={clusters.length} color="#2E7D32" />
        <StatCard icon="warning" label="Red Zones" value={redCount} color="#E53935" />
      </View>

      <View style={S.bodyRow}>
        <View style={S.mapPanel}>
          <MapPanel clusters={clusters} loading={mapLoading} />
        </View>

        <View style={S.alertPanel}>
          <Text style={S.alertHeadTxt}>Active Alerts</Text>
          {alerts.map((a, i) => <AlertCard key={i} alert={a} />)}
        </View>
      </View>
    </ScrollView>
  );
}

// Reuse your existing StyleSheet 'S' here...
const SH = { elevation: 3 };
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F6F9" },
  content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backBtn: { padding: 8, backgroundColor: "#E8F5E9", borderRadius: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#1A1C1E" },
  subtitle: { fontSize: 12, color: "#888" },
  btnPrimary: { marginLeft: "auto", backgroundColor: "#2E7D32", padding: 10, borderRadius: 8 },
  btnPrimaryTxt: { color: "#fff", fontWeight: "bold" },
  errBanner: { backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, marginBottom: 10 },
  errText: { color: "#B71C1C", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, borderTopWidth: 3, alignItems: "center", ...SH },
  statValue: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
  bodyRow: { gap: 16 },
  mapPanel: { backgroundColor: "#fff", borderRadius: 12, height: 250, justifyContent: "center", ...SH },
  alertPanel: { backgroundColor: "#fff", borderRadius: 12, padding: 16, ...SH },
  alertHeadTxt: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  alertCard: { borderLeftWidth: 4, padding: 12, marginBottom: 10, borderRadius: 4, backgroundColor: "#f9f9f9" },
  alertTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertZone: { fontWeight: "bold", flex: 1 },
  alertGapRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  alertGapTrack: { flex: 1, height: 6, backgroundColor: "#eee", borderRadius: 3, marginHorizontal: 8 },
  alertGapFill: { height: 6, borderRadius: 3 },
  alertMapBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  nativeMap: { alignItems: "center" },
  nativeMapTitle: { fontWeight: "bold", marginVertical: 8 },
  nativeMapRow: { fontSize: 13, marginVertical: 2 },
  tableRow: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderColor: "#eee" },
  td: { fontSize: 12 },
  gapTrack: { height: 4, backgroundColor: "#eee", width: 50 }
});