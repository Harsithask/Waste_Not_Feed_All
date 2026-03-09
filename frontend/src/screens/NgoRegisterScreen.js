import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { registerNGO } from "../services/api";

const Input = ({ icon, placeholder, field, form, setForm, secure }) => (
  <View style={styles.inputBox}>
    <MaterialIcons name={icon} size={22} color="#777" />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secure}
      style={styles.input}
      value={form[field] || ""}
      onChangeText={(text) =>
        setForm((prev) => ({ ...prev, [field]: text }))
      }
    />
  </View>
);

export default function NgoRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    reg_no: "",
    doc: "",
    city: "",
    state: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!form.name) { alert("Name is required"); return false; }
    if (!form.email.includes("@")) { alert("Enter valid email"); return false; }
    if (form.phone.length !== 10) { alert("Phone must be 10 digits"); return false; }
    if (!form.organization) { alert("Organization name is required"); return false; }
    if (!form.reg_no) { alert("Registration number is required"); return false; }
    if (!form.city) { alert("City is required"); return false; }
    if (!form.state) { alert("State is required"); return false; }
    if (form.password.length < 6) { alert("Password must be at least 6 characters"); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const result = await registerNGO({
        name: form.name,
        email: form.email,
        phone: form.phone,
        organization_name: form.organization,
        registration_number: form.reg_no,
        document_url: form.doc,
        city: form.city,
        state: form.state,
        password: form.password,
      });

      alert("✅ NGO Registered Successfully!");

      // ── Navigate to NGO Dashboard after successful registration ──
      navigation.navigate("NGODashboard", { ngoId: result.userId });

    } catch (error) {
      console.log("Registration error:", error.message);
      alert("Registration failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>NGO Registration</Text>
        <Text style={styles.subtitle}>
          Register your organization to receive food donations
        </Text>

        <View style={styles.row}>
          <Input icon="person" placeholder="Full Name" field="name" form={form} setForm={setForm} />
          <Input icon="email" placeholder="Email" field="email" form={form} setForm={setForm} />
        </View>

        <View style={styles.row}>
          <Input icon="phone" placeholder="Phone Number" field="phone" form={form} setForm={setForm} />
          <Input icon="business" placeholder="Organization Name" field="organization" form={form} setForm={setForm} />
        </View>

        <View style={styles.row}>
          <Input icon="badge" placeholder="Registration Number" field="reg_no" form={form} setForm={setForm} />
          <Input icon="description" placeholder="Verification Document URL" field="doc" form={form} setForm={setForm} />
        </View>

        <View style={styles.row}>
          <Input icon="location-city" placeholder="City" field="city" form={form} setForm={setForm} />
          <Input icon="map" placeholder="State" field="state" form={form} setForm={setForm} />
        </View>

        <View style={styles.row}>
          <Input icon="lock" placeholder="Password" secure field="password" form={form} setForm={setForm} />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Register NGO</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, justifyContent: "center",
    alignItems: "center", backgroundColor: "#F5F6F8", padding: 30,
  },
  card: {
    width: "90%", maxWidth: 900, backgroundColor: "white",
    padding: 40, borderRadius: 16, elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  subtitle: { color: "#777", marginBottom: 30 },
  row: { flexDirection: "row", gap: 20, marginBottom: 20 },
  inputBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12,
  },
  input: { flex: 1, padding: 14 },
  button: {
    backgroundColor: "#2ECC71", padding: 18,
    borderRadius: 8, alignItems: "center", marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});