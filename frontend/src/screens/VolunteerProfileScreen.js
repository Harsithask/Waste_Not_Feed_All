import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function VolunteerProfileScreen({ navigation, route }) {
  const profile = route.params?.profile;
  const volunteerId = route.params?.volunteerId;

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile not loaded.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Volunteer Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile.name || "N/A"}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email || "N/A"}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{profile.phone || "N/A"}</Text>

        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>{profile.city || "N/A"}</Text>

        <Text style={styles.label}>Volunteer ID</Text>
        <Text style={styles.value}>{volunteerId || profile.id || "N/A"}</Text>

        {profile.skills && (
          <>
            <Text style={styles.label}>Skills</Text>
            <Text style={styles.value}>{profile.skills}</Text>
          </>
        )}

        {profile.transport && (
          <>
            <Text style={styles.label}>Transport</Text>
            <Text style={styles.value}>{profile.transport}</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    minHeight: "100%",
    backgroundColor: "#F5F6F8",
    alignItems: "center",
    padding: 24,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: "#718096",
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginTop: 2,
  },
  button: {
    width: "100%",
    backgroundColor: "#2ECC71",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});