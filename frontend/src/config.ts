const isLocalDev = window.location.port === "5173" || window.location.port === "3000";

// When deployed, the backend serves the frontend from the same origin.
// Thus, API requests can be relative, i.e., /api/...
// In local development, the frontend is on Vite (port 5173/3000) and the backend is on port 8000.
export const API_BASE_URL = isLocalDev
  ? "http://127.0.0.1:8000"
  : "";

export const WS_BASE_URL = isLocalDev
  ? "ws://127.0.0.1:8000"
  : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
