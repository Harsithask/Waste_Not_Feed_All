import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

const Input = ({ icon, placeholder, field, form, setForm, secure }) => (
  <View style={styles.inputBox}>
    <MaterialIcons name={icon} size={22} color="#777" />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secure}
      style={styles.input}
      value={form[field] || ""}
      onChangeText={(text) => setForm((prev) => ({ ...prev, [field]: text }))}
    />
  </View>
);

export default function DonorRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const validateForm = () => {
    if (!form.name) { window.alert("Name is required"); return false; }
    if (!form.email.includes("@")) { window.alert("Enter valid email"); return false; }
    if (form.phone.length !== 10) { window.alert("Phone must be 10 digits"); return false; }
    if (form.password.length < 6) { window.alert("Password must be at least 6 characters"); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // Step 1 - Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw new Error(authError.message);

      // Step 2 - Insert into donors table
      const { error: insertError } = await supabase
        .from("donors")
        .insert([{
          id: authData.user.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }]);

      if (insertError) throw new Error(insertError.message);

      window.alert("✅ Donor registered successfully!");
      navigation.replace("Login");

    } catch (error) {
      console.log(error);
      window.alert("Registration failed: " + error.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Donor Registration</Text>

        <View style={styles.row}>
          <Input icon="person" placeholder="Full Name" field="name" form={form} setForm={setForm} />
          <Input icon="email" placeholder="Email" field="email" form={form} setForm={setForm} />
        </View>

        <View style={styles.row}>
          <Input icon="phone" placeholder="Phone Number" field="phone" form={form} setForm={setForm} />
          <Input icon="lock" placeholder="Password" field="password" secure form={form} setForm={setForm} />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6F8",
    padding: 30,
  },
  card: {
    width: "90%",
    maxWidth: 800,
    backgroundColor: "white",
    padding: 40,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 14,
  },
  button: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLink: {
    textAlign: "center",
    marginTop: 20,
    color: "#2ECC71",
    fontWeight: "600",
    fontSize: 14,
  },
});