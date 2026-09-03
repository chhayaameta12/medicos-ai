import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

/*
==================================================
ADD SEARCH HISTORY
==================================================
*/

export const addSearchHistory = async (medicineName) => {
  try {
    const response = await axios.post(
      `${API_URL}/history`,
      {
        type: "search",
        medicine_name: medicineName,
      },
      {
        withCredentials: true,
      }
    );

    console.log("✅ Search history saved:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Unable to save search history:",
      error.response?.data || error.message
    );

    // Don't break medicine search if history fails
    return null;
  }
};


/*
==================================================
GET HISTORY
==================================================
*/

export const getHistory = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/history`,
      {
        withCredentials: true,
      }
    );

    return response.data.history || [];

  } catch (error) {
    console.error(
      "❌ Unable to fetch history:",
      error.response?.data || error.message
    );

    throw error;
  }
};


/*
==================================================
DELETE ONE HISTORY ITEM
==================================================
*/

export const deleteHistory = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/history/${id}`,
      {
        withCredentials: true,
      }
    );

    console.log("✅ History deleted");

    return response.data;

  } catch (error) {
    console.error(
      "❌ Unable to delete history:",
      error.response?.data || error.message
    );

    throw error;
  }
};


/*
==================================================
CLEAR ALL HISTORY
==================================================
*/

export const clearHistory = async () => {
  try {
    const response = await axios.delete(
      `${API_URL}/history`,
      {
        withCredentials: true,
      }
    );

    console.log("✅ History cleared");

    return response.data;

  } catch (error) {
    console.error(
      "❌ Unable to clear history:",
      error.response?.data || error.message
    );

    throw error;
  }
};