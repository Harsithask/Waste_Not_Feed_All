import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
 
import LoginScreen            from "../screens/LoginScreen";
import RegisterScreen         from "../screens/RegisterScreen";
import DonorRegisterScreen    from "../screens/DonorRegisterScreen";
import NgoRegisterScreen      from "../screens/NgoRegisterScreen";
import VolunteerRegisterScreen from "../screens/VolunteerRegisterScreen";
import NGODashboardScreen     from "../screens/ngo/NGODashboardScreen";
import AvailableDonationsScreen from "../screens/ngo/AvailableDonationsScreen";
import ManageEventsScreen     from "../screens/ngo/ManageEventsScreen";
import AssignVolunteersScreen from "../screens/ngo/AssignVolunteersScreen";
import MyClaimsScreen         from "../screens/ngo/MyClaimsScreen";
import HungerMapScreen        from "../screens/HungerMapScreen";
import DonorDashboard         from "../screens/DonorDashboard";
import AddDonationScreen      from "../screens/AddDonationScreen";
 
// ── Placeholder for screens still under development ────────
const ComingSoon = ({ title, navigation }) => (
  <View style={ph.wrap}>
    <Text style={ph.emoji}>🚧</Text>
    <Text style={ph.title}>{title}</Text>
    <Text style={ph.sub}>This module is under development</Text>
    <TouchableOpacity style={ph.btn} onPress={() => navigation.replace("Login")}>
      <Text style={ph.btnText}>Logout</Text>
    </TouchableOpacity>
  </View>
);
 
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
 
      {/* Donor */}
      <Stack.Screen name="DonorDashboard"    component={DonorDashboard} />
      <Stack.Screen name="AddDonation"       component={AddDonationScreen}
        options={{ headerShown: true, title: "Post a Donation" }} />
 
      {/* Volunteer (placeholder) */}
      <Stack.Screen name="VolunteerDashboard"
        component={({ navigation }) =>
          <ComingSoon title="🙋 Volunteer Dashboard" navigation={navigation} />
        }
      />
    </Stack.Navigator>
  );
}