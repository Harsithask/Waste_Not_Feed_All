import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
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
    />
  </View>
);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const result = await loginUser({ email, password });

      console.log("LOGIN RESPONSE:", result);
      alert(result.message);

      if (result.role === "donor") {
        navigation.replace("DonorDashboard");

      } else if (result.role === "volunteer") {
        navigation.navigate("VolunteerDashboard", {
          volunteerId: result.user.id,
        });

      } else if (result.role === "ngo") {
        navigation.replace("NGODashboard", {
          ngoId: result.user.id,
          ngoName: result.user.name,
        });
      }

    } catch (error) {
      console.log(error);
      alert(error.message || "Login failed");
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1604200657090-ae45994b2451" }}
      style={styles.background}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.formCard}>

          <Text style={styles.logo}>FoodRescue</Text>
          <Text style={styles.subtitle}>Save food. Serve people.</Text>

          <Input
            icon="email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            icon="lock"
            placeholder="Password"
            secure
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.signup}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formCard: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "white",
    padding: 35,
    borderRadius: 18,
  },
  logo: { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#2ECC71" },
  subtitle: { textAlign: "center", marginBottom: 30, color: "#666" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  input: { flex: 1, padding: 14 },
  button: { backgroundColor: "#2ECC71", padding: 16, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  link: { textAlign: "center", marginTop: 20 },
  signup: { color: "#2ECC71", fontWeight: "bold" },
});
