export const prismaMock = {
  product: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  asset: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
  campaign: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  agentRun: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  agentRunEvent: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
  $on: vi.fn(),
};

import { vi } from 'vitest';


