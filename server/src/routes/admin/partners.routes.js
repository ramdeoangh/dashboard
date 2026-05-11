import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { partnerLogoUpload } from '../../middleware/upload.js';
import { relativeFromMulter } from '../../utils/uploadPath.js';
import * as partnerService from '../../services/partnerService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createBody = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/i, 'Slug may only contain letters, numbers, and hyphens'),
});

const patchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/i, 'Slug may only contain letters, numbers, and hyphens')
    .optional(),
  is_active: z.boolean().optional(),
});

router.get(
  '/',
  requirePermission('partners.view'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query?.all === '1' || req.query?.all === 'true';
    const p = req.auth?.partnerId;
    const scopePartnerId = p != null && Number(p) > 0 ? Number(p) : null;
    const data = await partnerService.listPartners({ includeInactive, scopePartnerId });
    res.json({ success: true, data });
  })
);

router.get(
  '/:id',
  requirePermission('partners.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await partnerService.getPartnerById(req.validated.params.id);
    if (!row) throw new AppError(404, 'Partner not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/',
  requirePermission('partners.edit'),
  validateBody(createBody),
  asyncHandler(async (req, res) => {
    if (req.auth.partnerId) {
      throw new AppError(403, 'Only global administrators can create partners');
    }
    const id = await partnerService.createPartner(req.validated.body, req.auth.userId);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.patch(
  '/:id',
  requirePermission('partners.edit'),
  validateParams(idParam),
  validateBody(patchBody),
  asyncHandler(async (req, res) => {
    if (req.auth.partnerId) {
      throw new AppError(403, 'Only global administrators can update partners');
    }
    const ok = await partnerService.updatePartner(req.validated.params.id, req.validated.body, req.auth.userId);
    if (!ok) throw new AppError(404, 'Partner not found');
    const row = await partnerService.getPartnerById(req.validated.params.id);
    res.json({ success: true, data: row });
  })
);

async function attachPartnerLogoContext(req, res, next) {
  try {
    const id = req.validated?.params?.id ?? Number(req.params.id);
    req.partnerUploadId = id;
    const row = await partnerService.getPartnerById(id);
    if (!row) {
      next(new AppError(404, 'Partner not found'));
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
}

router.post(
  '/:id/logo',
  requirePermission('partners.edit'),
  validateParams(idParam),
  asyncHandler(attachPartnerLogoContext),
  asyncHandler((req, res, next) => {
    partnerLogoUpload.single('logo')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }),
  asyncHandler(async (req, res) => {
    if (req.auth.partnerId) {
      throw new AppError(403, 'Only global administrators can update partner logos');
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const rel = relativeFromMulter(req.file);
    const ok = await partnerService.updatePartnerLogo(req.validated.params.id, rel, req.auth.userId);
    if (!ok) throw new AppError(404, 'Partner not found');
    const row = await partnerService.getPartnerById(req.validated.params.id);
    res.json({ success: true, data: row });
  })
);

export default router;
