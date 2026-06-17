import type { Request, Response } from 'express';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { getRouteParam } from '../request-params.js';
import { AssetService } from '../../services/assets/asset.service.js';

const assetService = new AssetService();

export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const asset = await assetService.uploadProductImage(context, {
    productId: getRouteParam(req, 'productId'),
    file: req.file,
  });
  res.status(201).json({ asset });
}

export async function listProductImages(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const assets = await assetService.listProductImages(context, getRouteParam(req, 'productId'));
  res.status(200).json({ assets });
}

export async function getAsset(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const asset = await assetService.getAsset(context, getRouteParam(req, 'assetId'));
  res.status(200).json({ asset });
}

export async function deleteAsset(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  await assetService.deleteAsset(context, getRouteParam(req, 'assetId'));
  res.status(204).send();
}
