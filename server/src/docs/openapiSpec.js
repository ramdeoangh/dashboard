/**
 * OpenAPI 3 spec for Swagger UI. Extend paths as needed.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Project Reporting API',
    version: '1.0.0',
    description:
      'Dashboard API. Use **GET /api/health** to verify the server. For protected routes, call **POST /api/auth/login** first, then **Authorize** with the returned `accessToken` (Bearer). Refresh uses the `refreshToken` httpOnly cookie set on login.',
  },
  tags: [
    { name: 'Health', description: 'Liveness / connectivity checks' },
    { name: 'Auth', description: 'Authentication and session' },
    { name: 'Portal', description: 'Portal (requires `projects.view` + Bearer token)' },
    { name: 'Admin', description: 'Admin CRUD (requires permissions + Bearer token)' },
  ],
  servers: [{ url: '/', description: 'This host' }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns 200 when the API process is running. No authentication.',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                  },
                  required: ['ok'],
                },
                example: { ok: true },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        operationId: 'authLogin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Access token and user; refresh token set as cookie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginSuccess' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Uses `refreshToken` cookie from login.',
        operationId: 'authRefresh',
        security: [{ refreshCookie: [] }],
        responses: {
          200: {
            description: 'New access token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshSuccess' },
              },
            },
          },
          401: {
            description: 'Missing or invalid refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        operationId: 'authLogout',
        security: [{ refreshCookie: [] }],
        responses: {
          200: {
            description: 'Logged out',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user and admin nav',
        operationId: 'authMe',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User with roles and adminNav',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeSuccess' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/portal/bootstrap': {
      get: {
        tags: ['Portal'],
        summary: 'Portal branding and layout',
        operationId: 'portalBootstrap',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Portal public settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/portal/states': {
      get: {
        tags: ['Portal'],
        summary: 'List states (portal)',
        operationId: 'portalStates',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'States list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { type: 'object', additionalProperties: true } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Admin dashboard stats',
        description: 'Example admin route; requires `users.view` permission.',
        operationId: 'adminStats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Stats payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste `accessToken` from login response (without "Bearer " prefix is added by Swagger).',
      },
      refreshCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Set automatically after login when using Try it out from the same browser origin.',
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid access token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
      LoginSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      RefreshSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      MeSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
  },
};
