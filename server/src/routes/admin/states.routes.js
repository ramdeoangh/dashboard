import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as stateService from '../../services/stateService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const body = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(20),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

router.get(
  '/',
  requirePermission('states.view'),
  asyncHandler(async (req, res) => {
    const data = await stateService.listStates(false);
    res.json({ success: true, data });
  })
);

router.post(
  '/',
  requirePermission('states.edit'),
  validateBody(body),
  asyncHandler(async (req, res) => {
    const id = await stateService.createState(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('states.edit'),
  validateParams(idParam),
  validateBody(body),
  asyncHandler(async (req, res) => {
    await stateService.updateState(req.validated.params.id, req.validated.body);
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('states.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    await stateService.deleteState(req.validated.params.id);
    res.json({ success: true });
  })
);

export default router;
