import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DonationDetailsScreen from "../screens/DonationDetailsScreen";

// Import your existing screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// ADD THESE NEW IMPORTS:
import DonorRegisterScreen from "../screens/DonorRegisterScreen";
import NgoRegisterScreen from "../screens/NgoRegisterScreen"; // Comment out if file doesn't exist yet
import VolunteerRegisterScreen from "../screens/VolunteerRegisterScreen"; // Comment out if file doesn't exist yet
import DonorDashboard from '../screens/DonorDashboard'; // Check spelling: Donar vs Donor
import AddDonationScreen from '../screens/AddDonationScreen';

import NGODashboardScreen     from "../screens/ngo/NGODashboardScreen";
import AvailableDonationsScreen from "../screens/ngo/AvailableDonationsScreen";
import ManageEventsScreen     from "../screens/ngo/ManageEventsScreen";
import AssignVolunteersScreen from "../screens/ngo/AssignVolunteersScreen";
import MyClaimsScreen         from "../screens/ngo/MyClaimsScreen";
import HungerMapScreen        from "../screens/HungerMapScreen";

// Volunteer screens
import VolunteerDashboardScreen from "../screens/VolunteerDashboardScreen";
import VolunteerProfileScreen from "../screens/VolunteerProfileScreen";
import DonationMapScreen from "../screens/DonationMapScreen";

// Add this import at the top with the others
import DonorHomeScreen from "../screens/DonorHomeScreen";
import ScanScreen      from "../screens/ScanScreen";

import NGOProfileScreen from "../screens/ngo/NGOProfileScreen";
import DonorProfileScreen from "../screens/DonorProfileScreen";

import AssignDonationVolunteerScreen from "../screens/ngo/AssignDonationVolunteerScreen";


const ph = StyleSheet.create({
  wrap:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f4f8" },
  emoji:   { fontSize: 60, marginBottom: 16 },
  title:   { fontSize: 22, fontWeight: "bold", color: "#2e7d32", marginBottom: 8 },
  sub:     { color: "#888", marginBottom: 32 },
  btn:     { backgroundColor: "#e53935", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="Login"             component={LoginScreen} />
      <Stack.Screen name="Register"          component={RegisterScreen} />
      <Stack.Screen name="DonorRegister"     component={DonorRegisterScreen} />
      <Stack.Screen name="NgoRegister"       component={NgoRegisterScreen} />
      <Stack.Screen name="VolunteerRegister" component={VolunteerRegisterScreen} />
 
      {/* NGO */}
      <Stack.Screen name="NGODashboard"      component={NGODashboardScreen} />
      <Stack.Screen name="AvailableDonations" component={AvailableDonationsScreen}
        options={{ headerShown: true, title: "Available Donations" }} />
      <Stack.Screen name="ManageEvents"      component={ManageEventsScreen}
        options={{ headerShown: true, title: "Manage Events" }} />
      <Stack.Screen name="AssignVolunteers"  component={AssignVolunteersScreen}
        options={{ headerShown: true, title: "Assign Volunteers" }} />
      <Stack.Screen name="MyClaims"          component={MyClaimsScreen}
        options={{ headerShown: true, title: "My Claims" }} />
      <Stack.Screen name="HungerMap"         component={HungerMapScreen}
        options={{ headerShown: true, title: "Hunger Hotspot Map" }} />
      <Stack.Screen name="NGOProfile" component={NGOProfileScreen}
        options={{ headerShown: false }} />

      <Stack.Screen name="AssignDonationVolunteer" component={AssignDonationVolunteerScreen}
        options={{ headerShown: true, title: "Assign Donation Volunteer" }} />
 
      {/* Donor */}
      <Stack.Screen name="DonorDashboard"    component={DonorDashboard} />
      <Stack.Screen name="AddDonation"       component={AddDonationScreen}
        options={{ headerShown: true, title: "Post a Donation" }} />

        <Stack.Screen name="DonorHome"      component={DonorHomeScreen} />   
<Stack.Screen name="ScanScreen"     component={ScanScreen}          
  options={{ headerShown: true, title: "Scan & Donate" }} />

 
      {/* Volunteer (placeholder)
      <Stack.Screen name="VolunteerDashboard">
        {(props) => <ComingSoon {...props} title="🙋 Volunteer Dashboard" />}
      </Stack.Screen> */}

      {/* Volunteer module */}
      <Stack.Screen name="VolunteerDashboard" component={VolunteerDashboardScreen} />
      <Stack.Screen name="VolunteerProfile" component={VolunteerProfileScreen} />

      <Stack.Screen name="DonorProfile" component={DonorProfileScreen}
  options={{ headerShown: false }} />

      {/* ── NEW: Donation Map / Route screen ── */}
      <Stack.Screen name="DonationMap"        component={DonationMapScreen}
        options={{ headerShown: true, title: "Get Route" }} />

      <Stack.Screen
  name="DonationDetails"
  component={DonationDetailsScreen}
  options={{ title: "Donation Details" }}
/>
    </Stack.Navigator>
  );
}