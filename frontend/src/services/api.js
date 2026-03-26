import { Platform } from "react-native";
import { supabase } from "./supabaseClient";

// ─────────────────────────────────────────────
// BASE URL (handles Android emulator)
// ─────────────────────────────────────────────
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000";

// ─────────────────────────────────────────────
// AUTH TOKEN
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
// SAFE ERROR MESSAGE EXTRACTOR (your feature)
// ─────────────────────────────────────────────
export const safeMsg = (err) => {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  if (err?.message && typeof err.message === "string") return err.message;
  return JSON.stringify(err);
};

// ─────────────────────────────────────────────
// CORE REQUEST FUNCTION (merged + improved)
// ─────────────────────────────────────────────
const request = async (method, path, body = null) => {
  const headers = await getAuthHeaders();

  const options = {
    method,
    headers,
  };

  if (body) options.body = JSON.stringify(body);

  let response;
  let json;

  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    throw new Error("Cannot connect to server. Is backend running?");
  }

  try {
    json = await response.json();
  } catch {
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      json?.detail || json?.message || "Request failed"
    );
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
export const registerDonor     = (data) => API.post("/auth/register/donor", data);
export const registerVolunteer = (data) => API.post("/auth/register/volunteer", data);
export const registerNGO       = (data) => API.post("/auth/register/ngo", data);
export const loginUser         = (data) => API.post("/auth/login", data);
export const logoutUser        = async () => { await supabase.auth.signOut(); };

// ═════════════════════════════════════════════
// DONOR PROFILE
// ═════════════════════════════════════════════
export const getDonorProfile = (donorId) => API.get(`/donations/donor/profile/${donorId}`);
export const updateDonorProfile = (donorId, data) => 
  API.put(`/donations/donor/profile/${donorId}`, data);
// ═════════════════════════════════════════════
// NGO PROFILE
// ═════════════════════════════════════════════
export const getNGOProfile    = (ngoId)       => API.get(`/ngo/profile/${ngoId}`);
export const updateNGOProfile = (ngoId, data) => API.put(`/ngo/profile/${ngoId}`, data);

// ═════════════════════════════════════════════
// DONATIONS
// ═════════════════════════════════════════════

// NGO view
export const getAvailableDonations = () =>
  API.get("/donations/available");

export const getAllDonations = () =>
  API.get("/donations");

export const addDonation = (data) =>
  API.post("/donations", data);

export const deleteDonation = (id) =>
  API.delete(`/donations/${id}`);

// NGO claims donation
export const claimDonation = (donationId, ngoId) =>
  API.put(`/donations/${donationId}/claim`, { ngo_id: ngoId });

// NGO assigns volunteer (friend feature)
export const assignDonationToVolunteer = (donationId, volunteerId) =>
  API.put(`/donations/${donationId}/assign-volunteer`, {
    volunteer_id: volunteerId,
  });

// NGO claims list
export const getMyClaims = (ngoId) =>
  API.get(`/donations/claims/${ngoId}`);


// ═════════════════════════════════════════════
// VOLUNTEER MODULE
// ═════════════════════════════════════════════

// Available donations (volunteer self-assign)
export const getVolunteerAvailableDonations = () =>
  API.get("/volunteer/donations/available");

// Assigned donations (all)
export const getAssignedDonations = (volunteerId) =>
  API.get(`/volunteer/donations/assigned/${volunteerId}`);

// NGO assigned donations specifically
export const getNGOAssignedDonations = (volunteerId) =>
  API.get(`/volunteer/donations/ngo-assigned/${volunteerId}`);

// Volunteer self-assign
export const assignDonation = (donationId, volunteerId) =>
  API.post(`/volunteer/donations/${donationId}/assign`, {
    volunteer_id: volunteerId,
  });

// Update status
export const updateDonationStatus = (donationId, status, volunteerId) =>
  API.put(`/volunteer/donations/${donationId}/status`, {
    status,
    volunteer_id: volunteerId,
  });

// Get donation details
export const getDonationDetails = (donationId) =>
  API.get(`/volunteer/donations/${donationId}`);

// Volunteer profile (flexible)
export const getVolunteerProfile = async ({ volunteerId, email }) => {
  if (email) {
    return API.get(`/volunteer/profile/email/${encodeURIComponent(email)}`);
  }
  if (volunteerId) {
    return API.get(`/volunteer/profile/${volunteerId}`);
  }
  throw new Error("Missing volunteerId or email");
};

export const updateVolunteerProfile = (volunteerId, data) =>
  API.put(`/volunteer/profile/${volunteerId}`, data);


// Volunteer stats
export const getVolunteerStats = (volunteerId) =>
  API.get(`/volunteer/stats/${volunteerId}`);


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
// NGO VOLUNTEER MANAGEMENT
// ═════════════════════════════════════════════

// All volunteers
export const getAllVolunteers = () =>
  API.get("/ngo/volunteers-list");

// Active events
export const getActiveEvents = () =>
  API.get("/ngo/events/active");


// Assign volunteer to event
export const assignVolunteer = (data) =>
  API.post("/ngo/assign-volunteer", data);

// ═════════════════════════════════════════════
// NOTIFICATIONS
// ═════════════════════════════════════════════
export const getVolunteerNotifications = (volunteerId) =>
  API.get(`/volunteer/notifications/${volunteerId}`);

// export const markNotificationRead = (notificationId) =>
//   API.put(`/volunteer/notifications/${notificationId}/read`, {});

// ── Notification helpers ──────────────────────────────────────────

export const getDonorNotifications = async (donorId) => {
  const res = await API.get(`/notifications/donor/${donorId}`);
  return res.data ? res.data : res;
};

export const getNgoNotifications = async (ngoId) => {
  const res = await API.get(`/notifications/ngo/${ngoId}`);
  return res.data ? res.data : res;
};

// getVolunteerNotifications already exists — leave it as is

export const markNotificationRead = async (notificationId) => {
  const res = await API.put(`/notifications/${notificationId}/read`);
  return res.data ? res.data : res;
};

export const markAllNotificationsRead = async (payload) => {
  // payload: { donor_id: "..." } or { ngo_id: "..." } or { volunteer_id: "..." }
  const res = await API.put(`/notifications/mark-all-read`, payload);
  return res.data ? res.data : res;
};