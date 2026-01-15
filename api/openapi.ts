import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';

const openapi = new Hono();

const spec = {
    openapi: '3.0.3',
    info: {
        title: 'Hemmelig API',
        description:
            'API for Hemmelig - a secure secret sharing application. All encryption/decryption happens client-side.',
        version: '1.0.0',
        contact: {
            name: 'Hemmelig',
            url: 'https://github.com/HemmeligOrg/Hemmelig.app',
        },
    },
    servers: [
        {
            url: '/api',
            description: 'API server',
        },
    ],
    tags: [
        { name: 'Secrets', description: 'Secret management endpoints' },
        { name: 'Secret Requests', description: 'Request secrets from others' },
        { name: 'Files', description: 'File upload/download endpoints' },
        { name: 'Account', description: 'User account management' },
        { name: 'API Keys', description: 'API key management for programmatic access' },
        { name: 'Instance', description: 'Instance settings' },
        { name: 'Analytics', description: 'Analytics endpoints' },
        { name: 'Invites', description: 'Invite code management' },
        { name: 'Users', description: 'User management (admin)' },
        { name: 'Setup', description: 'Initial setup' },
        { name: 'Health', description: 'Health check' },
        { name: 'Config', description: 'Configuration endpoints' },
        { name: 'Metrics', description: 'Prometheus metrics endpoint' },
    ],
    paths: {
        '/healthz': {
            get: {
                tags: ['Health'],
                summary: 'Legacy liveness check',
                description:
                    'Simple liveness check. Kept for backwards compatibility. Consider using /health/live instead.',
                responses: {
                    '200': {
                        description: 'Service is running',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'healthy' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/health/live': {
            get: {
                tags: ['Health'],
                summary: 'Liveness probe',
                description:
                    'Simple check to verify the process is running. Use for Kubernetes liveness probes.',
                responses: {
                    '200': {
                        description: 'Process is alive',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'healthy' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/health/ready': {
            get: {
                tags: ['Health'],
                summary: 'Readiness probe',
                description:
                    'Comprehensive health check verifying database connectivity, file storage, and memory usage. Use for Kubernetes readiness probes.',
                responses: {
                    '200': {
                        description: 'Service is ready to accept traffic',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/HealthCheckResponse' },
                            },
                        },
                    },
                    '503': {
                        description: 'Service is not ready - one or more checks failed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/HealthCheckResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/config/social-providers': {
            get: {
                tags: ['Config'],
                summary: 'Get enabled social authentication providers',
                responses: {
                    '200': {
                        description: 'List of enabled providers',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        providers: { type: 'array', items: { type: 'string' } },
                                        callbackBaseUrl: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/secrets': {
            get: {
                tags: ['Secrets'],
                summary: 'List user secrets',
                description: 'Get paginated list of secrets created by the authenticated user',
                security: [{ cookieAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of secrets',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/SecretListItem' },
                                        },
                                        meta: { $ref: '#/components/schemas/PaginationMeta' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Secrets'],
                summary: 'Create a new secret',
                description:
                    'Create a new encrypted secret. The secret content should be encrypted client-side before sending.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSecretRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Secret created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { id: { type: 'string' } },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '409': { description: 'Conflict - could not create secret' },
                },
            },
        },
        '/secrets/{id}': {
            post: {
                tags: ['Secrets'],
                summary: 'Get a secret',
                description:
                    'Retrieve an encrypted secret by ID. Atomically consumes a view and burns the secret if burnable and last view. Password required if secret is password-protected.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { password: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Secret data',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Secret' },
                            },
                        },
                    },
                    '401': { description: 'Invalid password' },
                    '404': { description: 'Secret not found' },
                },
            },
            delete: {
                tags: ['Secrets'],
                summary: 'Delete a secret',
                description: 'Manually burn/delete a secret',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'Secret deleted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: 'Secret not found' },
                },
            },
        },
        '/secrets/{id}/check': {
            get: {
                tags: ['Secrets'],
                summary: 'Check secret status',
                description: 'Check if a secret exists and whether it requires a password',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'Secret status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        views: { type: 'integer' },
                                        title: { type: 'string', nullable: true },
                                        isPasswordProtected: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: 'Secret not found' },
                },
            },
        },
        '/secret-requests': {
            get: {
                tags: ['Secret Requests'],
                summary: 'List your secret requests',
                description:
                    'Get paginated list of secret requests created by the authenticated user',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    },
                    {
                        name: 'status',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['all', 'pending', 'fulfilled', 'expired', 'cancelled'],
                        },
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of secret requests',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/SecretRequest' },
                                        },
                                        meta: { $ref: '#/components/schemas/PaginationMeta' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Secret Requests'],
                summary: 'Create a secret request',
                description:
                    'Create a new secret request. Returns a link to share with the person who will submit the secret.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSecretRequestBody' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Secret request created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        creatorLink: {
                                            type: 'string',
                                            description: 'Link to share with the secret creator',
                                        },
                                        webhookSecret: {
                                            type: 'string',
                                            nullable: true,
                                            description: 'Webhook signing secret (only shown once)',
                                        },
                                        expiresAt: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/secret-requests/{id}': {
            get: {
                tags: ['Secret Requests'],
                summary: 'Get secret request details',
                description: 'Get details of a specific secret request (owner only)',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Secret request details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SecretRequestDetail' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'Secret request not found' },
                },
            },
            delete: {
                tags: ['Secret Requests'],
                summary: 'Cancel a secret request',
                description: 'Cancel a pending secret request (owner only)',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Secret request cancelled',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Can only cancel pending requests' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'Secret request not found' },
                },
            },
        },
        '/secret-requests/{id}/info': {
            get: {
                tags: ['Secret Requests'],
                summary: 'Get request info (public)',
                description:
                    'Get basic info about a secret request. Requires the token from the request link.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                    {
                        name: 'token',
                        in: 'query',
                        required: true,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description: 'Request token from the creator link',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Request info',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        title: { type: 'string' },
                                        description: { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: 'Invalid or expired request' },
                    '410': { description: 'Request already fulfilled or expired' },
                },
            },
        },
        '/secret-requests/{id}/submit': {
            post: {
                tags: ['Secret Requests'],
                summary: 'Submit a secret (public)',
                description:
                    'Submit an encrypted secret for a request. The secret is encrypted client-side before submission.',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                    {
                        name: 'token',
                        in: 'query',
                        required: true,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description: 'Request token from the creator link',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['secret', 'salt'],
                                properties: {
                                    secret: {
                                        type: 'object',
                                        description: 'Encrypted secret as Uint8Array object',
                                    },
                                    title: {
                                        type: 'object',
                                        nullable: true,
                                        description: 'Encrypted title as Uint8Array object',
                                    },
                                    salt: {
                                        type: 'string',
                                        minLength: 16,
                                        maxLength: 64,
                                        description: 'Salt used for encryption',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Secret created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        secretId: {
                                            type: 'string',
                                            description:
                                                'ID of the created secret. Client constructs full URL with decryption key.',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: 'Invalid request' },
                    '410': { description: 'Request already fulfilled or expired' },
                },
            },
        },
        '/files': {
            post: {
                tags: ['Files'],
                summary: 'Upload a file',
                description: 'Upload an encrypted file to attach to a secret',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'File uploaded',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { id: { type: 'string' } },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid file' },
                    '413': { description: 'File too large' },
                },
            },
        },
        '/files/{id}': {
            get: {
                tags: ['Files'],
                summary: 'Download a file',
                description: 'Download an encrypted file by ID',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'File content',
                        content: { 'application/octet-stream': {} },
                    },
                    '404': { description: 'File not found' },
                },
            },
        },
        '/account': {
            get: {
                tags: ['Account'],
                summary: 'Get account info',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': {
                        description: 'Account information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        username: { type: 'string' },
                                        email: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            put: {
                tags: ['Account'],
                summary: 'Update account info',
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Account updated' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '409': { description: 'Username already taken' },
                },
            },
            delete: {
                tags: ['Account'],
                summary: 'Delete account',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': { description: 'Account deleted' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/account/password': {
            put: {
                tags: ['Account'],
                summary: 'Update password',
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['currentPassword', 'newPassword'],
                                properties: {
                                    currentPassword: { type: 'string' },
                                    newPassword: { type: 'string', minLength: 8 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Password updated' },
                    '400': { description: 'Invalid current password' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/api-keys': {
            get: {
                tags: ['API Keys'],
                summary: 'List API keys',
                description: 'Get all API keys for the authenticated user',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of API keys',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/ApiKey' },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['API Keys'],
                summary: 'Create API key',
                description: 'Create a new API key. The full key is only shown once upon creation.',
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', minLength: 1, maxLength: 100 },
                                    expiresInDays: { type: 'integer', minimum: 1, maximum: 365 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'API key created',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiKey' },
                                        {
                                            type: 'object',
                                            properties: {
                                                key: {
                                                    type: 'string',
                                                    description:
                                                        'The full API key (only shown once)',
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '400': { description: 'Maximum API key limit reached (5)' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/api-keys/{id}': {
            delete: {
                tags: ['API Keys'],
                summary: 'Delete API key',
                security: [{ cookieAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'API key deleted' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { description: 'API key not found' },
                },
            },
        },
        '/instance/settings/public': {
            get: {
                tags: ['Instance'],
                summary: 'Get public instance settings',
                responses: {
                    '200': {
                        description: 'Public settings',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PublicInstanceSettings' },
                            },
                        },
                    },
                },
            },
        },
        '/instance/settings': {
            get: {
                tags: ['Instance'],
                summary: 'Get all instance settings (admin)',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': {
                        description: 'Instance settings',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/InstanceSettings' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
            put: {
                tags: ['Instance'],
                summary: 'Update instance settings (admin)',
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/InstanceSettings' },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Settings updated' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/analytics': {
            get: {
                tags: ['Analytics'],
                summary: 'Get secret analytics (admin)',
                security: [{ cookieAuth: [] }],
                parameters: [
                    {
                        name: 'timeRange',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['7d', '30d', '90d', '1y'],
                            default: '30d',
                        },
                    },
                ],
                responses: {
                    '200': { description: 'Analytics data' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/analytics/track': {
            post: {
                tags: ['Analytics'],
                summary: 'Track page visit',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['path'],
                                properties: { path: { type: 'string', maxLength: 255 } },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Tracked' },
                    '403': { description: 'Analytics disabled or bot detected' },
                },
            },
        },
        '/analytics/visitors': {
            get: {
                tags: ['Analytics'],
                summary: 'Get visitor analytics (admin)',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': { description: 'Visitor data' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/analytics/visitors/unique': {
            get: {
                tags: ['Analytics'],
                summary: 'Get unique visitor analytics (admin)',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': { description: 'Unique visitor data' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/analytics/visitors/daily': {
            get: {
                tags: ['Analytics'],
                summary: 'Get daily visitor stats (admin)',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': { description: 'Daily visitor statistics' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/invites': {
            get: {
                tags: ['Invites'],
                summary: 'List invite codes (admin)',
                security: [{ cookieAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of invite codes',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/InviteCode' },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
            post: {
                tags: ['Invites'],
                summary: 'Create invite code (admin)',
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    maxUses: {
                                        type: 'integer',
                                        minimum: 1,
                                        maximum: 100,
                                        default: 1,
                                    },
                                    expiresInDays: { type: 'integer', minimum: 1, maximum: 365 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Invite code created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/InviteCode' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/invites/{id}': {
            delete: {
                tags: ['Invites'],
                summary: 'Deactivate invite code (admin)',
                security: [{ cookieAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Invite code deactivated' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/invites/public/validate': {
            post: {
                tags: ['Invites'],
                summary: 'Validate invite code',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['code'],
                                properties: { code: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Validation result',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { valid: { type: 'boolean' } },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid invite code' },
                },
            },
        },
        '/invites/public/use': {
            post: {
                tags: ['Invites'],
                summary: 'Use invite code',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['code', 'userId'],
                                properties: {
                                    code: { type: 'string' },
                                    userId: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Invite code used' },
                    '400': { description: 'Invalid invite code' },
                },
            },
        },
        '/user': {
            get: {
                tags: ['Users'],
                summary: 'List users (admin)',
                description: 'Get paginated list of users with optional search',
                security: [{ cookieAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                    },
                    {
                        name: 'pageSize',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    },
                    {
                        name: 'search',
                        in: 'query',
                        schema: { type: 'string', maxLength: 100 },
                        description: 'Search by username, email, or name',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Paginated list of users',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        users: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/User' },
                                        },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        pageSize: { type: 'integer' },
                                        totalPages: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/user/{id}': {
            put: {
                tags: ['Users'],
                summary: 'Update user (admin)',
                security: [{ cookieAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'User updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
        },
        '/setup/status': {
            get: {
                tags: ['Setup'],
                summary: 'Check if setup is needed',
                responses: {
                    '200': {
                        description: 'Setup status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { needsSetup: { type: 'boolean' } },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/setup/complete': {
            post: {
                tags: ['Setup'],
                summary: 'Complete initial setup',
                description: 'Create the first admin user. Only works when no users exist.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'username', 'name'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 },
                                    username: { type: 'string', minLength: 3, maxLength: 32 },
                                    name: { type: 'string', minLength: 1, maxLength: 100 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Setup completed' },
                    '403': { description: 'Setup already completed' },
                },
            },
        },
        '/metrics': {
            get: {
                tags: ['Metrics'],
                summary: 'Get Prometheus metrics',
                description:
                    'Returns metrics in Prometheus exposition format. Requires metrics to be enabled in instance settings. If a metrics secret is configured, Bearer token authentication is required.',
                security: [{ metricsAuth: [] }],
                responses: {
                    '200': {
                        description: 'Prometheus metrics',
                        content: {
                            'text/plain': {
                                schema: {
                                    type: 'string',
                                    example:
                                        '# HELP hemmelig_secrets_active_count Current number of active (unexpired) secrets\n# TYPE hemmelig_secrets_active_count gauge\nhemmelig_secrets_active_count 42',
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized - invalid or missing Bearer token',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { error: { type: 'string' } },
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'Metrics endpoint is disabled',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { error: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'better-auth.session_token',
                description: 'Session cookie set after authentication via /auth endpoints',
            },
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                description: 'API key authentication. Use your API key as the bearer token.',
            },
            metricsAuth: {
                type: 'http',
                scheme: 'bearer',
                description:
                    'Metrics endpoint authentication. Use the configured metrics secret as the bearer token.',
            },
        },
        schemas: {
            SecretRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    status: {
                        type: 'string',
                        enum: ['pending', 'fulfilled', 'expired', 'cancelled'],
                    },
                    maxViews: { type: 'integer' },
                    expiresIn: { type: 'integer', description: 'Secret expiration in seconds' },
                    webhookUrl: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    fulfilledAt: { type: 'string', format: 'date-time', nullable: true },
                    secretId: { type: 'string', nullable: true },
                },
            },
            SecretRequestDetail: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    status: {
                        type: 'string',
                        enum: ['pending', 'fulfilled', 'expired', 'cancelled'],
                    },
                    maxViews: { type: 'integer' },
                    expiresIn: { type: 'integer' },
                    preventBurn: { type: 'boolean' },
                    allowedIp: { type: 'string', nullable: true },
                    webhookUrl: { type: 'string', nullable: true },
                    token: { type: 'string' },
                    creatorLink: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    fulfilledAt: { type: 'string', format: 'date-time', nullable: true },
                    secretId: { type: 'string', nullable: true },
                },
            },
            CreateSecretRequestBody: {
                type: 'object',
                required: ['title', 'expiresIn', 'validFor'],
                properties: {
                    title: { type: 'string', minLength: 1, maxLength: 200 },
                    description: { type: 'string', maxLength: 1000 },
                    maxViews: { type: 'integer', minimum: 1, maximum: 9999, default: 1 },
                    expiresIn: {
                        type: 'integer',
                        description: 'How long the created secret lives (seconds)',
                        enum: [
                            300, 1800, 3600, 14400, 43200, 86400, 259200, 604800, 1209600, 2419200,
                        ],
                    },
                    validFor: {
                        type: 'integer',
                        description: 'How long the request link is valid (seconds)',
                        enum: [3600, 43200, 86400, 259200, 604800, 1209600, 2592000],
                    },
                    allowedIp: {
                        type: 'string',
                        nullable: true,
                        description: 'IP/CIDR restriction for viewing the secret',
                    },
                    preventBurn: {
                        type: 'boolean',
                        default: false,
                        description: 'Keep secret even after max views reached',
                    },
                    webhookUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'URL to receive webhook when secret is submitted',
                    },
                },
            },
            ApiKey: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    keyPrefix: { type: 'string', description: 'First 16 characters of the key' },
                    lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            SecretListItem: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    views: { type: 'integer' },
                    isPasswordProtected: { type: 'boolean' },
                    ipRange: { type: 'string', nullable: true },
                    isBurnable: { type: 'boolean' },
                    fileCount: { type: 'integer' },
                },
            },
            Secret: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    secret: { type: 'string', description: 'Encrypted secret content (base64)' },
                    title: { type: 'string', nullable: true },
                    salt: { type: 'string' },
                    views: { type: 'integer' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isBurnable: { type: 'boolean' },
                    ipRange: { type: 'string', nullable: true },
                    files: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                filename: { type: 'string' },
                            },
                        },
                    },
                },
            },
            CreateSecretRequest: {
                type: 'object',
                required: ['secret', 'salt', 'expiresAt'],
                properties: {
                    secret: { type: 'string', description: 'Encrypted secret content' },
                    title: { type: 'string', nullable: true },
                    salt: { type: 'string', description: 'Salt used for encryption' },
                    password: { type: 'string', description: 'Optional password protection' },
                    expiresAt: {
                        type: 'integer',
                        description: 'Expiration time in seconds from now',
                    },
                    views: { type: 'integer', default: 1, description: 'Number of allowed views' },
                    isBurnable: { type: 'boolean', default: false },
                    ipRange: {
                        type: 'string',
                        nullable: true,
                        description: 'IP range restriction (CIDR notation)',
                    },
                    fileIds: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'IDs of uploaded files to attach',
                    },
                },
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    total: { type: 'integer' },
                    skip: { type: 'integer' },
                    take: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
            },
            PublicInstanceSettings: {
                type: 'object',
                properties: {
                    instanceName: { type: 'string' },
                    instanceDescription: { type: 'string' },
                    allowRegistration: { type: 'boolean' },
                    defaultSecretExpiration: { type: 'integer' },
                    maxSecretSize: { type: 'integer' },
                    allowPasswordProtection: { type: 'boolean' },
                    allowIpRestriction: { type: 'boolean' },
                    requireRegisteredUser: { type: 'boolean' },
                },
            },
            InstanceSettings: {
                type: 'object',
                properties: {
                    instanceName: { type: 'string' },
                    instanceDescription: { type: 'string' },
                    allowRegistration: { type: 'boolean' },
                    requireEmailVerification: { type: 'boolean' },
                    defaultSecretExpiration: { type: 'integer' },
                    maxSecretSize: { type: 'integer' },
                    allowPasswordProtection: { type: 'boolean' },
                    allowIpRestriction: { type: 'boolean' },
                    enableRateLimiting: { type: 'boolean' },
                    rateLimitRequests: { type: 'integer' },
                    rateLimitWindow: { type: 'integer' },
                    requireInviteCode: { type: 'boolean' },
                    allowedEmailDomains: { type: 'string' },
                    requireRegisteredUser: { type: 'boolean' },
                    webhookEnabled: { type: 'boolean' },
                    webhookUrl: { type: 'string' },
                    webhookSecret: { type: 'string' },
                    webhookOnView: { type: 'boolean' },
                    webhookOnBurn: { type: 'boolean' },
                    metricsEnabled: {
                        type: 'boolean',
                        description: 'Enable Prometheus metrics endpoint',
                    },
                    metricsSecret: {
                        type: 'string',
                        description: 'Bearer token for authenticating metrics endpoint requests',
                    },
                },
            },
            InviteCode: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    maxUses: { type: 'integer' },
                    uses: { type: 'integer' },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    banned: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            HealthCheckResponse: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['healthy', 'unhealthy'],
                        description: 'Overall health status',
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    checks: {
                        type: 'object',
                        properties: {
                            database: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                                    latency_ms: { type: 'integer' },
                                    error: { type: 'string' },
                                },
                            },
                            storage: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                                    error: { type: 'string' },
                                },
                            },
                            memory: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                                    heap_used_mb: { type: 'integer' },
                                    heap_total_mb: { type: 'integer' },
                                    rss_mb: { type: 'integer' },
                                    rss_threshold_mb: { type: 'integer' },
                                },
                            },
                        },
                    },
                },
                example: {
                    status: 'healthy',
                    timestamp: '2024-01-15T10:30:00.000Z',
                    checks: {
                        database: { status: 'healthy', latency_ms: 2 },
                        storage: { status: 'healthy' },
                        memory: {
                            status: 'healthy',
                            heap_used_mb: 128,
                            heap_total_mb: 256,
                            rss_mb: 312,
                            rss_threshold_mb: 1024,
                        },
                    },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: 'Unauthorized - authentication required',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: { error: { type: 'string' } },
                        },
                    },
                },
            },
            Forbidden: {
                description: 'Forbidden - admin access required',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: { error: { type: 'string' } },
                        },
                    },
                },
            },
        },
    },
};

// OpenAPI JSON spec endpoint
openapi.get('/openapi.json', (c) => c.json(spec));

// Swagger UI
openapi.get(
    '/docs',
    swaggerUI({
        url: '/api/openapi.json',
    })
);

export default openapi;
