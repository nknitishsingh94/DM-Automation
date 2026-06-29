import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global fetch interceptor to inject active workspace ID header
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const activeWorkspaceId = localStorage.getItem('active_workspace_id');
  if (activeWorkspaceId) {
    const headers = options.headers ? { ...options.headers } : {};
    if (!(headers instanceof Headers)) {
      headers['x-workspace-id'] = activeWorkspaceId;
      options.headers = headers;
    } else {
      headers.set('x-workspace-id', activeWorkspaceId);
      options.headers = headers;
    }
  }
  return originalFetch(url, options);
};

import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

