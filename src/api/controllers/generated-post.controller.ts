import type { Request, Response } from 'express';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { getRouteParam } from '../request-params.js';
import { GeneratedPostService } from '../../services/generated-posts/generated-post.service.js';

const postService = new GeneratedPostService();

export async function listPosts(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const posts = await postService.listPosts(context, getRouteParam(req, 'campaignId'));
  res.status(200).json({ posts });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const post = await postService.getPost(context, getRouteParam(req, 'postId'));
  res.status(200).json({ post });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const post = await postService.updatePost(
    context,
    getRouteParam(req, 'postId'),
    req.body as { caption?: string; hashtags?: string[]; callToAction?: string; changeReason: string },
  );
  res.status(200).json({ post });
}

export async function approvePost(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const post = await postService.approvePost(context, getRouteParam(req, 'postId'));
  res.status(200).json({ post });
}
