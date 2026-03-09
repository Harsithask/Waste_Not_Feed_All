<<<<<<< HEAD
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import your existing screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// ADD THESE NEW IMPORTS:
import DonorRegisterScreen from "../screens/DonorRegisterScreen";
import NgoRegisterScreen from "../screens/NgoRegisterScreen"; // Comment out if file doesn't exist yet
import VolunteerRegisterScreen from "../screens/VolunteerRegisterScreen"; // Comment out if file doesn't exist yet

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Ensure these names match what you call in navigation.navigate() */}
      <Stack.Screen name="DonorRegister" component={DonorRegisterScreen} />
      
      <Stack.Screen name="NgoRegister" component={NgoRegisterScreen} />
      <Stack.Screen name="VolunteerRegister" component={VolunteerRegisterScreen} /> 
      
    </Stack.Navigator>
  );
}
=======
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your actual screens
import DonorDashboard from '../screens/DonorDashboard'; // Check spelling: Donar vs Donor
import AddDonationScreen from '../screens/AddDonationScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen 
        name="Dashboard" 
        component={DonorDashboard} 
        options={{ title: 'Donor Dashboard' }}
      />
      <Stack.Screen 
        name="AddDonation" 
        component={AddDonationScreen} 
        options={{ title: 'Add New Donation' }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;
>>>>>>> 42d598a (Updated donation backend and frontend)
