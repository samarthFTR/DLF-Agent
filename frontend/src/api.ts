// Centralised API client — all calls go through here
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { tenantId?: string } = {},
): Promise<T> {
  const tenantId = options.tenantId ?? localStorage.getItem('tenantId') ?? '';
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Products ──────────────────────────────────────────────────────────────────
export const api = {
  products: {
    list: (tenantId: string) =>
      request<{ products: Product[] }>('/products', { tenantId }),
    create: (tenantId: string, data: CreateProductInput) =>
      request<{ product: Product }>('/products', { method: 'POST', body: JSON.stringify(data), tenantId }),
    get: (tenantId: string, id: string) =>
      request<{ product: Product }>(`/products/${id}`, { tenantId }),
    delete: (tenantId: string, id: string) =>
      request<void>(`/products/${id}`, { method: 'DELETE', tenantId }),
  },

  assets: {
    listProductImages: (tenantId: string, productId: string) =>
      request<{ assets: Asset[] }>(`/products/${productId}/images`, { tenantId }),
    uploadProductImage: async (tenantId: string, productId: string, file: File): Promise<{ asset: Asset }> => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BASE}/products/${productId}/images`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText);
      }
      return res.json();
    },
    deleteAsset: (tenantId: string, assetId: string) =>
      request<void>(`/assets/${assetId}`, { method: 'DELETE', tenantId }),
  },

  campaigns: {
    list: (tenantId: string) =>
      request<{ campaigns: Campaign[] }>('/campaigns', { tenantId }),
    create: (tenantId: string, data: CreateCampaignInput) =>
      request<{ campaign: Campaign }>('/campaigns', { method: 'POST', body: JSON.stringify(data), tenantId }),
    get: (tenantId: string, id: string) =>
      request<{ campaign: Campaign }>(`/campaigns/${id}`, { tenantId }),
    generate: (tenantId: string, campaignId: string) =>
      request<{ run: AgentRun }>(`/campaigns/${campaignId}/runs`, { method: 'POST', tenantId }),
  },

  runs: {
    list: (tenantId: string, campaignId: string) =>
      request<{ runs: AgentRun[] }>(`/campaigns/${campaignId}/runs`, { tenantId }),
    events: (tenantId: string, campaignId: string, runId: string) =>
      request<{ events: RunEvent[] }>(`/campaigns/${campaignId}/runs/${runId}/events`, { tenantId }),
    cancel: (tenantId: string, campaignId: string, runId: string) =>
      request<{ run: AgentRun }>(`/campaigns/${campaignId}/runs/${runId}/cancel`, { method: 'POST', tenantId }),
  },

  posts: {
    list: (tenantId: string, campaignId: string) =>
      request<{ posts: GeneratedPost[] }>(`/campaigns/${campaignId}/posts`, { tenantId }),
    approve: (tenantId: string, campaignId: string, postId: string) =>
      request<{ post: GeneratedPost }>(`/campaigns/${campaignId}/posts/${postId}/approve`, { method: 'POST', tenantId }),
    update: (tenantId: string, campaignId: string, postId: string, data: UpdatePostInput) =>
      request<{ post: GeneratedPost }>(`/campaigns/${campaignId}/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(data), tenantId }),
  },

  socialAccounts: {
    list: (tenantId: string) =>
      request<{ accounts: SocialAccount[] }>('/social-accounts', { tenantId }),
    upsert: (tenantId: string, data: UpsertAccountInput) =>
      request<{ account: SocialAccount }>('/social-accounts', { method: 'POST', body: JSON.stringify(data), tenantId }),
    delete: (tenantId: string, id: string) =>
      request<void>(`/social-accounts/${id}`, { method: 'DELETE', tenantId }),
  },

  publishing: {
    schedule: (tenantId: string, campaignId: string, data: SchedulePostInput) =>
      request<{ publishJob: PublishJob }>(`/campaigns/${campaignId}/schedule`, { method: 'POST', body: JSON.stringify(data), tenantId }),
    listJobs: (tenantId: string, campaignId: string) =>
      request<{ publishJobs: PublishJob[] }>(`/campaigns/${campaignId}/publish-jobs`, { tenantId }),
  },

  analytics: {
    getCampaign: (tenantId: string, campaignId: string) =>
      request<{ events: AnalyticsEvent[] }>(`/campaigns/${campaignId}/analytics`, { tenantId }),
    recommendations: (tenantId: string) =>
      request<{ recommendations: Recommendation[] }>('/analytics/recommendations', { tenantId }),
  },

  health: {
    check: () => request<{ status: string }>('/health'),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type Product = {
  id: string; tenantId: string; name: string; description: string;
  features: string[]; category: string; targetAudience: string;
  brandGuidelines?: string | null; createdAt: string; updatedAt: string;
};

export type Asset = {
  id: string; tenantId: string; productId?: string | null;
  campaignId?: string | null; kind: string; storageKey: string;
  publicUrl?: string | null; mimeType: string;
  width?: number | null; height?: number | null; createdAt: string;
};

export type Campaign = {
  id: string; tenantId: string; productId: string; name: string;
  status: string; platforms: string[]; publishMode: string;
  scheduledAt?: string | null; createdAt: string; updatedAt: string;
};

export type AgentRun = {
  id: string; campaignId: string; status: string; graphName: string;
  graphVersion: string; currentAgent?: string | null; llmModel: string;
  startedAt?: string | null; finishedAt?: string | null; createdAt: string;
  error?: Record<string, unknown> | null;
};

export type RunEvent = {
  id: string; agentRunId: string; agentName: string;
  eventType: string; payload: Record<string, unknown>; createdAt: string;
};

export type GeneratedPost = {
  id: string; campaignId: string; platform: string; status: string;
  caption: string; hashtags: string[]; callToAction?: string | null;
  approvedBy?: string | null; approvedAt?: string | null;
  createdAt: string; updatedAt: string;
  assets?: {
    asset: {
      id: string;
      kind: string;
      storageKey: string;
      publicUrl: string | null;
      mimeType: string;
      width: number | null;
      height: number | null;
    };
  }[];
};

export type SocialAccount = {
  id: string; tenantId: string; platform: string; accountName: string;
  externalAccountId: string; scopes: string[]; tokenExpiresAt?: string | null;
  createdAt: string; updatedAt: string;
};

export type PublishJob = {
  id: string; postId: string; socialAccountId: string; platform: string;
  status: string; scheduledAt?: string | null; publishedAt?: string | null;
  externalPostId?: string | null; createdAt: string;
};

export type AnalyticsEvent = {
  id: string; platform: string; metricName: string;
  metricValue: number; measuredAt: string;
};

export type Recommendation = {
  id: string; category?: string | null; summary: string;
  evidence: string[]; createdAt: string;
};

export type CreateProductInput = {
  name: string; description: string; features: string[];
  category: string; targetAudience: string; brandGuidelines?: string;
};

export type CreateCampaignInput = {
  productId: string; name: string; platforms: string[]; publishMode: string;
};

export type UpdatePostInput = {
  caption?: string; hashtags?: string[]; callToAction?: string; changeReason: string;
};

export type UpsertAccountInput = {
  platform: string; accountName: string; externalAccountId: string;
  accessToken: string; refreshToken?: string; scopes: string[];
};

export type SchedulePostInput = {
  postId: string; socialAccountId: string; scheduledAt?: string;
};
