// Deployment Timestamp: 2026-04-10T19:32:00Z
export const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : 'https://dm-automation-lu44.onrender.com';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '885857827712-0lge2dbqoutuugmfbh560r35ebk4oq70.apps.googleusercontent.com';
