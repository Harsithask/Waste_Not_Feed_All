import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { loginUser } from "../services/api";
 
const Input = ({ icon, placeholder, value, onChangeText, secure }) => (
  <View style={styles.inputBox}>
    <MaterialIcons name={icon} size={22} color="#777" />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secure}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
    />
  </View>
);
 
export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
 
  const validateForm = () => {
    if (!email)               { alert("Email is required");                       return false; }
    if (!email.includes("@")) { alert("Enter a valid email");                     return false; }
    if (!password)            { alert("Password is required");                    return false; }
    if (password.length < 6)  { alert("Password must be at least 6 characters"); return false; }
    return true;
  };
 
  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
 
    try {
      // POST /auth/login → { role, user: { id, ... } }
      const result = await loginUser({ email, password });
 
      if (result.role === "ngo") {
        navigation.replace("NGODashboard", { ngoId: result.user.id });
 
      } else if (result.role === "donor") {
        navigation.replace("DonorDashboard", { donorId: result.user.id });
 
      } else if (result.role === "volunteer") {
        navigation.replace("VolunteerDashboard", { volunteerId: result.user.id });
 
      } else {
        alert("Login successful but role not found.");
      }
 
    } catch (error) {
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formCard}>
 
        <Text style={styles.logo}>FoodRescue</Text>
        <Text style={styles.subtitle}>Save food. Serve people.</Text>
 
        <Input icon="email" placeholder="Email"
          value={email} onChangeText={setEmail} />
 
        <Input icon="lock" placeholder="Password"
          secure value={password} onChangeText={setPassword} />
 
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Login</Text>
          }
        </TouchableOpacity>
 
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>
            Don't have an account?{" "}
            <Text style={styles.signup}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
 
      </View>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#F5F6F8",
    justifyContent: "center", alignItems: "center",
  },
  formCard: {
    width: "90%", maxWidth: 450,
    backgroundColor: "white", padding: 40,
    borderRadius: 16, elevation: 4,
  },
  logo:     { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#2E7D32" },
  subtitle: { textAlign: "center", marginBottom: 30, color: "#666" },
  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 20,
  },
  input:      { flex: 1, padding: 14 },
  button:     { backgroundColor: "#2ECC71", padding: 16, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  link:       { textAlign: "center", marginTop: 20 },
  signup:     { color: "#2ECC71", fontWeight: "bold" },
});