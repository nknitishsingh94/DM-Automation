// Deployment Timestamp: 2026-04-10T19:32:00Z
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'https://dm-automation-w9a4.vercel.app'
    : 'https://dm-automation-w9a4.vercel.app');
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '885857827712-0lge2dbqoutuugmfbh560r35ebk4oq70.apps.googleusercontent.com';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vsrtgwvudallfqnozifu.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnRnd3Z1ZGFsbGZxbm96aWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTgyNDYsImV4cCI6MjA5MTM3NDI0Nn0.-ZkHvaYlwVr7DP6sYEKYaLnKA1yTZucU3XU18WFVKKo';


