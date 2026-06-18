import React, { useState } from 'react';
import { FileText, CheckCircle, Edit3 } from 'lucide-react';
import { api, type Campaign, type GeneratedPost } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, Badge, PlatformBadge, EmptyState, Alert, timeAgo } from '../components/UI';
import Modal from '../components/Modal';

export default function Posts() {
  const { tenantId } = useTenant();
  const { data: campData } = useFetch(() => api.campaigns.list(tenantId), [tenantId]);
  const campaigns = campData?.campaigns ?? [];

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  React.useEffect(() => {
    if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns.find(c => c.status === 'NEEDS_REVIEW') ?? campaigns[0]);
    }
  }, [campaigns]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Review Posts</h1>
          <p>Review, edit, and approve AI-generated social media content</p>
        </div>
      </div>

      {/* Campaign selector */}
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
              {c.status === 'NEEDS_REVIEW' && (
                <span className="nav-badge" style={{ marginLeft: 6 }}>!</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeCampaign ? (
        <CampaignPosts tenantId={tenantId} campaign={activeCampaign} />
      ) : (
        <div className="card">
          <EmptyState
            icon={<FileText size={48} />}
            title="No campaigns found"
            description="Create a campaign and generate content to review posts here"
          />
        </div>
      )}
    </div>
  );
}

function CampaignPosts({ tenantId, campaign }: { tenantId: string; campaign: Campaign }) {
  const { data, loading, error, refetch } = useFetch(
    () => api.posts.list(tenantId, campaign.id), [tenantId, campaign.id]
  );

  const approveAction = useAction(async (postId: string) => {
    await api.posts.approve(tenantId, campaign.id, postId);
    refetch();
  });

  const [editing, setEditing] = useState<GeneratedPost | null>(null);
  const posts = data?.posts ?? [];

  return (
    <>
      {error && <Alert type="error" message={error} />}
      {approveAction.error && <Alert type="error" message={approveAction.error} />}

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={48} />}
            title="No posts generated yet"
            description={`Click "Generate" on the "${campaign.name}" campaign to trigger the AI pipeline`}
          />
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-card-platform">
                <PlatformBadge platform={post.platform} />
                <Badge status={post.status} />
              </div>

              {post.assets && post.assets.length > 0 && (
                <div style={{ height: 160, overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: 10, border: '1px solid var(--border)', marginTop: 10 }}>
                  <img src={post.assets[0].asset.publicUrl ?? ''} alt="Creative preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div className="post-card-caption">{post.caption}</div>

              {post.hashtags.length > 0 && (
                <div className="post-card-hashtags">
                  {post.hashtags.map(h => `#${h}`).join(' ')}
                </div>
              )}

              {post.callToAction && (
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  padding: '6px 10px', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', marginBottom: 12
                }}>
                  CTA: {post.callToAction}
                </div>
              )}

              <div className="post-card-footer">
                {post.status !== 'APPROVED' && post.status !== 'PUBLISHED' && (
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1 }}
                    disabled={approveAction.loading}
                    onClick={() => approveAction.run(post.id)}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                )}
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditing(post)}
                >
                  <Edit3 size={13} /> Edit
                </button>
              </div>

              {post.approvedAt && (
                <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 8 }}>
                  ✓ Approved {timeAgo(post.approvedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditPostModal
          tenantId={tenantId}
          campaignId={campaign.id}
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </>
  );
}

function EditPostModal({
  tenantId, campaignId, post, onClose, onSaved,
}: {
  tenantId: string;
  campaignId: string;
  post: GeneratedPost;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags.join(' '));
  const [cta, setCta] = useState(post.callToAction ?? '');
  const [reason, setReason] = useState('');

  const { run, loading, error } = useAction(async () => {
    await api.posts.update(tenantId, campaignId, post.id, {
      caption,
      hashtags: hashtags.split(/\s+/).map(h => h.replace(/^#/, '')).filter(Boolean),
      callToAction: cta || undefined,
      changeReason: reason,
    });
    onSaved();
  });

  return (
    <Modal
      title={`Edit Post — ${post.platform}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading || !reason.trim()} onClick={() => run()}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}
      <div className="form-group">
        <label>Caption</label>
        <textarea rows={5} value={caption} onChange={e => setCaption(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {caption.length} characters
        </div>
      </div>
      <div className="form-group">
        <label>Hashtags (space-separated)</label>
        <input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)}
          placeholder="#marketing #launch" />
      </div>
      <div className="form-group">
        <label>Call To Action</label>
        <input type="text" value={cta} onChange={e => setCta(e.target.value)}
          placeholder="Shop now, Learn more…" />
      </div>
      <div className="form-group">
        <label>Reason for change *</label>
        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Adjusted tone to be more casual" />
      </div>
    </Modal>
  );
}
