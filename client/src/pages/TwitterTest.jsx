import React, { useState } from 'react';

const TwitterTest = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tweetText, setTweetText] = useState('Testing my Twitter API integration! 🚀');

  const addLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ time: timestamp, message, data }, ...prev]);
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  const handleConnect = () => {
    addLog('Initiating Twitter OAuth...');
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      addLog('Error: No authentication token found.');
      return;
    }
    // Redirect to backend OAuth route
    const redirectUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/oauth/twitter?token=${token}`;
    addLog(`Redirecting to: ${redirectUrl}`);
    window.location.assign(redirectUrl);
  };

  const handlePostTweet = async () => {
    setLoading(true);
    addLog('Attempting to post tweet...', { text: tweetText });
    
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/test/twitter/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: tweetText })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Unknown error occurred');
      }

      addLog('Tweet posted successfully!', data);
    } catch (err) {
      addLog('Failed to post tweet', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        Twitter Debug & Test Page
      </h1>
      
      <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
        <button 
          onClick={handleConnect}
          style={{ padding: '10px 20px', backgroundColor: '#1DA1F2', color: 'var(--bg-card)', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          1. Connect Twitter
        </button>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>2. Post a Test Tweet</h3>
        <textarea 
          value={tweetText}
          onChange={(e) => setTweetText(e.target.value)}
          style={{ width: '100%', padding: '10px', height: '80px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handlePostTweet}
          disabled={loading || !tweetText.trim()}
          style={{ padding: '10px 20px', backgroundColor: loading ? '#ccc' : '#1DA1F2', color: 'var(--bg-card)', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Posting...' : 'Post Test Tweet'}
        </button>
      </div>

      <div>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Console Logs</h3>
        <div style={{ backgroundColor: '#1e1e1e', color: '#00ff00', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', height: '400px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <span style={{ color: '#888' }}>No logs yet. Click buttons above to start testing.</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                <span style={{ color: '#aaa' }}>[{log.time}]</span> <b>{log.message}</b>
                {log.data && (
                  <pre style={{ margin: '5px 0 0', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TwitterTest;
