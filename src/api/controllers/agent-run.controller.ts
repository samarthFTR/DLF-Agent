import type { Request, Response } from 'express';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { getRouteParam } from '../request-params.js';
import { AgentRunService } from '../../services/agent-runs/agent-run.service.js';

const agentRunService = new AgentRunService();

export async function createAgentRun(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const run = await agentRunService.createRun(context, getRouteParam(req, 'campaignId'));
  res.status(202).json({ run });
}

export async function listAgentRuns(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const runs = await agentRunService.listRuns(context, getRouteParam(req, 'campaignId'));
  res.status(200).json({ runs });
}

export async function getAgentRun(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const run = await agentRunService.getRun(context, getRouteParam(req, 'runId'));
  res.status(200).json({ run });
}

export async function getAgentRunEvents(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const events = await agentRunService.getRunEvents(context, getRouteParam(req, 'runId'));
  res.status(200).json({ events });
}

export async function cancelAgentRun(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const run = await agentRunService.cancelRun(context, getRouteParam(req, 'runId'));
  res.status(200).json({ run });
}
