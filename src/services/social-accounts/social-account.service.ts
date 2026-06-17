import { prisma } from '../../database/prisma.js';
import { AppError } from '../../utils/errors.js';
import { encryptToken } from '../../utils/token-encryption.js';
import type { RequestContext } from '../../types/request-context.js';

export class SocialAccountService {
  public list(context: RequestContext) {
    return prisma.socialAccount.findMany({
      where: { tenantId: context.tenantId },
      select: {
        id: true, tenantId: true, platform: true, accountName: true,
        externalAccountId: true, scopes: true, tokenExpiresAt: true,
        createdAt: true, updatedAt: true,
        // Never expose encrypted tokens
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Upsert a social account with encrypted OAuth tokens.
   * Called after OAuth callback flow completes.
   */
  public async upsertAccount(
    context: RequestContext,
    input: {
      platform: string;
      accountName: string;
      externalAccountId: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt?: string;
      scopes: string[];
    },
  ) {
    const encryptedAccessToken = encryptToken(input.accessToken);
    const encryptedRefreshToken = input.refreshToken
      ? encryptToken(input.refreshToken)
      : null;

    return prisma.socialAccount.upsert({
      where: {
        tenantId_platform_externalAccountId: {
          tenantId: context.tenantId,
          platform: input.platform as never,
          externalAccountId: input.externalAccountId,
        },
      },
      create: {
        tenantId: context.tenantId,
        platform: input.platform as never,
        accountName: input.accountName,
        externalAccountId: input.externalAccountId,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
        scopes: input.scopes,
      },
      update: {
        accountName: input.accountName,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
        scopes: input.scopes,
      },
      select: {
        id: true, platform: true, accountName: true, externalAccountId: true,
        scopes: true, tokenExpiresAt: true, createdAt: true,
      },
    });
  }

  public async deleteAccount(context: RequestContext, accountId: string): Promise<void> {
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, tenantId: context.tenantId },
    });
    if (!account) throw new AppError(404, 'NOT_FOUND', 'Social account not found');
    await prisma.socialAccount.delete({ where: { id: accountId } });
  }
}
