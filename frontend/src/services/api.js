import { supabase } from "./supabaseClient";
 
const BASE_URL = "http://localhost:8000";
 
// ── CORE REQUEST METHODS ───────────────────────────────────
const request = async (method, path, body = null) => {
  const headers = { "Content-Type": "application/json" };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
 
  const res  = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();
 
  if (!res.ok) {
    throw new Error(json.detail || json.message || "Request failed");
  }
  return json;
};
 
export const API = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  put:    (path, body) => request("PUT",    path, body),
  delete: (path)       => request("DELETE", path),
};
 
 
// ══════════════════════════════════════════════════════════
//  AUTH — all via FastAPI + bcrypt
// ══════════════════════════════════════════════════════════
 
// ── REGISTER DONOR ─────────────────────────────────────────
// POST /auth/register/donor → hashes password in backend
export const registerDonor = async (data) => {
  return await API.post("/auth/register/donor", {
    name:     data.name,
    email:    data.email,
    phone:    data.phone,
    address:  data.address || "Not provided",
    password: data.password,
  });
};
 
// ── REGISTER NGO ───────────────────────────────────────────
// POST /auth/register/ngo → hashes password in backend
export const registerNGO = async (data) => {
  return await API.post("/auth/register/ngo", {
    name:                data.name,
    email:               data.email,
    phone:               data.phone,
    organization_name:   data.organization_name,
    registration_number: data.registration_number,
    document_url:        data.document_url || "",
    address:             data.address || "Not provided",
    city:                data.city,
    state:               data.state || "",
    password:            data.password,
  });
};
 
// ── REGISTER VOLUNTEER ─────────────────────────────────────
// POST /auth/register/volunteer → hashes password in backend
export const registerVolunteer = async (data) => {
  return await API.post("/auth/register/volunteer", {
    name:     data.name,
    email:    data.email,
    phone:    data.phone,
    city:     data.city,
    password: data.password,
  });
};
 
// ── LOGIN ──────────────────────────────────────────────────
// POST /auth/login → auto-detects role (donor/ngo/volunteer)
// Returns { role, user }
export const loginUser = async (data) => {
  return await API.post("/auth/login", {
    email:    data.email,
    password: data.password,
  });
};
 
// ── LOGOUT ─────────────────────────────────────────────────
export const logoutUser = async () => {
  // No server-side session to clear — just local cleanup
  // Supabase session not used in this flow
};
 
 
// ══════════════════════════════════════════════════════════
//  DONATIONS — via FastAPI
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
//  NGO EVENTS — via FastAPI
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
//  VOLUNTEERS — via FastAPI
// ══════════════════════════════════════════════════════════
export const getAllVolunteers = () =>
  API.get("/volunteers");
 
export const getActiveEvents = () =>
  API.get("/ngo/events/active");
 
export const assignVolunteer = (data) =>
  API.post("/ngo/assign-volunteer", data);
 
 
// ══════════════════════════════════════════════════════════
//  RED SPOTS — via FastAPI
// ══════════════════════════════════════════════════════════
export const getRedSpots = () =>
  API.get("/ngo/red-spots");
 
export const addRedSpot = (data) =>
  API.post("/ngo/red-spots", data);