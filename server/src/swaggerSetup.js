import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './docs/openapiSpec.js';
import { requireSwaggerAccess } from './middleware/swaggerAccess.js';

const ui = swaggerUi.default ?? swaggerUi;

/**
 * @param {import('express').Express} app
 */
export function mountSwagger(app) {
  app.get('/api/openapi.json', requireSwaggerAccess, (req, res) => {
    res.json(buildOpenApiSpec());
  });

  app.use(
    '/api/docs',
    requireSwaggerAccess,
    ui.serve,
    ui.setup(buildOpenApiSpec(), {
      customSiteTitle: 'Project Reporting API',
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        docExpansion: 'list',
      },
    })
  );
}
