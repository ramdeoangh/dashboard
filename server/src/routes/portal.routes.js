import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateQuery, validateParams } from '../middleware/validate.js';
import * as settingsService from '../services/settingsService.js';
import * as stateService from '../services/stateService.js';
import * as locationService from '../services/locationService.js';
import * as projectService from '../services/projectService.js';
import * as statsService from '../services/statsService.js';
import * as partnerService from '../services/partnerService.js';
import { toPublicUrl } from '../utils/uploadPath.js';
import { requireAuth } from '../middleware/auth.js';
import { actorPartnerId } from '../utils/partnerScope.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/bootstrap',
  asyncHandler(async (req, res) => {
    const portal = await settingsService.getPublicPortalSettings();
    const pid = actorPartnerId(req.auth);
    let headerLogoUrl = toPublicUrl(portal.logoPath);
    if (pid) {
      const p = await partnerService.getPartnerById(pid);
      if (p?.logoUrl) headerLogoUrl = p.logoUrl;
    }
    res.json({
      success: true,
      data: {
        portalName: portal.portalName,
        navTitle: portal.navTitle,
        logoUrl: toPublicUrl(portal.logoPath),
        headerLogoUrl,
        headerHtml: portal.headerHtml,
        footerHtml: portal.footerHtml,
      },
    });
  })
);

router.get(
  '/states',
  asyncHandler(async (req, res) => {
    const rows = await stateService.listStates(true);
    res.json({ success: true, data: rows });
  })
);

const locQuery = z.object({
  stateId: z.coerce.number().int().positive(),
});

router.get(
  '/locations',
  validateQuery(locQuery),
  asyncHandler(async (req, res) => {
    const { stateId } = req.validated.query;
    const rows = await locationService.listByState(stateId, true);
    res.json({ success: true, data: rows });
  })
);

const projQuery = z.object({
  stateId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
});

const projectIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

const photoListQuery = z.object({
  projectId: z.coerce.number().int().positive(),
});

router.get(
  '/project-photo-list',
  validateQuery(photoListQuery),
  asyncHandler(async (req, res) => {
    const { projectId } = req.validated.query;
    const photos = await projectService.getPortalProjectPhotos(projectId, actorPartnerId(req.auth));
    if (photos === null) throw new AppError(404, 'Project not found');
    res.json({ success: true, data: photos });
  })
);

router.get(
  '/projects/:id/photos',
  validateParams(projectIdParam),
  asyncHandler(async (req, res) => {
    const photos = await projectService.getPortalProjectPhotos(req.validated.params.id, actorPartnerId(req.auth));
    if (photos === null) throw new AppError(404, 'Project not found');
    res.json({ success: true, data: photos });
  })
);

router.get(
  '/projects',
  validateQuery(projQuery),
  asyncHandler(async (req, res) => {
    const { stateId, locationId, q } = req.validated.query;
    const rows = await projectService.listProjects({
      stateId,
      locationId,
      q,
      forPortal: true,
      partnerId: actorPartnerId(req.auth),
    });
    res.json({ success: true, data: rows });
  })
);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const data = await statsService.portalStats(actorPartnerId(req.auth));
    res.json({ success: true, data });
  })
);

export default router;
