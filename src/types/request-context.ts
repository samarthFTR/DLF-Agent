export type RequestContext = {
  tenantId: string;
  userId?: string;
  role?: 'admin' | 'member';
};

