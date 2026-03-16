import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {

  const ActionButton = ({ icon, title, screen, type }) => (
    <TouchableOpacity
      style={[
        styles.button,
        type === "primary" && styles.primaryBtn,
        type === "secondary" && styles.secondaryBtn,
        type === "outline" && styles.outlineBtn
      ]}
      onPress={() => navigation.navigate(screen)}
    >
      <MaterialIcons name={icon} size={22} color={type === "outline" ? "#fff" : "#000"} />
      <Text
        style={[
          styles.btnText,
          type === "primary" && { color: "#fff" },
          type === "outline" && { color: "#fff" }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1604200657090-ae45994b2451"
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>

        <View style={styles.content}>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Join the movement against food waste
            </Text>
          </View>

          <Text style={styles.title}>
            Rescue Food.
          </Text>

          <Text style={styles.titleGreen}>
            Nourish Communities.
          </Text>

          <Text style={styles.description}>
            Connect surplus food from donors to NGOs and volunteers,
            ensuring it reaches those who need it most before it goes to waste.
          </Text>

          <View style={styles.buttonContainer}>

            <ActionButton
              icon="restaurant"
              title="Donate Food"
              screen="DonorRegister"
              type="primary"
            />

            <ActionButton
              icon="business"
              title="Join as NGO"
              screen="NgoRegister"
              type="secondary"
            />

            <ActionButton
              icon="volunteer-activism"
              title="Volunteer"
              screen="VolunteerRegister"
              type="outline"
            />

          </View>

        </View>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({

  background: {
    flex: 1
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  content: {
    alignItems: "center"
  },

  badge: {
    backgroundColor: "rgba(46, 204, 113,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20
  },

  badgeText: {
    color: "#C8F7DC",
    fontSize: 13,
    fontWeight: "600"
  },

  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center"
  },

  titleGreen: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#2ECC71",
    textAlign: "center",
    marginBottom: 20
  },

  description: {
    textAlign: "center",
    color: "#ddd",
    fontSize: 16,
    marginBottom: 35,
    paddingHorizontal: 10
  },

  buttonContainer: {
    width: "100%",
    alignItems: "center"
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 15
  },

  primaryBtn: {
    backgroundColor: "#2ECC71"
  },

  secondaryBtn: {
    backgroundColor: "#fff"
  },

  outlineBtn: {
    borderWidth: 2,
    borderColor: "#fff"
  },

  btnText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10
  }

});