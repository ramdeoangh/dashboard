import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { createProjectImageUploader } from '../../middleware/upload.js';
import * as projectService from '../../services/projectService.js';
import { relativeFromMulter } from '../../utils/uploadPath.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

const photoIdParam = z.object({
  id: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive(),
});

const indianMobile = z
  .string()
  .transform((s) => s.replace(/\s/g, '').replace(/^\+91/, ''))
  .refine((s) => /^[6-9]\d{9}$/.test(s), 'Invalid Indian mobile number (10 digits starting 6-9)');

const indianPin = z
  .string()
  .refine((s) => /^[1-9]\d{5}$/.test(String(s).trim()), 'Invalid PIN code (6 digits)');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const step1Body = z
  .object({
    project_name: z.string().min(1).max(255),
    procurement_name: z.string().max(255).default(''),
    address: z.string().min(1).max(5000),
    beneficiary_details: z.string().min(1).max(10000),
    description: z.string().min(1).max(10000),
    city: z.string().min(1).max(150),
    pincode: indianPin,
    procurement_type: z.string().min(1).max(150),
    contact_number: indianMobile,
    start_date: isoDate,
    end_date: isoDate,
    state_id: z.number().int().positive(),
    location_id: z.number().int().positive(),
    category_id: z.number().int().positive(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  });

const patchBody = z.object({
  project_name: z.string().min(1).max(255).optional(),
  procurement_name: z.string().max(255).optional(),
  address: z.string().min(1).max(5000).optional(),
  beneficiary_details: z.string().min(1).max(10000).optional(),
  description: z.string().min(1).max(10000).optional(),
  city: z.string().min(1).max(150).optional(),
  pincode: z.string().max(20).optional(),
  procurement_type: z.string().max(150).optional(),
  contact_number: z.string().max(50).optional(),
  start_date: isoDate.optional(),
  end_date: isoDate.optional(),
  state_id: z.number().int().positive().optional(),
  location_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  workflow_status: z.enum(['in_progress', 'completed', 'blocked']).optional(),
  block_reason: z.string().max(10000).optional().nullable(),
});

const approvalBody = z.object({
  is_approved: z.boolean(),
  approval_comment: z.string().max(5000).optional().nullable(),
});

const listQuery = z
  .object({
    stateId: z.coerce.number().int().positive().optional(),
    locationId: z.coerce.number().int().positive().optional(),
    q: z.string().max(200).optional(),
    includeInactive: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    includeInactive: data.includeInactive === '1' || data.includeInactive === 'true',
  }));

const pendingListQuery = z.object({
  stateId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
});

const upload = createProjectImageUploader();

async function attachProjectPhotoFolder(req, res, next) {
  try {
    const id = req.validated?.params?.id ?? Number(req.params.id);
    const key = await projectService.getProjectPhotoFolderKey(id);
    if (!key) {
      next(new AppError(404, 'Project not found'));
      return;
    }
    req.projectPhotoFolderKey = key;
    next();
  } catch (e) {
    next(e);
  }
}

router.get(
  '/',
  requirePermission('projects.view'),
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const { stateId, locationId, q, includeInactive } = req.validated.query;
    const data = await projectService.listProjects({ stateId, locationId, q, includeInactive });
    res.json({ success: true, data });
  })
);

router.get(
  '/pending-approval',
  requirePermission('projects.approve'),
  validateQuery(pendingListQuery),
  asyncHandler(async (req, res) => {
    const { stateId, locationId, q } = req.validated.query;
    const data = await projectService.listPendingApproval({ stateId, locationId, q });
    res.json({ success: true, data });
  })
);

router.get(
  '/:id/photos',
  requirePermission('projects.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await projectService.getProjectById(req.validated.params.id);
    if (!row) throw new AppError(404, 'Project not found');
    const data = await projectService.listProjectPhotos(req.validated.params.id);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id/photos/:photoId',
  requirePermission('projects.edit'),
  validateParams(photoIdParam),
  asyncHandler(async (req, res) => {
    const { id, photoId } = req.validated.params;
    const p = await projectService.getProjectById(id);
    if (!p) throw new AppError(404, 'Project not found');
    const ok = await projectService.deleteProjectPhoto(id, photoId, req.auth.userId);
    if (!ok) throw new AppError(404, 'Photo not found');
    res.json({ success: true });
  })
);

router.post(
  '/:id/photos',
  requirePermission('projects.edit'),
  validateParams(idParam),
  asyncHandler(attachProjectPhotoFolder),
  asyncHandler((req, res, next) => {
    upload.fields([
      { name: 'beforePhotos', maxCount: 12 },
      { name: 'afterPhotos', maxCount: 12 },
    ])(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }),
  asyncHandler(async (req, res) => {
    const id = req.validated.params.id;
    const existing = await projectService.getProjectById(id);
    if (!existing) throw new AppError(404, 'Project not found');
    if (existing.status === 0) throw new AppError(400, 'Project is deleted');
    const files = req.files || {};
    const before = files.beforePhotos || [];
    const after = files.afterPhotos || [];
    if (!before.length && !after.length) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }
    if (before.length) {
      const entries = before.map((f) => ({
        file_path: relativeFromMulter(f),
        original_name: f.originalname,
      }));
      await projectService.addProjectPhotoRows(id, 'before', entries, req.auth.userId);
    }
    if (after.length) {
      const entries = after.map((f) => ({
        file_path: relativeFromMulter(f),
        original_name: f.originalname,
      }));
      await projectService.addProjectPhotoRows(id, 'after', entries, req.auth.userId);
    }
    const row = await projectService.getProjectById(id);
    res.json({ success: true, data: row });
  })
);

router.get(
  '/:id',
  requirePermission('projects.view'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await projectService.getProjectById(req.validated.params.id, { withPhotos: true });
    if (!row) throw new AppError(404, 'Project not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/',
  requirePermission('projects.create'),
  validateBody(step1Body),
  asyncHandler(async (req, res) => {
    const id = await projectService.createProject(req.validated.body, req.auth.userId);
    res.status(201).json({ success: true, data: { id } });
  })
);

router.patch(
  '/:id',
  requirePermission('projects.edit'),
  validateParams(idParam),
  validateBody(patchBody),
  asyncHandler(async (req, res) => {
    const row = await projectService.updateProject(req.validated.params.id, req.validated.body, req.auth.userId);
    if (!row) throw new AppError(404, 'Project not found');
    res.json({ success: true, data: row });
  })
);

router.post(
  '/:id/submit',
  requirePermission('projects.edit'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const row = await projectService.submitProject(req.validated.params.id, req.auth.userId);
    res.json({ success: true, data: row });
  })
);

router.patch(
  '/:id/approval',
  requirePermission('projects.approve'),
  validateParams(idParam),
  validateBody(approvalBody),
  asyncHandler(async (req, res) => {
    const row = await projectService.updateApproval(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId
    );
    res.json({ success: true, data: row });
  })
);

router.put(
  '/:id/photos',
  requirePermission('projects.edit'),
  validateParams(idParam),
  asyncHandler(attachProjectPhotoFolder),
  asyncHandler((req, res, next) => {
    upload.fields([
      { name: 'oldPhoto', maxCount: 1 },
      { name: 'newPhoto', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }),
  asyncHandler(async (req, res) => {
    const id = req.validated.params.id;
    const existing = await projectService.getProjectById(id);
    if (!existing) throw new AppError(404, 'Project not found');
    if (existing.status === 0) throw new AppError(400, 'Project is deleted');
    const files = req.files || {};
    const oldF = files.oldPhoto?.[0];
    const newF = files.newPhoto?.[0];
    if (!oldF && !newF) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }
    const patch = {};
    if (oldF) patch.old_photo_path = relativeFromMulter(oldF);
    if (newF) patch.new_photo_path = relativeFromMulter(newF);
    const row = await projectService.setProjectPhotoPaths(id, patch, req.auth.userId);
    res.json({ success: true, data: row });
  })
);

router.delete(
  '/:id',
  requirePermission('projects.delete'),
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const ok = await projectService.softDeleteProject(req.validated.params.id, req.auth.userId);
    if (!ok) throw new AppError(404, 'Project not found');
    res.json({ success: true });
  })
);

export default router;
