import React,{useState} from "react";
import {View,Text,TextInput,TouchableOpacity,StyleSheet,ScrollView} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import { registerVolunteer } from "../services/api";


/* Input component OUTSIDE */
const Input = ({icon,placeholder,field,form,setForm,secure}) => (

<View style={styles.inputBox}>
  <MaterialIcons name={icon} size={22} color="#777"/>

  <TextInput
    placeholder={placeholder}
    secureTextEntry={secure}
    style={styles.input}
    value={form[field] || ""}
    onChangeText={(text)=>
      setForm((prev)=>({
        ...prev,
        [field]:text
      }))
    }
  />
</View>

);


export default function VolunteerRegisterScreen(){

const [form,setForm]=useState({
name:"",
email:"",
phone:"",
city:"",
password:""
});

const validateForm = () => {

if(!form.name){
alert("Name is required");
return false;
}

if(!form.email.includes("@")){
alert("Enter valid email");
return false;
}

if(form.phone.length !== 10){
alert("Phone must be 10 digits");
return false;
}

if(!form.city){
alert("City is required");
return false;
}

if(form.password.length < 6){
alert("Password must be at least 6 characters");
return false;
}

return true;

};

const handleRegister = async () => {

if(!validateForm()) return;

try{

const result = await registerVolunteer(form);

alert(result.message || "Volunteer registered successfully");

}
catch(error){

console.log(error);
alert("Registration failed");

}

};

return(

<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

<View style={styles.card}>

<Text style={styles.title}>Volunteer Registration</Text>
<Text style={styles.subtitle}>
Join us to help deliver food to those in need
</Text>

<View style={styles.row}>
<Input
icon="person"
placeholder="Full Name"
field="name"
form={form}
setForm={setForm}
/>

<Input
icon="email"
placeholder="Email"
field="email"
form={form}
setForm={setForm}
/>
</View>

<View style={styles.row}>
<Input
icon="phone"
placeholder="Phone Number"
field="phone"
form={form}
setForm={setForm}
/>

<Input
icon="location-city"
placeholder="City"
field="city"
form={form}
setForm={setForm}
/>
</View>

<View style={styles.row}>
<Input
icon="lock"
placeholder="Password"
secure
field="password"
form={form}
setForm={setForm}
/>
</View>

<TouchableOpacity style={styles.button} onPress={handleRegister}>
<Text style={styles.buttonText}>Join as Volunteer</Text>
</TouchableOpacity>

</View>

</ScrollView>

);

}

const styles = StyleSheet.create({

container:{
flexGrow:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"#F5F6F8",
padding:30
},

card:{
width:"90%",
maxWidth:900,
backgroundColor:"white",
padding:40,
borderRadius:16,
elevation:4
},

title:{
fontSize:28,
fontWeight:"bold",
marginBottom:5
},

subtitle:{
color:"#777",
marginBottom:30
},

row:{
flexDirection:"row",
gap:20,
marginBottom:20
},

inputBox:{
flex:1,
flexDirection:"row",
alignItems:"center",
borderWidth:1,
borderColor:"#ddd",
borderRadius:8,
paddingHorizontal:12
},

input:{
flex:1,
padding:14
},

button:{
backgroundColor:"#2ECC71",
padding:18,
borderRadius:8,
alignItems:"center",
marginTop:10
},

buttonText:{
color:"white",
fontWeight:"bold",
fontSize:16
}

});