import type { AgentRunStatus, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export type AgentRunCreateData = {
  tenantId: string;
  campaignId: string;
  graphName: string;
  graphVersion: string;
  llmModel: string;
  llmProvider?: string;
  inputSnapshot?: Prisma.InputJsonObject;
};

export type AgentRunUpdateData = Partial<{
  status: AgentRunStatus;
  currentAgent: string | null;
  outputSnapshot: Prisma.InputJsonObject;
  error: Prisma.InputJsonObject;
  startedAt: Date;
  finishedAt: Date;
}>;

const agentRunSelect = {
  id: true,
  tenantId: true,
  campaignId: true,
  status: true,
  graphName: true,
  graphVersion: true,
  currentAgent: true,
  llmProvider: true,
  llmModel: true,
  inputSnapshot: true,
  outputSnapshot: true,
  error: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
} satisfies Prisma.AgentRunSelect;

export type AgentRunRecord = Prisma.AgentRunGetPayload<{ select: typeof agentRunSelect }>;

const agentRunEventSelect = {
  id: true,
  agentRunId: true,
  agentName: true,
  eventType: true,
  payload: true,
  createdAt: true,
} satisfies Prisma.AgentRunEventSelect;

export type AgentRunEventRecord = Prisma.AgentRunEventGetPayload<{ select: typeof agentRunEventSelect }>;

export class AgentRunRepository {
  public create(data: AgentRunCreateData): Promise<AgentRunRecord> {
    return prisma.agentRun.create({
      data: {
        tenantId: data.tenantId,
        campaignId: data.campaignId,
        graphName: data.graphName,
        graphVersion: data.graphVersion,
        llmModel: data.llmModel,
        llmProvider: data.llmProvider ?? 'gemini',
        inputSnapshot: data.inputSnapshot ?? {},
      },
      select: agentRunSelect,
    });
  }

  public list(campaignId: string): Promise<AgentRunRecord[]> {
    return prisma.agentRun.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: agentRunSelect,
    });
  }

  public findById(tenantId: string, runId: string): Promise<AgentRunRecord | null> {
    return prisma.agentRun.findFirst({
      where: { id: runId, tenantId },
      select: agentRunSelect,
    });
  }

  public update(runId: string, data: AgentRunUpdateData): Promise<AgentRunRecord> {
    const updateData: Prisma.AgentRunUpdateInput = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.currentAgent !== undefined) updateData.currentAgent = data.currentAgent;
    if (data.outputSnapshot !== undefined) updateData.outputSnapshot = data.outputSnapshot;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
    if (data.finishedAt !== undefined) updateData.finishedAt = data.finishedAt;

    return prisma.agentRun.update({
      where: { id: runId },
      data: updateData,
      select: agentRunSelect,
    });
  }

  public appendEvent(data: {
    agentRunId: string;
    agentName: string;
    eventType: string;
    payload?: Prisma.InputJsonObject;
  }): Promise<AgentRunEventRecord> {
    return prisma.agentRunEvent.create({
      data: {
        agentRunId: data.agentRunId,
        agentName: data.agentName,
        eventType: data.eventType,
        payload: data.payload ?? {},
      },
      select: agentRunEventSelect,
    });
  }

  public listEvents(agentRunId: string): Promise<AgentRunEventRecord[]> {
    return prisma.agentRunEvent.findMany({
      where: { agentRunId },
      orderBy: { createdAt: 'asc' },
      select: agentRunEventSelect,
    });
  }
}
