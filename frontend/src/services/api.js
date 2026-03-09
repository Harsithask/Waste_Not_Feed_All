import { supabase } from "../services/supabaseClient";

// ── REGISTER DONOR ─────────────────────────────────────────
export const registerDonor = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: null,
    }
  });

  if (authError) throw new Error(authError.message);

  // Wait a moment for auth to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error: insertError } = await supabase
    .from("donors")
    .insert([{
      id:    authData.user.id,
      name:  data.name,
      email: data.email,
      phone: data.phone,
    }]);

  if (insertError) throw new Error(insertError.message);

  return { message: "Donor registered successfully!", userId: authData.user.id };
};


// ── REGISTER VOLUNTEER ─────────────────────────────────────
export const registerVolunteer = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: null,
    }
  });

  if (authError) throw new Error(authError.message);

  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error: insertError } = await supabase
    .from("volunteers")
    .insert([{
      id:    authData.user.id,
      name:  data.name,
      email: data.email,
      phone: data.phone,
      city:  data.city,
    }]);

  if (insertError) throw new Error(insertError.message);

  return { message: "Volunteer registered successfully!", userId: authData.user.id };
};


// ── REGISTER NGO ───────────────────────────────────────────
export const registerNGO = async (data) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: null,
    }
  });

  if (authError) throw new Error(authError.message);

  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error: insertError } = await supabase
    .from("ngos")
    .insert([{
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
      verification_status: "pending",
      password:            data.password,
    }]);

  if (insertError) throw new Error(insertError.message);

  return { message: "NGO registered successfully!", userId: authData.user.id };
};


// ── LOGIN USER ─────────────────────────────────────────────
export const loginUser = async (data) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw new Error(error.message);

  const userId = authData.user.id;

  // Check ngos table
  const { data: ngoData } = await supabase
    .from("ngos")
    .select("*")
    .eq("id", userId)
    .single();

  if (ngoData) return { role: "ngo", user: ngoData };

  // Check donors table
  const { data: donorData } = await supabase
    .from("donors")
    .select("*")
    .eq("id", userId)
    .single();

  if (donorData) return { role: "donor", user: donorData };

  // Check volunteers table
  const { data: volunteerData } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", userId)
    .single();

  if (volunteerData) return { role: "volunteer", user: volunteerData };

  throw new Error("User role not found");
};