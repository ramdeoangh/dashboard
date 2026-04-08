import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapiSpec.js';

const ui = swaggerUi.default ?? swaggerUi;

/**
 * @param {import('express').Express} app
 */
export function mountSwagger(app) {
  app.get('/api/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  app.use(
    '/api/docs',
    ui.serve,
    ui.setup(openApiSpec, {
      customSiteTitle: 'Project Reporting API',
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        docExpansion: 'list',
      },
    })
  );
}
