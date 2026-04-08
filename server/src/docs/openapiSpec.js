import { env } from '../config/env.js';

const paths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Process health',
      description: 'Returns 200 when the API process is running. No authentication.',
      operationId: 'getHealth',
      responses: {
        200: {
          description: 'Service is up',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { ok: { type: 'boolean', example: true } },
                required: ['ok'],
              },
              example: { ok: true },
            },
          },
        },
      },
    },
  },
  '/api/health/db': {
    get: {
      tags: ['Health'],
      summary: 'Database health',
      description:
        'Runs `SELECT 1` against MySQL. No authentication. Returns 503 if the database is unreachable.',
      operationId: 'getHealthDb',
      responses: {
        200: {
          description: 'Database connection OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: true },
                  database: { type: 'string', example: 'connected' },
                },
                required: ['ok', 'database'],
              },
              example: { ok: true, database: 'connected' },
            },
          },
        },
        503: {
          description: 'Database unavailable',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: false },
                  database: { type: 'string', example: 'unavailable' },
                  error: { type: 'string' },
                },
              },
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
};

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Paste `accessToken` from login response (Swagger adds the Bearer prefix).',
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
};

function buildServers() {
  const servers = [];
  if (env.publicApiUrl) {
    servers.push({
      url: env.publicApiUrl,
      description: 'PUBLIC_API_URL (configured API base)',
    });
  }
  servers.push({
    url: '/',
    description:
      'Same origin as this server — use when the browser address matches the API (e.g. local or single-host deploy)',
  });
  return servers;
}

export function buildOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Project Reporting API',
      version: '1.0.0',
      description:
        '**Health** (`GET /api/health`, `GET /api/health/db`) is public. In **production**, opening **/api/docs** or **/api/openapi.json** requires `Authorization: Bearer <accessToken>` from **POST /api/auth/login**, or header **X-API-Docs-Token** if `SWAGGER_DOCS_TOKEN` is set in the server environment. Development keeps docs open without that gate. For protected JSON routes, authorize with Bearer after login.',
    },
    tags: [
      { name: 'Health', description: 'Liveness and database connectivity (no auth)' },
      { name: 'Auth', description: 'Authentication and session' },
      { name: 'Portal', description: 'Portal (requires `projects.view` + Bearer token)' },
      { name: 'Admin', description: 'Admin CRUD (requires permissions + Bearer token)' },
    ],
    servers: buildServers(),
    paths,
    components,
  };
}
