import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useTenant } from '../hooks';
import { Alert } from '../components/UI';

export default function SettingsPage() {
  const { tenantId, setTenantId } = useTenant();
  const [input, setInput] = useState(tenantId);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const trimmed = input.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    if (!isUuid) {
      setError('Tenant ID must be a valid UUID format (e.g. 123e4567-e89b-12d3-a456-426614174000).');
      return;
    }
    setError(null);
    setTenantId(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const generateNewUuid = () => {
    try {
      const newId = window.crypto.randomUUID();
      setInput(newId);
      setError(null);
    } catch (e) {
      setInput('11111111-1111-4111-8111-111111111111');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Configure your workspace</p>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {saved && <Alert type="success" message="Settings saved successfully!" />}
        {error && <Alert type="error" message={error} />}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <Settings size={16} /> Workspace Settings
          </div>

          <div className="form-group">
            <label>Tenant ID</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={generateNewUuid} title="Generate random UUID">
                <RefreshCw size={14} /> Generate
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              A unique UUID identifier for your workspace. The database strictly requires a valid UUID schema.
            </div>
          </div>

          <button className="btn btn-primary" onClick={save}>
            <Save size={14} /> Save Settings
          </button>
        </div>

        <div className="card">
          <div className="card-title">About</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>DLF Agent</strong> v0.1.0</div>
            <div>AI-powered social media content generation pipeline</div>
            <div style={{ marginTop: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Tech Stack:</strong>
            </div>
            <div>Backend: Express.js + TypeScript</div>
            <div>AI: LangGraph + Gemini</div>
            <div>DB: PostgreSQL (Prisma)</div>
            <div>Queue: BullMQ + Redis</div>
            <div>Frontend: React + Vite</div>
          </div>
        </div>
      </div>
    </div>
  );
}
