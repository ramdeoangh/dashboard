import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import * as statsService from '../../services/statsService.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const data = await statsService.adminStats();
    res.json({ success: true, data });
  })
);

export default router;
