import React, { useState } from 'react';
import { Plus, Megaphone, Zap, Eye, Clock, ChevronRight } from 'lucide-react';
import { api, type Campaign, type CreateCampaignInput } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, Badge, PlatformBadge, EmptyState, Alert, timeAgo } from '../components/UI';
import Modal from '../components/Modal';

const PLATFORMS = ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X'];

export default function Campaigns() {
  const { tenantId } = useTenant();
  const { data: cData, loading: cLoading, error: cError, refetch } = useFetch(
    () => api.campaigns.list(tenantId), [tenantId]
  );
  const { data: pData } = useFetch(() => api.products.list(tenantId), [tenantId]);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);

  const generateAction = useAction(async (campaign: Campaign) => {
    await api.campaigns.generate(tenantId, campaign.id);
    setSelected(campaign);
    refetch();
  });

  const campaigns = cData?.campaigns ?? [];
  const products = pData?.products ?? [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Campaigns</h1>
          <p>Create and manage your AI-powered social media campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {cError && <Alert type="error" message={cError} />}
      {generateAction.error && <Alert type="error" message={generateAction.error} />}

      <div className="card">
        {cLoading ? <Spinner /> : campaigns.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={48} />}
            title="No campaigns yet"
            description="Create a campaign and let the AI generate content for all your platforms"
            action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Create Campaign
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platforms</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-main">{c.name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.platforms.map(p => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-draft">{c.publishMode}</span>
                    </td>
                    <td><Badge status={c.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {timeAgo(c.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelected(c)}
                          title="View runs"
                        >
                          <Eye size={13} /> Runs / Results
                        </button>
                        {(c.status === 'DRAFT' || c.status === 'NEEDS_REVIEW') && (
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={generateAction.loading}
                            onClick={() => generateAction.run(c)}
                            title="Generate AI content"
                          >
                            <Zap size={13} />
                            {generateAction.loading ? '…' : 'Generate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCampaignModal
          tenantId={tenantId}
          products={products}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}

      {selected && (
        <CampaignRunsModal
          tenantId={tenantId}
          campaign={selected}
          onClose={() => { setSelected(null); refetch(); }}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  tenantId, products, onClose, onCreated,
}: {
  tenantId: string;
  products: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateCampaignInput>({
    productId: '', name: '', platforms: ['INSTAGRAM'], publishMode: 'MANUAL',
  });

  const togglePlatform = (p: string) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));

  const { run, loading, error } = useAction(async () => {
    await api.campaigns.create(tenantId, form);
    onCreated();
  });

  const valid = form.productId && form.name && form.platforms.length > 0;

  return (
    <Modal
      title="New Campaign"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading || !valid} onClick={() => run()}>
            {loading ? 'Creating…' : 'Create Campaign'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}
      <div className="form-group">
        <label>Product *</label>
        <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
          <option value="">Select a product…</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Campaign Name *</label>
        <input type="text" placeholder="e.g. Summer Launch 2026"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Target Platforms *</label>
        <div className="checkbox-group">
          {PLATFORMS.map(p => (
            <label key={p} className={`platform-checkbox ${form.platforms.includes(p) ? 'selected' : ''}`}>
              <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} />
              {p === 'INSTAGRAM' ? '📸' : p === 'LINKEDIN' ? '💼' : p === 'FACEBOOK' ? '👥' : '𝕏'} {p}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Publish Mode</label>
        <select value={form.publishMode} onChange={e => setForm(f => ({ ...f, publishMode: e.target.value }))}>
          <option value="MANUAL">Manual</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="AUTO">Auto</option>
        </select>
      </div>
    </Modal>
  );
}

function CampaignRunsModal({
  tenantId, campaign, onClose,
}: {
  tenantId: string;
  campaign: Campaign;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const runsRes = await api.runs.list(tenantId, campaign.id);
      setRuns(runsRes.runs);

      const latestRun = runsRes.runs[0];
      if (latestRun) {
        const eventsRes = await api.runs.events(tenantId, campaign.id, latestRun.id);
        setEvents(eventsRes.events);
      }

      const postsRes = await api.posts.list(tenantId, campaign.id);
      setPosts(postsRes.posts);

      const accountsRes = await api.socialAccounts.list(tenantId);
      setAccounts(accountsRes.accounts);
    } catch (e) {
      console.error('Error fetching run data:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [tenantId, campaign.id]);

  const latestRun = runs[0];
  const isGenerating = latestRun && (latestRun.status === 'RUNNING' || latestRun.status === 'QUEUED');

  return (
    <Modal title={`Campaign Pipeline — ${campaign.name}`} onClose={onClose} wide>
      {loading && runs.length === 0 ? (
        <Spinner />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Active Generation Progress */}
          {isGenerating && (
            <div className="card" style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Spinner size="sm" />
                <strong style={{ fontSize: 15 }}>AI Agents Generating Content...</strong>
                <Badge status={latestRun.status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Current Agent in action: <code>{latestRun.currentAgent ?? 'initializing...'}</code>
              </div>
              
              {/* Event Log */}
              <div style={{ 
                maxHeight: 140, 
                overflowY: 'auto', 
                background: 'var(--bg)', 
                padding: 12, 
                borderRadius: 'var(--radius-sm)', 
                fontFamily: 'monospace', 
                fontSize: 11, 
                border: '1px solid var(--border)' 
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Pipeline Log Output:</div>
                {events.map(ev => (
                  <div key={ev.id} style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{new Date(ev.createdAt).toLocaleTimeString()}]</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{ev.agentName}:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{ev.eventType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Creatives Section */}
          {posts.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>Generated Creatives</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                {posts.map(post => {
                  const matchedAccount = accounts.find(a => a.platform === post.platform);
                  const hasImage = post.assets && post.assets.length > 0;
                  return (
                    <div key={post.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 14, background: 'var(--bg-elevated)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <PlatformBadge platform={post.platform} />
                        <Badge status={post.status} />
                      </div>
                      
                      {hasImage && (
                        <div style={{ height: 160, overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: 10, border: '1px solid var(--border)' }}>
                          <img src={post.assets![0].asset.publicUrl ?? ''} alt="Creative preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      
                      <div style={{ 
                        flex: 1, 
                        fontSize: 13, 
                        color: 'var(--text-secondary)', 
                        marginBottom: 12, 
                        lineHeight: 1.5,
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 4, 
                        WebkitBoxOrient: 'vertical' 
                      }}>
                        {post.caption}
                      </div>

                      {post.hashtags.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 12 }}>
                          {post.hashtags.map(h => `#${h}`).join(' ')}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                        {post.status !== 'PUBLISHED' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ flex: 1 }}
                            disabled={!matchedAccount || publishingPostId === post.id}
                            onClick={async () => {
                              setPublishingPostId(post.id);
                              try {
                                if (post.status !== 'APPROVED') {
                                  await api.posts.approve(tenantId, campaign.id, post.id);
                                }
                                await api.publishing.schedule(tenantId, campaign.id, {
                                  postId: post.id,
                                  socialAccountId: matchedAccount!.id,
                                });
                                alert(`Post approved and queued for immediate publishing!`);
                                await fetchData();
                              } catch (err: any) {
                                alert(`Post failed: ${err.message}`);
                              } finally {
                                setPublishingPostId(null);
                              }
                            }}
                          >
                            {publishingPostId === post.id ? 'Posting…' : matchedAccount ? '🚀 Post' : '⚠ Connect Account'}
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} disabled>
                            ✓ Published
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Runs Table history */}
          <div>
            <h4 style={{ marginBottom: 8, fontSize: 14, color: 'var(--text-muted)' }}>Run Log History</h4>
            {runs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No run history found.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Run ID</th>
                      <th>Status</th>
                      <th>Model</th>
                      <th>Triggered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map(r => (
                      <tr key={r.id}>
                        <td><code style={{ fontSize: 10 }}>{r.id}</code></td>
                        <td><Badge status={r.status} /></td>
                        <td style={{ fontSize: 11 }}>{r.llmModel}</td>
                        <td style={{ fontSize: 11 }}>{r.startedAt ? timeAgo(r.startedAt) : timeAgo(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </Modal>
  );
}
