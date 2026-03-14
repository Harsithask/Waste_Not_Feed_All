import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { registerNGO } from "../services/api";
 
const Input = ({ icon, placeholder, field, form, setForm, secure }) => (
  <View style={styles.inputBox}>
    <MaterialIcons name={icon} size={22} color="#2ECC71" />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secure}
      style={styles.input}
      value={form[field] || ""}
      onChangeText={(text) => setForm((prev) => ({ ...prev, [field]: text }))}
    />
  </View>
);
 
export default function NgoRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    organization: "", reg_no: "", doc: "",
    city: "", state: "", password: "",
  });
  const [loading, setLoading] = useState(false);
 
  const validateForm = () => {
    if (!form.name)                  { Alert.alert("Error", "Name is required");                    return false; }
    if (!form.email.includes("@"))   { Alert.alert("Error", "Enter a valid email");                 return false; }
    if (form.phone.length < 10)      { Alert.alert("Error", "Enter a valid phone number");          return false; }
    if (!form.organization)          { Alert.alert("Error", "Organization name is required");       return false; }
    if (!form.reg_no)                { Alert.alert("Error", "Registration number is required");     return false; }
    if (!form.city)                  { Alert.alert("Error", "City is required");                    return false; }
    if (form.password.length < 6)    { Alert.alert("Error", "Password must be at least 6 chars");  return false; }
    return true;
  };
 
  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
 
    try {
      // POST /auth/register/ngo → { message, userId }
      const result = await registerNGO({
        name:                form.name,
        email:               form.email,
        phone:               form.phone,
        organization_name:   form.organization,
        registration_number: form.reg_no,
        document_url:        form.doc,
        city:                form.city,
        state:               form.state,
        password:            form.password,
      });
 
      Alert.alert("Success", "✅ NGO Registered Successfully!");
      navigation.replace("NGODashboard", { ngoId: result.userId });
 
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#777" />
        </TouchableOpacity>
 
        <Text style={styles.title}>NGO Registration</Text>
        <Text style={styles.subtitle}>
          Register your organization to start claiming food donations and managing events.
        </Text>
 
        <View style={styles.row}>
          <Input icon="person"   placeholder="Full Name"     field="name"  form={form} setForm={setForm} />
        </View>
        <View style={styles.row}>
          <Input icon="email"    placeholder="Email Address" field="email" form={form} setForm={setForm} />
          <Input icon="phone"    placeholder="Phone Number"  field="phone" form={form} setForm={setForm} />
        </View>
        <View style={styles.row}>
          <Input icon="business" placeholder="Organization Name" field="organization" form={form} setForm={setForm} />
          <Input icon="badge"    placeholder="Reg. Number"       field="reg_no"       form={form} setForm={setForm} />
        </View>
        <View style={styles.row}>
          <Input icon="location-city" placeholder="City"  field="city"  form={form} setForm={setForm} />
          <Input icon="map"           placeholder="State" field="state" form={form} setForm={setForm} />
        </View>
        <View style={styles.row}>
          <Input icon="description" placeholder="Document URL (Optional)" field="doc" form={form} setForm={setForm} />
        </View>
        <View style={styles.row}>
          <Input icon="lock" placeholder="Password" secure field="password" form={form} setForm={setForm} />
        </View>
 
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create NGO Account</Text>
          }
        </TouchableOpacity>
 
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.linkText}>Login</Text>
          </Text>
        </TouchableOpacity>
 
      </View>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F6F8", paddingVertical: 40 },
  card:      { width: "92%", maxWidth: 600, backgroundColor: "white", padding: 30, borderRadius: 20, elevation: 5 },
  backBtn:   { marginBottom: 10, alignSelf: "flex-start" },
  title:     { fontSize: 26, fontWeight: "800", color: "#1A1C1E", marginBottom: 5 },
  subtitle:  { color: "#666", fontSize: 14, lineHeight: 20, marginBottom: 25 },
  row:       { flexDirection: "row", gap: 12, marginBottom: 15 },
  inputBox:  { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#FAFAFA" },
  input:     { flex: 1, padding: 12, fontSize: 15, color: "#333" },
  button:    { backgroundColor: "#2ECC71", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 15 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  footerLink: { marginTop: 20, alignItems: "center" },
  footerText: { color: "#777", fontSize: 14 },
  linkText:   { color: "#2ECC71", fontWeight: "bold" },
});