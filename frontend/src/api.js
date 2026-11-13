
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const getStreakStatus = (token) => {
  return API.get("/streak/status", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getWalletBalance = (token) => {
  return API.get("/wallet", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default API;
