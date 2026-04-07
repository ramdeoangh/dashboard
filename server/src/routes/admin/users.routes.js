import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as userService from '../../services/userService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createBody = z.object({
  email: z.string().email().max(255),
  username: z.string().min(2).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(200),
  display_name: z.string().max(255).optional(),
  is_active: z.boolean().optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
});

const updateBody = z.object({
  email: z.string().email().max(255),
  username: z.string().min(2).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  display_name: z.string().max(255).optional(),
  is_active: z.boolean().optional(),
  password: z.union([z.string().min(8).max(200), z.literal('')]).optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
});

router.get(
  '/',
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const data = await userService.listUsers();
    res.json({ success: true, data });
  })
);

router.get(
  '/:id',
  requirePermission('users.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await userService.getUserById(req.validated.params.id);
    if (!row) throw new AppError(404, 'User not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/',
  requirePermission('users.create'),
  validateBody(createBody),
  asyncHandler(async (req, res) => {
    const id = await userService.createUser(req.validated.body, req.auth.userId);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('users.edit'),
  validateParams(idParam),
  validateBody(updateBody),
  asyncHandler(async (req, res) => {
    const body = { ...req.validated.body };
    if (body.password === '') delete body.password;
    const ok = await userService.updateUser(req.validated.params.id, body);
    if (!ok) throw new AppError(404, 'User not found');
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('users.delete'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const id = req.validated.params.id;
    if (id === req.auth.userId) {
      throw new AppError(400, 'Cannot delete your own account');
    }
    const ok = await userService.deleteUser(id);
    if (!ok) throw new AppError(404, 'User not found');
    res.json({ success: true });
  })
);

export default router;
