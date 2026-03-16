import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const BASE_URL = "http://127.0.0.1:8000";

/* ---------------- API ---------------- */

async function apiFetch(path) {
  const res = await fetch(BASE_URL + path);

  if (!res.ok) {
    throw new Error("Server error");
  }

  return res.json();
}

/* ---------------- DISTANCE ---------------- */

function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.lat - b.lat, 2) +
    Math.pow(a.lng - b.lng, 2)
  );
}

/* ---------------- GREEDY ROUTE ---------------- */

function nearestNeighbor(start, donors) {

  let route = [];
  let current = start;
  let remaining = [...donors];

  while (remaining.length > 0) {

    let nearest = remaining.reduce((prev, curr) =>
      distance(current, curr) < distance(current, prev) ? curr : prev
    );

    route.push(nearest);

    current = nearest;

    remaining = remaining.filter(d => d !== nearest);
  }

  return route;
}

/* ---------------- SCREEN ---------------- */

export default function DonorRouteScreen({ navigation }) {

  const [donors, setDonors] = useState([]);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  const volunteer = {
    lat: 11.1271,
    lng: 78.6569
  };

  useEffect(() => {
    loadDonors();
  }, []);

  async function loadDonors() {

    try {

      /* Example API
      backend should return:

      {
        donors:[
          {name:"Hotel A", lat:11.13, lng:78.65, food:"20 meals"},
          {name:"Restaurant B", lat:11.15, lng:78.66}
        ]
      }
      */

      const data = await apiFetch("/donors");

      const donorList = data.donors || [];

      setDonors(donorList);

      const optimizedRoute = nearestNeighbor(volunteer, donorList);

      setRoute(optimizedRoute);

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }

  function openMaps(lat, lng) {

    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    );
  }

  if (loading) {
    return (
      <View style={S.loader}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Optimizing Donor Pickup Route...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={S.container}>

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E7D32"/>
        </TouchableOpacity>

        <Text style={S.title}>Donor Pickup Route</Text>
      </View>

      <Text style={S.subtitle}>
        Optimized Food Collection Route
      </Text>

      {route.map((d, i) => (

        <View key={i} style={S.card}>

          <View style={S.cardTop}>
            <MaterialIcons name="restaurant" size={22} color="#FB8C00"/>
            <Text style={S.name}>{d.name}</Text>
          </View>

          <Text style={S.info}>
            Food Available: {d.food || "Not specified"}
          </Text>

          <Text style={S.info}>
            Location: {d.lat}, {d.lng}
          </Text>

          <TouchableOpacity
            style={S.btn}
            onPress={() => openMaps(d.lat, d.lng)}
          >
            <MaterialIcons name="navigation" size={16} color="#fff"/>
            <Text style={S.btnText}>Navigate</Text>
          </TouchableOpacity>

        </View>

      ))}

    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const S = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F4F6F9",
    padding:16
  },

  header:{
    flexDirection:"row",
    alignItems:"center",
    gap:10
  },

  title:{
    fontSize:20,
    fontWeight:"bold"
  },

  subtitle:{
    marginVertical:10,
    color:"#666"
  },

  card:{
    backgroundColor:"#fff",
    padding:16,
    borderRadius:10,
    marginBottom:12,
    elevation:3
  },

  cardTop:{
    flexDirection:"row",
    alignItems:"center",
    gap:6
  },

  name:{
    fontSize:16,
    fontWeight:"bold"
  },

  info:{
    marginTop:6,
    fontSize:13
  },

  btn:{
    marginTop:10,
    backgroundColor:"#2E7D32",
    padding:10,
    borderRadius:8,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center",
    gap:6
  },

  btnText:{
    color:"#fff",
    fontWeight:"bold"
  },

  loader:{
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  }

});