import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Megaphone, FileText,
  Share2, BarChart2, Send, Settings, Zap,
} from 'lucide-react';

const NAV = [
  { label: 'Overview', group: 'MAIN' },
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { path: '/posts', icon: FileText, label: 'Review Posts' },
  { label: 'Publishing', group: 'MAIN' },
  { path: '/social-accounts', icon: Share2, label: 'Social Accounts' },
  { path: '/publishing', icon: Send, label: 'Schedule & Publish' },
  { label: 'Insights', group: 'MAIN' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { label: 'System', group: 'MAIN' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface Props { pendingPosts?: number; }

export default function Sidebar({ pendingPosts = 0 }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} color="#fff" />
        </div>
        <span className="sidebar-logo-text">DLF Agent</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if ('group' in item && !('path' in item)) {
            return <div key={i} className="nav-section-label">{item.label}</div>;
          }
          if (!('path' in item)) return null;
          const Icon = item.icon!;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path!)}
            >
              <Icon />
              {item.label}
              {item.path === '/posts' && pendingPosts > 0 && (
                <span className="nav-badge">{pendingPosts}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          DLF Agent v0.1.0
        </div>
      </div>
    </aside>
  );
}
