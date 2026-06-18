import React, { useState } from 'react';
import { Send, Calendar, CheckCircle } from 'lucide-react';
import { api, type Campaign, type GeneratedPost, type SocialAccount } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, Badge, PlatformBadge, EmptyState, Alert, formatDate } from '../components/UI';
import Modal from '../components/Modal';

export default function Publishing() {
  const { tenantId } = useTenant();
  const { data: campData } = useFetch(() => api.campaigns.list(tenantId), [tenantId]);
  const { data: accountData } = useFetch(() => api.socialAccounts.list(tenantId), [tenantId]);

  const campaigns = campData?.campaigns ?? [];
  const accounts = accountData?.accounts ?? [];

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [schedulePost, setSchedulePost] = useState<{ post: GeneratedPost; campaignId: string } | null>(null);

  React.useEffect(() => {
    if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns.find(c => c.status === 'APPROVED') ?? campaigns[0]);
    }
  }, [campaigns]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Schedule & Publish</h1>
          <p>Schedule approved posts to go live on social platforms</p>
        </div>
      </div>

      {/* Campaign tabs */}
      {campaigns.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {campaigns.map(c => (
            <button
              key={c.id}
              className={`tab ${activeCampaign?.id === c.id ? 'active' : ''}`}
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 0 }}
              onClick={() => setActiveCampaign(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {activeCampaign ? (
        <CampaignPublishing
          tenantId={tenantId}
          campaign={activeCampaign}
          accounts={accounts}
          onSchedule={(post) => setSchedulePost({ post, campaignId: activeCampaign.id })}
        />
      ) : (
        <div className="card">
          <EmptyState
            icon={<Send size={48} />}
            title="No campaigns"
            description="Create and approve campaigns before scheduling posts"
          />
        </div>
      )}

      {schedulePost && (
        <ScheduleModal
          tenantId={tenantId}
          campaignId={schedulePost.campaignId}
          post={schedulePost.post}
          accounts={accounts.filter(a => a.platform === schedulePost.post.platform)}
          onClose={() => setSchedulePost(null)}
          onScheduled={() => setSchedulePost(null)}
        />
      )}
    </div>
  );
}

function CampaignPublishing({
  tenantId, campaign, accounts, onSchedule,
}: {
  tenantId: string;
  campaign: Campaign;
  accounts: SocialAccount[];
  onSchedule: (post: GeneratedPost) => void;
}) {
  const { data: postsData, loading } = useFetch(
    () => api.posts.list(tenantId, campaign.id), [tenantId, campaign.id]
  );
  const { data: jobsData, refetch: refetchJobs } = useFetch(
    () => api.publishing.listJobs(tenantId, campaign.id), [tenantId, campaign.id]
  );

  const posts = postsData?.posts ?? [];
  const jobs = jobsData?.publishJobs ?? [];

  const approvedPosts = posts.filter(p => p.status === 'APPROVED' || p.status === 'PUBLISHED');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Posts ready to publish */}
      <div className="card">
        <div className="card-title">
          <span>Approved Posts</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{approvedPosts.length} ready</span>
        </div>
        {loading ? <Spinner /> : approvedPosts.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={40} />}
            title="No approved posts"
            description="Review and approve posts in the Review Posts page first"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {approvedPosts.map(post => (
              <div key={post.id} style={{
                padding: '12px 14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', background: 'var(--bg-elevated)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <PlatformBadge platform={post.platform} />
                  <Badge status={post.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.caption}
                </div>
                {post.status !== 'PUBLISHED' && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={accounts.filter(a => a.platform === post.platform).length === 0}
                    onClick={() => onSchedule(post)}
                  >
                    <Send size={12} /> Schedule
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish jobs */}
      <div className="card">
        <div className="card-title">
          <span>Publish Jobs</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => refetchJobs()}>↻</button>
        </div>
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            title="No jobs scheduled"
            description="Schedule approved posts to see them here"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td>
                      <span className={`badge plt-${j.platform}`}>{j.platform}</span>
                    </td>
                    <td><Badge status={j.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {j.scheduledAt ? formatDate(j.scheduledAt) : 'Immediate'}
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

function ScheduleModal({
  tenantId, campaignId, post, accounts, onClose, onScheduled,
}: {
  tenantId: string;
  campaignId: string;
  post: GeneratedPost;
  accounts: SocialAccount[];
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [scheduledAt, setScheduledAt] = useState('');

  const { run, loading, error } = useAction(async () => {
    await api.publishing.schedule(tenantId, campaignId, {
      postId: post.id,
      socialAccountId: accountId,
      scheduledAt: scheduledAt || undefined,
    });
    onScheduled();
  });

  return (
    <Modal
      title={`Schedule — ${post.platform}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading || !accountId} onClick={() => run()}>
            {loading ? 'Scheduling…' : scheduledAt ? 'Schedule' : 'Publish Now'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}
      {accounts.length === 0 ? (
        <Alert type="error" message={`No ${post.platform} accounts connected. Go to Social Accounts first.`} />
      ) : (
        <>
          <div className="form-group">
            <label>Publish Account</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>@{a.accountName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Scheduled Time (leave empty to publish now)</label>
            <input type="datetime-local" value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Post preview</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {post.caption.slice(0, 120)}…
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
