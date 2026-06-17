import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

export type StoredFile = {
  storageKey: string;
  publicUrl: string;
};

export class LocalStorage {
  public async saveBuffer(storageKey: string, buffer: Buffer): Promise<StoredFile> {
    const absolutePath = this.resolveStorageKey(storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      storageKey,
      publicUrl: `${env.PUBLIC_ASSET_BASE_URL}/${storageKey.replaceAll('\\', '/')}`,
    };
  }

  public async delete(storageKey: string): Promise<void> {
    const absolutePath = this.resolveStorageKey(storageKey);
    await rm(absolutePath, { force: true });
  }

  private resolveStorageKey(storageKey: string): string {
    const storageRoot = path.resolve(env.LOCAL_STORAGE_ROOT);
    const absolutePath = path.resolve(storageRoot, storageKey);

    if (!absolutePath.startsWith(storageRoot)) {
      throw new Error('Invalid storage key');
    }

    return absolutePath;
  }
}

