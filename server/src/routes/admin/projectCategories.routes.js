import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as projectCategoryService from '../../services/projectCategoryService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createBody = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

const patchBody = z.object({
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  status: z.boolean().optional(),
});

const listQuery = z.object({
  includeInactive: z.string().optional(),
}).transform((d) => ({
  includeInactive: d.includeInactive === '1' || d.includeInactive === 'true',
}));

router.get(
  '/',
  requirePermission('categories.view'),
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const data = await projectCategoryService.listCategories({
      includeInactive: req.validated.query.includeInactive,
    });
    res.json({ success: true, data });
  })
);

router.get(
  '/:id',
  requirePermission('categories.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await projectCategoryService.getCategoryById(req.validated.params.id);
    if (!row) throw new AppError(404, 'Category not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/',
  requirePermission('categories.edit'),
  validateBody(createBody),
  asyncHandler(async (req, res) => {
    const id = await projectCategoryService.createCategory(req.validated.body, req.auth.userId);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.patch(
  '/:id',
  requirePermission('categories.edit'),
  validateParams(idParam),
  validateBody(patchBody),
  asyncHandler(async (req, res) => {
    const row = await projectCategoryService.updateCategory(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId
    );
    if (!row) throw new AppError(404, 'Category not found');
    res.json({ success: true, data: row });
  })
);

router.delete(
  '/:id',
  requirePermission('categories.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const ok = await projectCategoryService.deleteCategory(req.validated.params.id, req.auth.userId);
    if (!ok) throw new AppError(404, 'Category not found');
    res.json({ success: true });
  })
);

export default router;
