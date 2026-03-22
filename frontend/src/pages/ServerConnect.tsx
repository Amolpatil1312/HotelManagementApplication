import { useState, useEffect } from 'react';
import { setApiBase } from '../config';

interface ServerConnectProps {
  onConnected: () => void;
}

export default function ServerConnect({ onConnected }: ServerConnectProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Try to auto-detect server on local network
  useEffect(() => {
    // If running on localhost (dev/desktop), auto-connect
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const localUrl = `${window.location.protocol}//${window.location.hostname}:8080`;
      testAndConnect(localUrl);
    }
  }, []);

  const testAndConnect = async (url: string) => {
    setTesting(true);
    setError('');
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/has-admin`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setApiBase(cleanUrl);
        onConnected();
        return true;
      }
      setError('Server found but returned an error');
    } catch {
      setError('Cannot connect to server. Check the IP address and make sure the server is running.');
    } finally {
      setTesting(false);
    }
    return false;
  };

  const handleConnect = () => {
    if (!serverUrl.trim()) return;
    let url = serverUrl.trim();
    if (!url.startsWith('http')) url = `http://${url}`;
    testAndConnect(url);
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setError('');

    // Try common local IPs on port 8080
    const baseIp = '192.168.1';
    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const url = `http://${baseIp}.${i}:8080`;
      promises.push(
        fetch(`${url}/api/auth/has-admin`, { signal: AbortSignal.timeout(2000) })
          .then(res => res.ok ? url : null)
          .catch(() => null)
      );
    }

    // Also try 192.168.0.x
    const baseIp2 = '192.168.0';
    for (let i = 1; i <= 254; i++) {
      const url = `http://${baseIp2}.${i}:8080`;
      promises.push(
        fetch(`${url}/api/auth/has-admin`, { signal: AbortSignal.timeout(2000) })
          .then(res => res.ok ? url : null)
          .catch(() => null)
      );
    }

    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);

    if (found) {
      setServerUrl(found);
      setApiBase(found);
      onConnected();
    } else {
      setError('No server found on local network. Enter the IP address manually.');
    }
    setAutoDetecting(false);
  };

  return (
    <div className="setup-wizard">
      <div className="setup-container">
        <div className="setup-header">
          <div className="setup-logo">{'\uD83C\uDF7D\uFE0F'}</div>
          <h1>Connect to Server</h1>
          <p>Enter the IP address of the computer running the restaurant server</p>
        </div>

        <div className="setup-step-content">
          <div className="form-group">
            <label>Server Address</label>
            <input
              className="form-input"
              value={serverUrl}
              onChange={e => { setServerUrl(e.target.value); setError(''); }}
              placeholder="e.g. 192.168.1.100:8080"
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              style={{ fontSize: '18px', padding: '14px' }}
            />
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '6px' }}>
              Find this on the server PC: look for the IP address shown when the backend starts
            </p>
          </div>

          {error && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleConnect}
            disabled={testing || !serverUrl.trim()}
            style={{ width: '100%', padding: '14px', fontSize: '16px', marginBottom: '12px' }}
          >
            {testing ? 'Connecting...' : '\uD83D\uDD17 Connect'}
          </button>

          <button
            className="btn-secondary"
            onClick={handleAutoDetect}
            disabled={autoDetecting}
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            {autoDetecting ? 'Scanning network...' : '\uD83D\uDD0D Auto-detect server on WiFi'}
          </button>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '8px' }}>How it works</h3>
          <ol style={{ color: '#aaa', fontSize: '13px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Start the server on your main PC/laptop</li>
            <li>Connect this phone/tablet to the same WiFi</li>
            <li>Enter the server IP shown on the PC (e.g. 192.168.1.100:8080)</li>
            <li>Tap Connect</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
