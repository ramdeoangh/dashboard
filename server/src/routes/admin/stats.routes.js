import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import * as statsService from '../../services/statsService.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('projects.view'),
  asyncHandler(async (req, res) => {
    const p = req.auth?.partnerId;
    const partnerId = p != null && Number(p) > 0 ? Number(p) : null;
    const data = await statsService.adminStats(partnerId);
    res.json({ success: true, data });
  })
);

export default router;
