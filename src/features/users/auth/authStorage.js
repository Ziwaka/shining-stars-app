"use client";

export const AUTH_STORAGE_KEY = "user";
export const AUTH_ROLE_COOKIE = "ssmt_role";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export function readStoredUser() {
  if (typeof window === "undefined") return null;

  const raw =
    window.localStorage.getItem(AUTH_STORAGE_KEY) ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw || raw === "undefined") return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearStoredUser();
    return null;
  }
}

export function saveStoredUser(user, { remember = true } = {}) {
  if (typeof window === "undefined") return;

  const normalized = normalizeUser(user);
  const serialized = JSON.stringify(normalized);
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  storage.setItem(AUTH_STORAGE_KEY, serialized);
  otherStorage.removeItem(AUTH_STORAGE_KEY);
  setRoleCookie(normalized.userRole);
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function normalizeUser(user = {}) {
  return {
    ...user,
    userRole: String(user.userRole || user.role || "").toLowerCase(),
  };
}

export function getDefaultPathForRole(role) {
  switch (String(role || "").toLowerCase()) {
    case "management":
      return "/management/mgt-dashboard";
    case "staff":
      return "/staff";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

function setRoleCookie(role) {
  const safeRole = encodeURIComponent(String(role || "").toLowerCase());
  document.cookie = `${AUTH_ROLE_COOKIE}=${safeRole}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
