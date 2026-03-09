import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DonorRegisterScreen from "../screens/DonorRegisterScreen";
import NgoRegisterScreen from "../screens/NgoRegisterScreen";
import VolunteerRegisterScreen from "../screens/VolunteerRegisterScreen";

// NGO Screens
import NGODashboardScreen from "../screens/ngo/NGODashboardScreen";
import AvailableDonationsScreen from "../screens/ngo/AvailableDonationsScreen";
import ManageEventsScreen from "../screens/ngo/ManageEventsScreen";
import AssignVolunteersScreen from "../screens/ngo/AssignVolunteersScreen";
import MyClaimsScreen from "../screens/ngo/MyClaimsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* ── Auth Screens ── */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="DonorRegister" component={DonorRegisterScreen} />
      <Stack.Screen name="NgoRegister" component={NgoRegisterScreen} />
      <Stack.Screen name="VolunteerRegister" component={VolunteerRegisterScreen} />

      {/* ── NGO Screens ── */}
      <Stack.Screen
        name="NGODashboard"
        component={NGODashboardScreen}
        options={{ headerShown: true, title: "NGO Dashboard" }}
      />
      <Stack.Screen
        name="AvailableDonations"
        component={AvailableDonationsScreen}
        options={{ headerShown: true, title: "Available Donations" }}
      />
      <Stack.Screen
        name="ManageEvents"
        component={ManageEventsScreen}
        options={{ headerShown: true, title: "Manage Events" }}
      />
      <Stack.Screen
        name="AssignVolunteers"
        component={AssignVolunteersScreen}
        options={{ headerShown: true, title: "Assign Volunteers" }}
      />
      <Stack.Screen
        name="MyClaims"
        component={MyClaimsScreen}
        options={{ headerShown: true, title: "My Claims" }}
      />

    </Stack.Navigator>
  );
}