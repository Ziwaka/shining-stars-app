// src/lib/api-service.js
// FIXED: GOOGLE_SCRIPT_URL → WEB_APP_URL
import { WEB_APP_URL } from './api';

export const apiService = {
  // Login လုပ်ဆောင်ချက်
  async login(userType, username, password) {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "login", userType, username, password }),
    });
    return await response.json();
  },

  // ဒေတာသိမ်းဆည်းခြင်း (Points, Leaves, etc.)
  async recordData(targetSheet, payload) {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "recordData", targetSheet, payload }),
    });
    return await response.json();
  },

  // ဒေတာဖတ်ခြင်း
  async getData(sheetName, targetGid) {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "getData", sheetName, targetGid }),
    });
    return await response.json();
  },

  // Note သိမ်းဆည်းခြင်း
  async recordNote(sheetName, data) {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "recordNote", sheetName, data }),
    });
    return await response.json();
  }
};