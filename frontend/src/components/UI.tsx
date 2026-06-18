import React from 'react';

export function Spinner() {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase().replace('_', '-')}`;
  const labels: Record<string, string> = {
    DRAFT: 'Draft', GENERATING: 'Generating', NEEDS_REVIEW: 'Needs Review',
    APPROVED: 'Approved', PUBLISHED: 'Published', FAILED: 'Failed',
    CANCELLED: 'Cancelled', QUEUED: 'Queued', RUNNING: 'Running',
    SUCCEEDED: 'Succeeded', SCHEDULED: 'Scheduled', PUBLISHING: 'Publishing',
  };
  return <span className={cls}>{labels[status] ?? status}</span>;
}

export function PlatformBadge({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    INSTAGRAM: '📸', LINKEDIN: '💼', FACEBOOK: '👥', X: '𝕏',
  };
  return (
    <span className={`badge plt-${platform}`}>
      {icons[platform] ?? '🌐'} {platform}
    </span>
  );
}

export function EmptyState({
  icon, title, description, action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Alert({
  type, message,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
}) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className={`alert alert-${type}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
