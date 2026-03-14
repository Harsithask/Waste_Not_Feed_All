import { supabase } from "./supabaseClient";
 
const BASE_URL = "http://localhost:8000";
 
// ── HELPER: get auth token from supabase session ───────────
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
 
// ── CORE REQUEST METHODS ───────────────────────────────────
const request = async (method, path, body = null) => {
  const headers = await getAuthHeaders();
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
 
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();
 
  if (!res.ok) {
    throw new Error(json.detail || json.message || "Request failed");
  }
  return json;
};
 
export const API = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  put:    (path, body)   => request("PUT",    path, body),
  delete: (path)         => request("DELETE", path),
};
 
// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
 
// ── REGISTER DONOR ─────────────────────────────────────────
export const registerDonor = async (data) => {
  return await API.post("/auth/register/donor", data);
};
 
// ── REGISTER VOLUNTEER ─────────────────────────────────────
export const registerVolunteer = async (data) => {
  return await API.post("/auth/register/volunteer", data);
};
 
// ── REGISTER NGO ───────────────────────────────────────────
export const registerNGO = async (data) => {
  return await API.post("/auth/register/ngo", data);
};
 
// ── LOGIN ──────────────────────────────────────────────────
export const loginUser = async (data) => {
  return await API.post("/auth/login", data);
};
 
// ── LOGOUT ─────────────────────────────────────────────────
export const logoutUser = async () => {
  await supabase.auth.signOut();
};
 
// ══════════════════════════════════════════════════════════
//  DONATIONS
// ══════════════════════════════════════════════════════════
 
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
 
// ══════════════════════════════════════════════════════════
//  NGO EVENTS
// ══════════════════════════════════════════════════════════
 
export const getNGOEvents = (ngoId) =>
  API.get(`/ngo/events/${ngoId}`);
 
export const createNGOEvent = (data) =>
  API.post("/ngo/events", data);
 
export const completeNGOEvent = (eventId) =>
  API.put(`/ngo/events/${eventId}/complete`, {});
 
export const deleteNGOEvent = (eventId) =>
  API.delete(`/ngo/events/${eventId}`);
 
// ══════════════════════════════════════════════════════════
//  VOLUNTEERS
// ══════════════════════════════════════════════════════════
 
export const getAllVolunteers = () =>
  API.get("/volunteers");
 
export const getActiveEvents = () =>
  API.get("/ngo/events/active");
 
export const assignVolunteer = (data) =>
  API.post("/ngo/assign-volunteer", data);
