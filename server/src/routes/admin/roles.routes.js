import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as roleService from '../../services/roleService.js';
import * as menuService from '../../services/menuService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const roleBody = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean(),
});

const permBody = z.object({
  permission_ids: z.array(z.number().int().positive()),
});

const menuAccessBody = z.object({
  menuIds: z.array(z.number().int().positive()),
  submenuIds: z.array(z.number().int().positive()),
});

router.get(
  '/permissions',
  requirePermission('roles.view'),
  asyncHandler(async (req, res) => {
    const data = await roleService.listPermissions();
    res.json({ success: true, data });
  })
);

router.get(
  '/',
  requirePermission('roles.view'),
  asyncHandler(async (req, res) => {
    const data = await roleService.listRoles();
    res.json({ success: true, data });
  })
);

router.get(
  '/:id/menu-access',
  requirePermission('roles.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const existing = await roleService.getRoleById(req.validated.params.id);
    if (!existing) throw new AppError(404, 'Role not found');
    const data = await menuService.getRoleMenuAccess(req.validated.params.id);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id/menu-access',
  requirePermission('roles.edit'),
  validateParams(idParam),
  validateBody(menuAccessBody),
  asyncHandler(async (req, res) => {
    const id = req.validated.params.id;
    const existing = await roleService.getRoleById(id);
    if (!existing) throw new AppError(404, 'Role not found');
    await menuService.setRoleMenuAccess(id, req.validated.body);
    res.json({ success: true });
  })
);

router.get(
  '/:id',
  requirePermission('roles.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await roleService.getRoleById(req.validated.params.id);
    if (!row) throw new AppError(404, 'Role not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/',
  requirePermission('roles.edit'),
  validateBody(roleBody),
  asyncHandler(async (req, res) => {
    const id = await roleService.createRole(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('roles.edit'),
  validateParams(idParam),
  validateBody(roleBody),
  asyncHandler(async (req, res) => {
    const ok = await roleService.updateRole(req.validated.params.id, req.validated.body);
    if (!ok) throw new AppError(404, 'Role not found');
    res.json({ success: true });
  })
);

router.put(
  '/:id/permissions',
  requirePermission('roles.edit'),
  validateParams(idParam),
  validateBody(permBody),
  asyncHandler(async (req, res) => {
    const id = req.validated.params.id;
    const existing = await roleService.getRoleById(id);
    if (!existing) throw new AppError(404, 'Role not found');
    await roleService.setRolePermissions(id, req.validated.body.permission_ids);
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('roles.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.validated.params.id);
    res.json({ success: true });
  })
);

export default router;
