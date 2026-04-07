import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as menuService from '../../services/menuService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const menuBody = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  path: z.string().max(255).optional(),
  icon: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().optional(),
  roleIds: z.array(z.number().int().positive()).optional(),
});

const submenuBody = z.object({
  menu_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  path: z.string().max(255).optional(),
  sort_order: z.number().int().optional(),
  roleIds: z.array(z.number().int().positive()).optional(),
});

router.get(
  '/',
  requirePermission('menus.view'),
  asyncHandler(async (req, res) => {
    const data = await menuService.listMenusWithRoles();
    res.json({ success: true, data });
  })
);

router.post(
  '/',
  requirePermission('menus.edit'),
  validateBody(menuBody),
  asyncHandler(async (req, res) => {
    const id = await menuService.createMenu(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.put(
  '/:id',
  requirePermission('menus.edit'),
  validateParams(idParam),
  validateBody(menuBody),
  asyncHandler(async (req, res) => {
    await menuService.updateMenu(req.validated.params.id, req.validated.body);
    res.json({ success: true });
  })
);

router.delete(
  '/:id',
  requirePermission('menus.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    await menuService.deleteMenu(req.validated.params.id);
    res.json({ success: true });
  })
);

router.post(
  '/submenus',
  requirePermission('menus.edit'),
  validateBody(submenuBody),
  asyncHandler(async (req, res) => {
    const id = await menuService.createSubmenu(req.validated.body);
    res.status(201).json({ success: true, data: { id } });
  })
);

const subIdParam = z.object({ id: z.coerce.number().int().positive() });

const submenuUpdateBody = submenuBody.omit({ menu_id: true });

router.put(
  '/submenus/:id',
  requirePermission('menus.edit'),
  validateParams(subIdParam),
  validateBody(submenuUpdateBody),
  asyncHandler(async (req, res) => {
    await menuService.updateSubmenu(req.validated.params.id, req.validated.body);
    res.json({ success: true });
  })
);

router.delete(
  '/submenus/:id',
  requirePermission('menus.edit'),
  validateParams(subIdParam),
  asyncHandler(async (req, res) => {
    await menuService.deleteSubmenu(req.validated.params.id);
    res.json({ success: true });
  })
);

export default router;
