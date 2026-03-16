import { supabase } from "./supabaseClient";

const BASE_URL = "http://localhost:8000";

// ─────────────────────────────────────────────
// GET AUTH TOKEN FROM SUPABASE SESSION
// ─────────────────────────────────────────────
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || "";

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─────────────────────────────────────────────
// CORE REQUEST FUNCTION
// ─────────────────────────────────────────────
const request = async (method, path, body = null) => {
  const headers = await getAuthHeaders();

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.detail || json.message || "Request failed");
  }

  return json;
};

// ─────────────────────────────────────────────
// GENERIC API METHODS
// ─────────────────────────────────────────────
export const API = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

// ═════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════

export const registerDonor = async (data) => {
  return await API.post("/auth/register/donor", data);
};

export const registerVolunteer = async (data) => {
  return await API.post("/auth/register/volunteer", data);
};

export const registerNGO = async (data) => {
  return await API.post("/auth/register/ngo", data);
};

export const loginUser = async (data) => {
  return await API.post("/auth/login", data);
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

// ═════════════════════════════════════════════
// DONATIONS
// ═════════════════════════════════════════════

export const getAvailableDonations = () =>
  API.get("/donations/available");

export const getAllDonations = () =>
  API.get("/donations");

export const addDonation = (data) =>
  API.post("/donations", data);

export const deleteDonation = (id) =>
  API.delete(`/donations/${id}`);

export const claimDonation = (donationId, ngoId) =>
  API.put(`/donations/${donationId}/claim`, { ngo_id: ngoId });

export const getMyClaims = (ngoId) =>
  API.get(`/donations/claims/${ngoId}`);

// ═════════════════════════════════════════════
// NGO EVENTS
// ═════════════════════════════════════════════

export const getNGOEvents = (ngoId) =>
  API.get(`/ngo/events/${ngoId}`);

export const createNGOEvent = (data) =>
  API.post("/ngo/events", data);

export const completeNGOEvent = (eventId) =>
  API.put(`/ngo/events/${eventId}/complete`, {});

export const deleteNGOEvent = (eventId) =>
  API.delete(`/ngo/events/${eventId}`);

// ═════════════════════════════════════════════
// VOLUNTEERS
// ═════════════════════════════════════════════

export const getAllVolunteers = () =>
  API.get("/ngo/volunteers-list");

export const getActiveEvents = () =>
  API.get("/ngo/events/active");

export const assignVolunteer = (data) =>
  API.post("/ngo/assign-volunteer", data);

// Volunteer API functions
export const assignDonation = async (donationId, volunteerId) => {
  const response = await API.post(`/volunteer/donations/${donationId}/assign`, { volunteer_id: volunteerId });
  return response.data;
};

export const getAssignedDonations = async (volunteerId) => {
  const response = await API.get(`/volunteer/donations/assigned/${volunteerId}`);
  return response.data;
};

export const getVolunteerProfile = async (volunteerId) => {
  const response = await API.get(`/volunteer/profile/${volunteerId}`);
  return response.data;
};

export const updateDonationStatus = async (donationId, status, volunteerId) => {
  const response = await API.put(`/volunteer/donations/${donationId}/status`, { status, volunteer_id: volunteerId });
  return response.data;
};

export const getVolunteerStats = async (volunteerId) => {
  const response = await API.get(`/volunteer/stats/${volunteerId}`);
  return response.data;
};