import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

const styles = `
  .setup-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f8fafc;
    font-family: 'Inter', system-ui, sans-serif;
    padding-top: 60px;
  }

  .setup-logo {
    font-size: 28px;
    font-weight: 800;
    color: #ef4444; /* Zernio red style */
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }

  .setup-title {
    font-size: 36px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -1px;
    text-align: center;
  }

  .setup-subtitle {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 40px;
    text-align: center;
  }

  .setup-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    padding: 32px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .step-number {
    background: #1e293b;
    color: white;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-weight: 700;
    font-size: 14px;
  }

  .step-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }

  .step-description {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 24px;
  }

  .api-key-box {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .api-key-text {
    font-family: monospace;
    font-size: 14px;
    color: #334155;
    word-break: break-all;
    margin-right: 16px;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #64748b;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .copy-btn:hover {
    color: #1e293b;
  }

  .continue-btn {
    width: 100%;
    background: #ef4444; /* Zernio red style */
    color: white;
    font-weight: 600;
    font-size: 16px;
    padding: 14px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
  }

  .continue-btn:hover {
    background: #dc2626;
  }

  .continue-btn svg {
    margin-left: 4px;
  }
`;

export default function Setup() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const apiKey = location.state?.apiKey;

  if (!apiKey) {
    return <Navigate to="/connections" replace />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    navigate('/connections', { replace: true });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="setup-wrapper">
        <div className="setup-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
          </svg>
          smart10X
        </div>
        
        <h1 className="setup-title">Welcome, let's get you set up</h1>
        <p className="setup-subtitle">Three quick steps and you're ready to go.</p>

        <div className="setup-card">
          <div className="step-header">
            <div className="step-number">1</div>
            <h2 className="step-title">Copy your API key</h2>
          </div>
          
          <p className="step-description">
            This is a one-time display. You can always create more in API Keys.
          </p>

          <div className="api-key-box">
            <span className="api-key-text">{apiKey}</span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? (
                <><Check size={16} color="#10b981" /> Copied</>
              ) : (
                <><Copy size={16} /> Copy</>
              )}
            </button>
          </div>

          <button className="continue-btn" onClick={handleContinue}>
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
