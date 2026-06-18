import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Campaigns from './pages/Campaigns';
import Posts from './pages/Posts';
import SocialAccounts from './pages/SocialAccounts';
import Publishing from './pages/Publishing';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

import { api } from './api';
import { useTenant } from './hooks';

function AppShell() {
  const { tenantId } = useTenant();

  // Count posts needing review to show badge
  const [pendingPosts, setPendingPosts] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    api.campaigns.list(tenantId).then(async (res) => {
      if (cancelled) return;
      const reviewable = res.campaigns.filter(c => c.status === 'NEEDS_REVIEW');
      let total = 0;
      for (const c of reviewable) {
        try {
          const p = await api.posts.list(tenantId, c.id);
          total += p.posts.filter(p => p.status === 'NEEDS_REVIEW').length;
        } catch { /* ignore */ }
      }
      if (!cancelled) setPendingPosts(total);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [tenantId]);

  return (
    <div className="app-layout">
      <Sidebar pendingPosts={pendingPosts} />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<PageWrap title="Dashboard" sub="Overview of your AI marketing pipeline"><Dashboard /></PageWrap>} />
          <Route path="/products" element={<PageWrap title="Products" sub="Product catalogue"><Products /></PageWrap>} />
          <Route path="/campaigns" element={<PageWrap title="Campaigns" sub="AI campaign management"><Campaigns /></PageWrap>} />
          <Route path="/posts" element={<PageWrap title="Review Posts" sub="Review & approve AI-generated content"><Posts /></PageWrap>} />
          <Route path="/social-accounts" element={<PageWrap title="Social Accounts" sub="Connected platforms"><SocialAccounts /></PageWrap>} />
          <Route path="/publishing" element={<PageWrap title="Publishing" sub="Schedule & publish posts"><Publishing /></PageWrap>} />
          <Route path="/analytics" element={<PageWrap title="Analytics" sub="Performance insights"><Analytics /></PageWrap>} />
          <Route path="/settings" element={<PageWrap title="Settings" sub="Workspace configuration"><Settings /></PageWrap>} />
        </Routes>
      </div>
    </div>
  );
}

function PageWrap({ title, sub, children }: {
  title: string; sub: string; children: React.ReactNode;
}) {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  return (
    <>
      <header className="header">
        <div>
          <div className="header-title">{title}</div>
          <div className="header-subtitle">{sub}</div>
        </div>
        <div className="header-actions">
          <TenantPill />
        </div>
      </header>
      {!tenantId && (
        <div
          onClick={() => navigate('/settings')}
          style={{
            background: 'var(--warning-bg)',
            borderBottom: '1px solid rgba(245,158,11,0.25)',
            padding: '10px 28px',
            fontSize: 13,
            color: 'var(--warning)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
          }}
        >
          ⚠️ No Tenant ID set — click here to go to Settings and enter one before using the app.
        </div>
      )}
      {children}
    </>
  );
}

function TenantPill() {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  if (!tenantId) return (
    <button
      className="btn btn-sm"
      onClick={() => navigate('/settings')}
      style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}
    >
      ⚠ Set Tenant ID
    </button>
  );
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--border)', fontFamily: 'monospace' }}>
      {tenantId}
    </span>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
