// src/lib/api-service.js
import { GOOGLE_SCRIPT_URL } from './api';

export const apiService = {
  // Login လုပ်ဆောင်ချက်
  async login(userType, username, password) {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", userType, username, password }),
    });
    return await response.json();
  },

  // ဒေတာသိမ်းဆည်းခြင်း (Points, Leaves, etc.)
  async recordData(targetSheet, payload) {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "recordData", targetSheet, payload }),
    });
    return await response.json();
  }
};