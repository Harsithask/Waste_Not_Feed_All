import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, ActivityIndicator, Alert
} from "react-native";
import * as Location from "expo-location";

export default function DonationMapScreen({ route, navigation }) {
  const { donation } = route.params;
  const [loading, setLoading] = useState(false);

  const openMap = async () => {
    setLoading(true);

    try {
      // Step 1: Ask for location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to find the shortest route to the donor."
        );
        setLoading(false);
        return;
      }

      // Step 2: Get volunteer's current GPS position
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      // Step 3: Build the destination from donor's pickup_location
      const destination = encodeURIComponent(donation.pickup_location);

      // Step 4: Build the URL — origin = volunteer GPS, destination = donor address
      // Google Maps will automatically calculate the shortest/fastest route
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}&travelmode=driving`;
      const androidUrl = `google.navigation:q=${destination}&mode=d`;
      const iosUrl = `maps://maps.apple.com/?saddr=${latitude},${longitude}&daddr=${destination}&dirflg=d`;

      if (Platform.OS === "web") {
        window.open(webUrl, "_blank");
      } else if (Platform.OS === "ios") {
        Linking.openURL(iosUrl).catch(() => Linking.openURL(webUrl));
      } else {
        Linking.openURL(androidUrl).catch(() => Linking.openURL(webUrl));
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donor Location</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Food</Text>
        <Text style={styles.value}>{donation.name}</Text>

        <Text style={styles.label}>Pickup Location</Text>
        <Text style={styles.value}>{donation.pickup_location}</Text>

        <Text style={styles.label}>Contact</Text>
        <Text style={styles.value}>{donation.contact_no || "N/A"}</Text>
      </View>

      {/* Route info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📍 Your location will be used as the starting point</Text>
        <Text style={styles.infoText}>🗺️ Google Maps will find the shortest route</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={openMap}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>🚗 Get Shortest Route</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6F8",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2d3748",
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#e6fffa",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
  },
  infoText: {
    fontSize: 13,
    color: "#276749",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#2ECC71",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: "#a0d9b4",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  back: {
    marginTop: 8,
  },
  backText: {
    color: "#718096",
    fontSize: 15,
  },
});
