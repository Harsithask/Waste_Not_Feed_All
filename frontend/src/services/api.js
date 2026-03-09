<<<<<<< HEAD
const BASE_URL = "http://localhost:8000";


export const registerDonor = async (data) => {

  const response = await fetch(`${BASE_URL}/donor/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};


export const registerVolunteer = async (data) => {

  const response = await fetch(`${BASE_URL}/volunteer/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};


export const registerNGO = async (data) => {

  const response = await fetch(`${BASE_URL}/ngo/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};


export const loginUser = async (data) => {

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};
=======
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
>>>>>>> 42d598a (Updated donation backend and frontend)
