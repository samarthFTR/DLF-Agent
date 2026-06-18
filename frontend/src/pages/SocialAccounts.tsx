import React, { useState } from 'react';
import { Plus, Share2, Trash2, Link } from 'lucide-react';
import { api, type UpsertAccountInput } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, EmptyState, Alert, formatDate } from '../components/UI';
import Modal from '../components/Modal';

const PLATFORMS = ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X'];

export default function SocialAccounts() {
  const { tenantId } = useTenant();
  const { data, loading, error, refetch } = useFetch(
    () => api.socialAccounts.list(tenantId), [tenantId]
  );

  const [showAdd, setShowAdd] = useState(false);

  const deleteAction = useAction(async (id: string) => {
    await api.socialAccounts.delete(tenantId, id);
    refetch();
  });

  const accounts = data?.accounts ?? [];

  const PLATFORM_ICONS: Record<string, string> = {
    INSTAGRAM: '📸', LINKEDIN: '💼', FACEBOOK: '👥', X: '𝕏',
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Social Accounts</h1>
          <p>Connect and manage your social media publishing accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Connect Account
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {deleteAction.error && <Alert type="error" message={deleteAction.error} />}

      {/* Platform connection grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {PLATFORMS.map(p => {
          const connected = accounts.filter(a => a.platform === p);
          return (
            <div key={p} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', align: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{PLATFORM_ICONS[p]}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p}</span>
                </div>
                {connected.length > 0 ? (
                  <span className="badge badge-approved">
                    <span className="status-dot online" />{connected.length}
                  </span>
                ) : (
                  <span className="badge badge-draft">Not connected</span>
                )}
              </div>
              {connected.length > 0
                ? connected.map(a => (
                    <div key={a.id} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      @{a.accountName}
                    </div>
                  ))
                : (
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}
                    onClick={() => setShowAdd(true)}>
                    <Link size={12} /> Connect
                  </button>
                )}
            </div>
          );
        })}
      </div>

      {/* Accounts table */}
      <div className="card">
        <div className="card-title">All Connected Accounts</div>
        {loading ? <Spinner /> : accounts.length === 0 ? (
          <EmptyState
            icon={<Share2 size={48} />}
            title="No accounts connected"
            description="Connect your social media accounts to enable post publishing"
            action={
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Connect Account
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Account</th>
                  <th>External ID</th>
                  <th>Scopes</th>
                  <th>Connected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id}>
                    <td>
                      <span className={`badge plt-${a.platform}`}>
                        {PLATFORM_ICONS[a.platform]} {a.platform}
                      </span>
                    </td>
                    <td>
                      <div className="cell-main">@{a.accountName}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {a.externalAccountId}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {a.scopes.map(s => (
                          <span key={s} className="badge badge-draft" style={{ fontSize: 10 }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(a.createdAt)}
                    </td>
                    <td>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => {
                          if (confirm(`Disconnect @${a.accountName}?`)) {
                            deleteAction.run(a.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddAccountModal
          tenantId={tenantId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); refetch(); }}
        />
      )}
    </div>
  );
}

function AddAccountModal({
  tenantId, onClose, onAdded,
}: {
  tenantId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<UpsertAccountInput>({
    platform: 'INSTAGRAM',
    accountName: '',
    externalAccountId: '',
    accessToken: '',
    refreshToken: '',
    scopes: [],
  });

  const [scopesText, setScopesText] = useState('');

  const { run, loading, error } = useAction(async () => {
    await api.socialAccounts.upsert(tenantId, {
      ...form,
      scopes: scopesText.split(',').map(s => s.trim()).filter(Boolean),
    });
    onAdded();
  });

  const set = (k: keyof UpsertAccountInput, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const valid = form.accountName && form.externalAccountId && form.accessToken;

  return (
    <Modal
      title="Connect Social Account"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading || !valid} onClick={() => run()}>
            {loading ? 'Connecting…' : 'Connect Account'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}
      <div className="form-group">
        <label>Platform</label>
        <select value={form.platform} onChange={e => set('platform', e.target.value)}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Account Name *</label>
          <input type="text" placeholder="@username"
            value={form.accountName} onChange={e => set('accountName', e.target.value)} />
        </div>
        <div className="form-group">
          <label>External Account ID *</label>
          <input type="text" placeholder="Platform user ID"
            value={form.externalAccountId} onChange={e => set('externalAccountId', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Access Token *</label>
        <input type="password" placeholder="OAuth access token"
          value={form.accessToken} onChange={e => set('accessToken', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Refresh Token (optional)</label>
        <input type="password" placeholder="OAuth refresh token"
          value={form.refreshToken ?? ''} onChange={e => set('refreshToken', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Scopes (comma-separated)</label>
        <input type="text" placeholder="e.g. instagram_basic, publish_actions"
          value={scopesText} onChange={e => setScopesText(e.target.value)} />
      </div>
    </Modal>
  );
}
