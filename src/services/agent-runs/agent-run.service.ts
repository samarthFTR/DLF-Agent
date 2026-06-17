import { Prisma } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import type { RequestContext } from '../../types/request-context.js';
import { AgentRunRepository } from './agent-run.repository.js';
import { CampaignRepository } from '../campaigns/campaign.repository.js';

// Graph metadata kept minimal for now — will be filled by the orchestrator in Phase 2.3+
const GRAPH_NAME = 'marketing-pipeline';
const GRAPH_VERSION = '0.1.0';
const DEFAULT_LLM_MODEL = 'gemini-1.5-pro';

export class AgentRunService {
  public constructor(
    private readonly runs = new AgentRunRepository(),
    private readonly campaigns = new CampaignRepository(),
  ) {}

  /** Create and queue a new agent run for a campaign. */
  public async createRun(context: RequestContext, campaignId: string) {
    const campaign = await this.campaigns.findById(context.tenantId, campaignId);

    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }

    const run = await this.runs.create({
      tenantId: context.tenantId,
      campaignId,
      graphName: GRAPH_NAME,
      graphVersion: GRAPH_VERSION,
      llmModel: DEFAULT_LLM_MODEL,
      inputSnapshot: {
        campaignId,
        productId: campaign.productId,
        platforms: campaign.platforms as string[],
      },
    });

    // Emit an initial queued event
    await this.runs.appendEvent({
      agentRunId: run.id,
      agentName: 'orchestrator',
      eventType: 'run.queued',
      payload: { graphName: GRAPH_NAME, graphVersion: GRAPH_VERSION },
    });

    return run;
  }

  /** List all runs for a given campaign. */
  public async listRuns(context: RequestContext, campaignId: string) {
    const campaign = await this.campaigns.findById(context.tenantId, campaignId);

    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }

    return this.runs.list(campaignId);
  }

  /** Get a single run by ID. */
  public async getRun(context: RequestContext, runId: string) {
    const run = await this.runs.findById(context.tenantId, runId);

    if (!run) {
      throw new AppError(404, 'NOT_FOUND', 'Agent run not found');
    }

    return run;
  }

  /** Get all events for a run. */
  public async getRunEvents(context: RequestContext, runId: string) {
    const run = await this.runs.findById(context.tenantId, runId);

    if (!run) {
      throw new AppError(404, 'NOT_FOUND', 'Agent run not found');
    }

    return this.runs.listEvents(runId);
  }

  /** Cancel a queued or running agent run. */
  public async cancelRun(context: RequestContext, runId: string) {
    const run = await this.runs.findById(context.tenantId, runId);

    if (!run) {
      throw new AppError(404, 'NOT_FOUND', 'Agent run not found');
    }

    const terminalStatuses = ['SUCCEEDED', 'FAILED', 'CANCELLED'] as const;

    if (terminalStatuses.includes(run.status as typeof terminalStatuses[number])) {
      throw new AppError(
        409,
        'CONFLICT',
        `Agent run is already in a terminal state: ${run.status}`,
      );
    }

    try {
      const cancelled = await this.runs.update(runId, {
        status: 'CANCELLED',
        finishedAt: new Date(),
      });

      await this.runs.appendEvent({
        agentRunId: runId,
        agentName: 'orchestrator',
        eventType: 'run.cancelled',
        payload: { cancelledBy: context.userId ?? 'system' },
      });

      return cancelled;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError(404, 'NOT_FOUND', 'Agent run not found');
      }
      throw error;
    }
  }
}
