import type { Request, Response } from 'express';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { getRouteParam } from '../request-params.js';
import { ProductService } from '../../services/products/product.service.js';
import type { CreateProductInput, UpdateProductInput } from '../../services/products/product.schemas.js';

const productService = new ProductService();

export async function createProduct(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const product = await productService.createProduct(context, req.body as CreateProductInput);
  res.status(201).json({ product });
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const products = await productService.listProducts(context);
  res.status(200).json({ products });
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const product = await productService.getProduct(context, getRouteParam(req, 'productId'));
  res.status(200).json({ product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const product = await productService.updateProduct(
    context,
    getRouteParam(req, 'productId'),
    req.body as UpdateProductInput,
  );
  res.status(200).json({ product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  await productService.deleteProduct(context, getRouteParam(req, 'productId'));
  res.status(204).send();
}
