import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as pageService from '../../services/pageService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const body = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/),
  content: z.string().max(100000).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

router.get(
  '/',
  requirePermission('pages.view'),
  asyncHandler(async (req, res) => {
    const data = await pageService.listPages();
    res.json({ success: true, data });
  })
);

router.post(
  '/',
  requirePermission('pages.edit'),
  validateBody(body),
  asyncHandler(async (req, res) => {
    const id = await pageService.createPage(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('pages.edit'),
  validateParams(idParam),
  validateBody(body),
  asyncHandler(async (req, res) => {
    await pageService.updatePage(req.validated.params.id, req.validated.body);
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('pages.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    await pageService.deletePage(req.validated.params.id);
    res.json({ success: true });
  })
);

export default router;
