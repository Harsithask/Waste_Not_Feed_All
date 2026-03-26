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

// ────────────────────────────────────────────────
// INPUT COMPONENT
// ────────────────────────────────────────────────
const Input = ({ icon, placeholder, value, onChangeText, secure }) => (
  <View style={styles.inputBox}>
    <MaterialIcons name={icon} size={22} color="#ccc" />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      secureTextEntry={secure}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// ────────────────────────────────────────────────
// MAIN SCREEN
// ────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("savor");

  const handleLogin = async () => {
    try {
      const result = await loginUser({ email, password });
      console.log("LOGIN RESPONSE:", result);
      alert(result.message);

      const backendRole = result?.role;
      const user        = result?.user;

      // ── Validation ───────────────────────────
      if (role === "ngo" && backendRole !== "ngo") {
        alert("Selected NGO but credentials are not NGO.");
        return;
      }
      if (role === "volunteer" && backendRole !== "volunteer") {
        alert("Selected Volunteer but credentials are not Volunteer.");
        return;
      }
      if (role === "savor" && !(backendRole === "donor" || backendRole === "volunteer")) {
        alert("Savor requires donor or volunteer account.");
        return;
      }

      // ── Navigation ───────────────────────────
      if (backendRole === "ngo") {
        navigation.replace("NGODashboard", { ngoId: user?.id, ngoName: user?.name });
        return;
      }
      if (backendRole === "volunteer") {
        navigation.replace("VolunteerDashboard", { volunteerId: user?.id, email: user?.email || email });
        return;
      }
      if (backendRole === "donor") {
        navigation.replace("DonorHome", { donorId: user?.id || "" });
        return;
      }
      if (role === "savor") {
        navigation.replace("SavorDashboard", { userId: user?.id, email: user?.email || email, name: user?.name });
        return;
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
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#ccc" />
        </TouchableOpacity>

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

          {/* Role Selector */}
          <View style={styles.roleRow}>
            {[
              { value: "ngo",       label: "NGO"       },
              { value: "volunteer", label: "Volunteer" },
              { value: "savor",     label: "Savor"     },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.roleBtn,
                  role === item.value && styles.roleBtnActive,
                ]}
                onPress={() => setRole(item.value)}
              >
                <Text style={[
                  styles.roleText,
                  role === item.value && styles.roleTextActive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>
              Don't have an account?{" "}
              <Text style={styles.signup}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────
const styles = StyleSheet.create({

  background: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },

  formCard: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "rgba(90, 88, 88, 0.45)",   // dark, lets bg show subtly
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0)",  // subtle border
    padding: 35,
    borderRadius: 18,
  },

  logo: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#62dc95",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: "#ccc",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  input: {
    flex: 1,
    padding: 14,
    color: "#fff",
  },

  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 4,
  },

  roleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2ECC71",
    marginHorizontal: 4,
    backgroundColor: "transparent",
  },

  roleBtnActive: {
    backgroundColor: "#2ECC71",
  },

  roleText: {
    color: "#2ECC71",
    fontWeight: "bold",
    textAlign: "center",
  },

  roleTextActive: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#2ECC71",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#ccc",
  },

  signup: {
    color: "#2ECC71",
    fontWeight: "bold",
  },

});
