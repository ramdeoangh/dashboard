import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import * as applicationLogService from '../../services/applicationLogService.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('settings.view'),
  asyncHandler(async (req, res) => {
    const data = await applicationLogService.listApplicationErrorLogs({
      page: req.query.page,
      pageSize: req.query.pageSize,
      q: req.query.q,
      from: req.query.from,
      to: req.query.to,
    });
    res.json({ success: true, data });
  })
);

export default router;
