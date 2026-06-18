import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Megaphone, FileText, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useFetch, useTenant } from '../hooks';
import { Spinner, Badge, timeAgo } from '../components/UI';

export default function Dashboard() {
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const products = useFetch(() => api.products.list(tenantId), [tenantId]);
  const campaigns = useFetch(() => api.campaigns.list(tenantId), [tenantId]);

  const stats = React.useMemo(() => {
    const c = campaigns.data?.campaigns ?? [];
    return {
      totalProducts: products.data?.products.length ?? 0,
      totalCampaigns: c.length,
      generating: c.filter(x => x.status === 'GENERATING').length,
      needsReview: c.filter(x => x.status === 'NEEDS_REVIEW').length,
      approved: c.filter(x => x.status === 'APPROVED').length,
      published: c.filter(x => x.status === 'PUBLISHED').length,
    };
  }, [products.data, campaigns.data]);

  const recentCampaigns = campaigns.data?.campaigns.slice(0, 5) ?? [];

  if (!tenantId) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Welcome to DLF Agent</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Enter your Tenant ID to get started. You can find it in your backend configuration.
          </p>
          <TenantSetup />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>AI-powered social media campaign overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/campaigns')}>
          <Zap size={14} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="📦" color="var(--accent)"
          value={stats.totalProducts} label="Products"
          delta="Intake ready" onClick={() => navigate('/products')}
        />
        <StatCard
          icon="📣" color="#06b6d4"
          value={stats.totalCampaigns} label="Campaigns"
          onClick={() => navigate('/campaigns')}
        />
        <StatCard
          icon="⏳" color="var(--warning)"
          value={stats.needsReview} label="Awaiting Review"
          delta={stats.needsReview > 0 ? 'Action needed' : 'All clear'}
          onClick={() => navigate('/posts')}
        />
        <StatCard
          icon="✅" color="var(--success)"
          value={stats.published} label="Published"
          onClick={() => navigate('/publishing')}
        />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Recent campaigns */}
        <div className="card">
          <div className="card-title">
            <span>Recent Campaigns</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campaigns')}>View all</button>
          </div>
          {campaigns.loading ? <Spinner /> : (
            recentCampaigns.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Megaphone size={36} />
                <h3>No campaigns yet</h3>
                <p>Create your first AI-powered campaign</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/campaigns')}>
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Platforms</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.map(c => (
                      <tr key={c.id} style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/campaigns')}>
                        <td><div className="cell-main">{c.name}</div></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {c.platforms.map(p => (
                              <span key={p} className={`badge plt-${p}`} style={{ fontSize: 10 }}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td><Badge status={c.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Package size={16} />, label: 'Add Product', path: '/products' },
                { icon: <Megaphone size={16} />, label: 'Create Campaign', path: '/campaigns' },
                { icon: <FileText size={16} />, label: 'Review Posts', path: '/posts' },
                { icon: <TrendingUp size={16} />, label: 'View Analytics', path: '/analytics' },
              ].map(a => (
                <button key={a.path} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate(a.path)}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><CheckCircle size={16} color="var(--success)" /> System Status</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>API Server</span>
                <span><span className="status-dot online" />Online</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Gemini AI</span>
                <span><span className="status-dot online" />Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Queue Worker</span>
                <span><span className="status-dot online" />Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, color, value, label, delta, onClick,
}: {
  icon: string; color: string; value: number;
  label: string; delta?: string; onClick?: () => void;
}) {
  return (
    <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}22` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {delta && <div className="stat-delta neutral">{delta}</div>}
    </div>
  );
}

function TenantSetup() {
  const { setTenantId } = useTenant();
  const [val, setVal] = React.useState('');
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        placeholder="Enter tenant UUID..."
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{ flex: 1 }}
      />
      <button className="btn btn-primary" disabled={!val.trim()} onClick={() => setTenantId(val.trim())}>
        Go
      </button>
    </div>
  );
}
