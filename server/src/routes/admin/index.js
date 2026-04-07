import { Router } from 'express';
import settingsRoutes from './settings.routes.js';
import menusRoutes from './menus.routes.js';
import pagesRoutes from './pages.routes.js';
import statesRoutes from './states.routes.js';
import locationsRoutes from './locations.routes.js';
import projectsRoutes from './projects.routes.js';
import projectCategoriesRoutes from './projectCategories.routes.js';
import usersRoutes from './users.routes.js';
import rolesRoutes from './roles.routes.js';
import statsRoutes from './stats.routes.js';
import applicationLogsRoutes from './applicationLogs.routes.js';

const router = Router();

router.use('/settings', settingsRoutes);
router.use('/application-logs', applicationLogsRoutes);
router.use('/menus', menusRoutes);
router.use('/pages', pagesRoutes);
router.use('/states', statesRoutes);
router.use('/locations', locationsRoutes);
router.use('/projects', projectsRoutes);
router.use('/project-categories', projectCategoriesRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/stats', statsRoutes);

export default router;
