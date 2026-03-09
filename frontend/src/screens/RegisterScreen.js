import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function RegisterScreen({ navigation }) {

const RoleCard = ({icon,title,screen}) => (

<TouchableOpacity
style={styles.card}
onPress={()=>navigation.navigate(screen)}
>

<MaterialIcons name={icon} size={30} color="#2ECC71"/>

<Text style={styles.cardText}>{title}</Text>

<MaterialIcons name="arrow-forward-ios" size={18} color="#999"/>

</TouchableOpacity>

);

return(

<View style={styles.container}>

<View style={styles.box}>

<Text style={styles.title}>Choose Your Role</Text>
<Text style={styles.subtitle}>Select how you want to contribute</Text>

<RoleCard icon="restaurant" title="Donate Food" screen="DonorRegister"/>
<RoleCard icon="business" title="Register NGO" screen="NgoRegister"/>
<RoleCard icon="volunteer-activism" title="Become Volunteer" screen="VolunteerRegister"/>

</View>

</View>

);

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#F5F6F8",
justifyContent:"center",
alignItems:"center"
},

box:{
width:"90%",
maxWidth:600,
backgroundColor:"white",
padding:40,
borderRadius:16,
elevation:4
},

title:{
fontSize:28,
fontWeight:"bold",
marginBottom:6,
textAlign:"center"
},

subtitle:{
textAlign:"center",
color:"#777",
marginBottom:35
},

card:{
flexDirection:"row",
alignItems:"center",
justifyContent:"space-between",
padding:20,
borderWidth:1,
borderColor:"#eee",
borderRadius:10,
marginBottom:20
},

cardText:{
flex:1,
marginLeft:15,
fontSize:18,
fontWeight:"600"
}

});