import { validateCaptions } from '../caption-generation/caption-validator.js';
import { PLATFORM_CONSTRAINTS } from '../../integrations/llm/platform-constraints.js';
import type { MarketingGraphState } from '../graphs/marketing-pipeline.state.js';
import { logger } from '../../utils/logger.js';

/**
 * quality_gate node — validates the assembled state before persisting generated content.
 * Returns qualityCheckPassed = false if any critical issue is found.
 */
export async function qualityGateNode(
  state: MarketingGraphState,
): Promise<Partial<MarketingGraphState>> {
  logger.info({ campaignId: state.campaignId }, 'Node: quality_gate');

  const findings: string[] = [];

  // 1. Check required agent outputs exist
  if (!state.productAnalysis) findings.push('Missing product analysis output');
  if (!state.creativeStrategy) findings.push('Missing creative strategy output');
  if (!state.captions || state.captions.length === 0) findings.push('No captions generated');

  // 2. Validate caption platform limits
  if (state.captions) {
    const captionErrors = validateCaptions(state.captions);
    for (const e of captionErrors) {
      findings.push(`Caption [${e.platform}] ${e.field}: ${e.message}`);
    }
  }

  // 3. Check each requested platform has a caption
  for (const platform of state.platforms) {
    const hasCaption = state.captions?.some((c) => c.platform === platform);
    if (!hasCaption) {
      findings.push(`Missing caption for platform: ${platform}`);
    }
  }

  // 4. Check sensitive claims
  const claims = state.productAnalysis?.sensitiveClaims ?? [];
  if (claims.length > 0) {
    findings.push(`Sensitive claims flagged for review: ${claims.join(', ')}`);
  }

  const passed = !findings.some((f) =>
    // Only fail on structural problems — sensitive claims are warnings, not blocks
    !f.startsWith('Sensitive claims'),
  );

  logger.info({ passed, findings }, 'Quality gate result');

  return {
    qualityCheckPassed: passed,
    qualityCheckFindings: findings,
  };
}
