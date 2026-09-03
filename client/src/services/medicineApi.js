import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Search medicines
export const searchMedicines = async (name) => {
  const response = await API.get("/medicines/search", {
    params: {
      name: name.trim(),
    },
  });

  return response.data;
};

// Get medicine details
export const getMedicineDetails = async (rxcui) => {
  const response = await API.get(`/medicines/${rxcui}`);
  return response.data;
};

// Resolve medicine
export const resolveMedicine = async (name) => {
  const response = await API.get("/interactions/resolve", {
    params: {
      name: name.trim(),
    },
  });

  return response.data;
};

// Check interaction using MEDICINE NAMES
export const checkInteraction = async (medicine1, medicine2) => {
  const response = await API.get("/interactions/check", {
    params: {
      medicine1: medicine1.trim(),
      medicine2: medicine2.trim(),
    },
  });

  return response.data;
};