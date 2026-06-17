/**
 * Social publishing adapter interface.
 * Each platform implements this contract. Stub implementations return a fake external post ID.
 */
export type PublishPostPayload = {
  caption: string;
  hashtags: string[];
  callToAction?: string | null;
  accessToken: string;
  externalAccountId: string;
  assetUrls?: string[];
};

export type PublishResult = {
  externalPostId: string;
  publishedAt: Date;
};

export interface SocialAdapter {
  publishPost(payload: PublishPostPayload): Promise<PublishResult>;
}

// ── Stub Adapters ─────────────────────────────────────────────────────────────

function makeStubAdapter(platform: string): SocialAdapter {
  return {
    async publishPost(payload) {
      // Stub: log and return a fake ID — replace with real API call later
      const externalPostId = `stub_${platform}_${Date.now()}`;
      return { externalPostId, publishedAt: new Date() };
    },
  };
}

export const socialAdapters: Record<string, SocialAdapter> = {
  INSTAGRAM: makeStubAdapter('instagram'),
  LINKEDIN: makeStubAdapter('linkedin'),
  FACEBOOK: makeStubAdapter('facebook'),
  X: makeStubAdapter('x'),
};
