import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validateBody } from '../../middleware/validate.js';
import * as settingsService from '../../services/settingsService.js';
import { logoUpload } from '../../middleware/upload.js';
import { relativeFromMulter } from '../../utils/uploadPath.js';

const router = Router();
router.use(requireAuth);

const patchSchema = z
  .object({
    'portal.name': z.string().max(200).optional(),
    'portal.header_html': z.string().max(50000).optional(),
    'portal.footer_html': z.string().max(50000).optional(),
    'email.smtp_host': z.string().max(255).optional(),
    'email.smtp_port': z.string().max(10).optional(),
    'email.smtp_user': z.string().max(255).optional(),
    'email.smtp_secure': z.union([z.boolean(), z.string()]).optional(),
    'email.from_address': z.string().max(255).optional(),
    'email.smtp_pass': z.string().max(255).optional(),
  })
  .strict();

router.get(
  '/',
  requirePermission('settings.view'),
  asyncHandler(async (req, res) => {
    const data = await settingsService.getAllSettings();
    res.json({ success: true, data });
  })
);

router.patch(
  '/',
  requirePermission('settings.edit'),
  validateBody(patchSchema),
  asyncHandler(async (req, res) => {
    const data = await settingsService.updateSettings(req.validated.body);
    res.json({ success: true, data });
  })
);

router.post(
  '/logo',
  requirePermission('settings.edit'),
  logoUpload.single('logo'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const rel = relativeFromMulter(req.file);
    await settingsService.setLogoPath(rel);
    res.json({ success: true, data: { logoPath: rel } });
  })
);

export default router;
