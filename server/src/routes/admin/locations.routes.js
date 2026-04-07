import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as locationService from '../../services/locationService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const body = z.object({
  state_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  code: z.string().max(50).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

router.get(
  '/',
  requirePermission('states.view'),
  asyncHandler(async (req, res) => {
    const data = await locationService.listAll();
    res.json({ success: true, data });
  })
);

router.post(
  '/',
  requirePermission('states.edit'),
  validateBody(body),
  asyncHandler(async (req, res) => {
    const id = await locationService.createLocation(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('states.edit'),
  validateParams(idParam),
  validateBody(body),
  asyncHandler(async (req, res) => {
    await locationService.updateLocation(req.validated.params.id, req.validated.body);
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('states.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    await locationService.deleteLocation(req.validated.params.id);
    res.json({ success: true });
  })
);

export default router;
