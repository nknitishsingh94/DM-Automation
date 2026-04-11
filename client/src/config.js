// Deployment Timestamp: 2026-04-10T19:32:00Z
export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://dm-automation-lu44.onrender.com';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '172282091381-3djv5rjg2mfdhid2o0i31ujss6hbsemb.apps.googleusercontent.com';
