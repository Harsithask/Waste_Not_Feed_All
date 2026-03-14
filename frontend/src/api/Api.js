/**
 * api.js
 * Uses Supabase Auth directly — no FastAPI needed for login/register.
 */
import { supabase } from "./supabaseClient";
 
 
// ── REGISTER DONOR ────────────────────────────────────────────────────────────
export const registerDonor = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authError) throw new Error(authError.message);
 
  await new Promise((r) => setTimeout(r, 800));
 
  const { error } = await supabase.from("donors").insert([{
    id:      authData.user.id,
    name:    data.name,
    email:   data.email,
    phone:   data.phone,
    address: data.address || "",
  }]);
  if (error) throw new Error(error.message);
 
  return { message: "Donor registered successfully!" };
};
 
 
// ── REGISTER NGO ──────────────────────────────────────────────────────────────
export const registerNGO = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authError) throw new Error(authError.message);
 
  await new Promise((r) => setTimeout(r, 800));
 
  const { error } = await supabase.from("ngos").insert([{
    id:                  authData.user.id,
    name:                data.name,
    email:               data.email,
    phone:               data.phone,
    organization_name:   data.organization_name,
    registration_number: data.registration_number,
    government_id:       data.registration_number,
    document_url:        data.document_url || "",
    address:             data.address || "Not provided",
    city:                data.city,
    state:               data.state,
    verification_status: "approved",
  }]);
  if (error) throw new Error(error.message);
 
  return { message: "NGO registered successfully!" };
};
 
 
// ── REGISTER VOLUNTEER ────────────────────────────────────────────────────────
export const registerVolunteer = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authError) throw new Error(authError.message);
 
  await new Promise((r) => setTimeout(r, 800));
 
  const { error } = await supabase.from("volunteers").insert([{
    id:    authData.user.id,
    name:  data.name,
    email: data.email,
    phone: data.phone,
    city:  data.city,
  }]);
  if (error) throw new Error(error.message);
 
  return { message: "Volunteer registered successfully!" };
};
 
 
// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginUser = async (data) => {
  // 1. Sign in via Supabase Auth
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email:    data.email,
    password: data.password,
  });
 
  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      throw new Error("Incorrect email or password. Please try again.");
    }
    throw new Error(error.message);
  }
 
  const userId = authData.user.id;
 
  // 2. Check which table this user belongs to — determines role
  const { data: ngoData } = await supabase
    .from("ngos").select("*").eq("id", userId).maybeSingle();
 
  if (ngoData) {
    const status = ngoData.verification_status || "pending";
    if (status === "pending") {
      await supabase.auth.signOut();
      throw new Error("Your NGO account is pending admin approval.");
    }
    if (status === "rejected") {
      await supabase.auth.signOut();
      throw new Error("Your NGO registration was rejected. Contact support.");
    }
    return { role: "ngo", user: ngoData };
  }
 
  const { data: donorData } = await supabase
    .from("donors").select("*").eq("id", userId).maybeSingle();
  if (donorData) return { role: "donor", user: donorData };
 
  const { data: volunteerData } = await supabase
    .from("volunteers").select("*").eq("id", userId).maybeSingle();
  if (volunteerData) return { role: "volunteer", user: volunteerData };
 
  await supabase.auth.signOut();
  throw new Error("Account profile not found. Please register again.");
};