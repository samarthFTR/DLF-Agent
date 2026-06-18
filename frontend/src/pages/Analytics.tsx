import React, { useState } from 'react';
import { BarChart2, TrendingUp, Lightbulb } from 'lucide-react';
import { api, type Campaign } from '../api';
import { useFetch, useTenant } from '../hooks';
import { Spinner, EmptyState, Alert, formatDate } from '../components/UI';

export default function Analytics() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState<'metrics' | 'recommendations'>('metrics');
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  const { data: campData } = useFetch(() => api.campaigns.list(tenantId), [tenantId]);
  const campaigns = campData?.campaigns ?? [];

  React.useEffect(() => {
    if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns[0]);
    }
  }, [campaigns]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Campaign performance and AI-generated improvement recommendations</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'metrics' ? 'active' : ''}`} onClick={() => setTab('metrics')}>
          📊 Metrics
        </button>
        <button className={`tab ${tab === 'recommendations' ? 'active' : ''}`} onClick={() => setTab('recommendations')}>
          💡 Recommendations
        </button>
      </div>

      {tab === 'metrics' && (
        <>
          {/* Campaign selector */}
          {campaigns.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <select
                value={activeCampaign?.id ?? ''}
                onChange={e => setActiveCampaign(campaigns.find(c => c.id === e.target.value) ?? null)}
                style={{ width: 'auto' }}
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {activeCampaign ? (
            <CampaignMetrics tenantId={tenantId} campaign={activeCampaign} />
          ) : (
            <div className="card">
              <EmptyState
                icon={<BarChart2 size={48} />}
                title="No campaigns"
                description="Create campaigns and import analytics to view metrics"
              />
            </div>
          )}
        </>
      )}

      {tab === 'recommendations' && (
        <Recommendations tenantId={tenantId} />
      )}
    </div>
  );
}

function CampaignMetrics({ tenantId, campaign }: { tenantId: string; campaign: Campaign }) {
  const { data, loading, error } = useFetch(
    () => api.analytics.getCampaign(tenantId, campaign.id), [tenantId, campaign.id]
  );

  const events = data?.events ?? [];

  // Group by metric name
  const grouped = events.reduce<Record<string, { values: number[]; platform: string }>>((acc, e) => {
    const key = `${e.platform}:${e.metricName}`;
    if (!acc[key]) acc[key] = { values: [], platform: e.platform };
    acc[key].values.push(Number(e.metricValue));
    return acc;
  }, {});

  const metrics = Object.entries(grouped).map(([key, v]) => ({
    key,
    platform: v.platform,
    name: key.split(':')[1],
    avg: v.values.reduce((a, b) => a + b, 0) / v.values.length,
    max: Math.max(...v.values),
    count: v.values.length,
  }));

  const maxValue = Math.max(...metrics.map(m => m.avg), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="card">
        <div className="card-title">
          <span>Metric Overview</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{events.length} events</span>
        </div>

        {loading ? <Spinner /> : error ? (
          <Alert type="error" message={error} />
        ) : metrics.length === 0 ? (
          <EmptyState
            icon={<BarChart2 size={40} />}
            title="No metrics yet"
            description="Import analytics via the API to see metrics here"
          />
        ) : (
          <div style={{ marginTop: 4 }}>
            {metrics.map(m => (
              <div key={m.key} className="metric-bar">
                <div className="metric-bar-label">
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.platform}</div>
                  <div style={{ fontWeight: 500 }}>{m.name}</div>
                </div>
                <div className="metric-bar-track">
                  <div className="metric-bar-fill" style={{ width: `${(m.avg / maxValue) * 100}%` }} />
                </div>
                <div className="metric-bar-value">{m.avg.toFixed(1)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Recent Events</div>
        {loading ? <Spinner /> : events.length === 0 ? (
          <EmptyState icon={<TrendingUp size={40} />} title="No events" description="" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 15).map(e => (
                  <tr key={e.id}>
                    <td>
                      <span className={`badge plt-${e.platform}`} style={{ fontSize: 10 }}>{e.platform}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.metricName}</td>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
                      {Number(e.metricValue).toFixed(2)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(e.measuredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Recommendations({ tenantId }: { tenantId: string }) {
  const { data, loading, error } = useFetch(
    () => api.analytics.recommendations(tenantId), [tenantId]
  );
  const recs = data?.recommendations ?? [];

  const CATEGORY_COLORS: Record<string, string> = {
    creative: 'var(--accent)',
    timing: 'var(--warning)',
    platform: 'var(--accent-2)',
    audience: 'var(--success)',
    content: '#a78bfa',
  };

  return (
    <>
      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : recs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Lightbulb size={48} />}
            title="No recommendations yet"
            description="Import campaign analytics to receive AI-powered improvement recommendations"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {recs.map(rec => {
            const color = CATEGORY_COLORS[rec.category?.toLowerCase() ?? ''] ?? 'var(--accent)';
            return (
              <div key={rec.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  {rec.category && (
                    <span className="badge" style={{ background: `${color}22`, color }}>
                      {rec.category}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {formatDate(rec.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 12 }}>
                  {rec.summary}
                </p>
                {rec.evidence.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Evidence
                    </div>
                    <ul style={{ paddingLeft: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {rec.evidence.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
