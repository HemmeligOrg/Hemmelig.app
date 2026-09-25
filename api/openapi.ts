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
                                        providerDetails: {
                                            type: 'array',
                                            description:
                                                'The enabled providers with the optional button text and icon. Generic OAuth providers set displayName, label and icon in HEMMELIG_AUTH_GENERIC_OAUTH.',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    generic: { type: 'boolean' },
                                                    displayName: { type: 'string' },
                                                    label: { type: 'string' },
                                                    icon: {
                                                        type: 'string',
                                                        description:
                                                            'Base64 data URI of a PNG, SVG or WebP image',
                                                    },
                                                },
                                            },
                                        },
                                        hidePasswordLogin: {
                                            type: 'boolean',
                                            description:
                                                'True when HEMMELIG_HIDE_PASSWORD_LOGIN is on and a social provider is enabled. This is a UI option only. The server still accepts password sign-in.',
                                        },
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
                    'Create a new encrypted secret. Authentication is optional: anonymous creation works when the instance does not require registered users, and authenticated creation supports either a session cookie or Authorization: Bearer hemmelig_... . The secret and title fields must be sent as JSON-serialized Uint8Array objects.',
                security: [{}, { cookieAuth: [] }, { bearerAuth: [] }],
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
                                    properties: {
                                        id: { type: 'string' },
                                        deleteToken: {
                                            type: 'string',
                                            description:
                                                'Creator delete token. Send it as X-Hemmelig-Delete-Token to burn the secret before anyone reveals it. It is valid until the secret expires. The server shows it only once.',
                                        },
                                    },
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
                    'Retrieve an encrypted secret by ID. Atomically consumes a view and burns the secret if burnable and last view. Send a password verifier if the secret is password-protected.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    passwordVerifier: {
                                        type: 'string',
                                        description:
                                            'Hex-encoded SHA-256 verifier derived from the password on the client',
                                    },
                                    password: {
                                        type: 'string',
                                        description: 'Raw password for legacy secrets only',
                                        deprecated: true,
                                    },
                                },
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
                description:
                    'Burn a secret. Send a delete token from the create response or from a successful retrieval, or authenticate as the owner of the secret with a session or an API key.',
                security: [{}, { cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    {
                        name: 'X-Hemmelig-Delete-Token',
                        in: 'header',
                        required: false,
                        schema: { type: 'string' },
                        description:
                            'Delete token from the create response or from a retrieval. Not needed when the owner is authenticated.',
                    },
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
                    '403': {
                        description: 'No valid delete token, and the caller is not the owner',
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
                                        views: {
                                            type: 'integer',
                                            nullable: true,
                                            description:
                                                'Views left. Null means no view limit until the secret expires.',
                                        },
                                        title: { type: 'string', nullable: true },
                                        isPasswordProtected: { type: 'boolean' },
                                        passwordScheme: {
                                            type: 'string',
                                            nullable: true,
                                            enum: ['derived', 'legacy', null],
                                            description:
                                                'Derived secrets accept a client-derived verifier. Legacy secrets require the raw password.',
                                        },
                                        salt: { type: 'string', nullable: true },
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
                        name: 'X-Secret-Request-Token',
                        in: 'header',
                        required: false,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description:
                            'Request token from the creator link fragment. Legacy links may pass token in the query instead.',
                    },
                    {
                        name: 'token',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description: 'Legacy request token from the creator link',
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
                        name: 'X-Secret-Request-Token',
                        in: 'header',
                        required: false,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description:
                            'Request token from the creator link fragment. Legacy links may pass token in the query instead.',
                    },
                    {
                        name: 'token',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', minLength: 64, maxLength: 64 },
                        description: 'Legacy request token from the creator link',
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                description:
                    'Upload an encrypted file to attach to a secret. Send the encrypted bytes as `application/octet-stream` with a `Content-Length` and the hex-encoded encrypted file name in `X-Hemmelig-File-Name`. The server streams this body to disk. The `multipart/form-data` form is still supported, but the server holds that body in memory, so use it only for small files.',
                parameters: [
                    {
                        name: 'X-Hemmelig-File-Name',
                        in: 'header',
                        required: false,
                        description:
                            'Hex-encoded encrypted file name. Required for `application/octet-stream` uploads.',
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/octet-stream': {
                            schema: { type: 'string', format: 'binary' },
                        },
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    name: {
                                        type: 'string',
                                        description:
                                            'Hex-encoded encrypted filename. Legacy clients may omit it.',
                                    },
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
                                    properties: {
                                        id: { type: 'string' },
                                        token: {
                                            type: 'string',
                                            description:
                                                'Upload capability. Send it with the file id when you create the secret. It is valid for 1 hour.',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid file' },
                    '411': { description: 'A raw upload has no Content-Length' },
                    '413': { description: 'File too large' },
                },
            },
        },
        '/files/{id}': {
            get: {
                tags: ['Files'],
                summary: 'Download a file',
                description:
                    'Download an encrypted file. Requires the download capability token returned when the secret is retrieved.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    {
                        name: 'X-Hemmelig-File-Token',
                        in: 'header',
                        required: true,
                        schema: { type: 'string' },
                    },
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Account information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        username: { type: 'string' },
                                        email: { type: 'string' },
                                        role: { type: 'string', enum: ['user', 'admin'] },
                                        twoFactorEnabled: { type: 'boolean' },
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                description:
                    'Needs a signed-in session. A request with an API key gets 403, so a leaked key cannot change credentials.',
                security: [{ cookieAuth: [] }],
                'x-session-only': true,
                responses: {
                    '200': { description: 'Account deleted' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/SessionOnly' },
                },
            },
        },
        '/account/password': {
            put: {
                tags: ['Account'],
                summary: 'Update password',
                description:
                    'Needs a signed-in session. A request with an API key gets 403, so a leaked key cannot change credentials.',
                security: [{ cookieAuth: [] }],
                'x-session-only': true,
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
                    '403': { $ref: '#/components/responses/SessionOnly' },
                },
            },
        },
        '/api-keys': {
            get: {
                tags: ['API Keys'],
                summary: 'List API keys',
                description: 'Get all API keys for the authenticated user',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                description:
                    'Create a new API key. The full key is only shown once upon creation. Needs a signed-in session. A request with an API key gets 403, so a leaked key cannot change credentials.',
                security: [{ cookieAuth: [] }],
                'x-session-only': true,
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
                    '403': { $ref: '#/components/responses/SessionOnly' },
                },
            },
        },
        '/api-keys/{id}': {
            delete: {
                tags: ['API Keys'],
                summary: 'Delete API key',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                    '409': {
                        description:
                            'An environment variable controls a setting in the request, and the value differs',
                    },
                },
            },
        },
        '/analytics': {
            get: {
                tags: ['Analytics'],
                summary: 'Get secret analytics (admin)',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                                    properties: {
                                        id: { type: 'string' },
                                        token: {
                                            type: 'string',
                                            description:
                                                'Upload capability token required to attach the file to a secret',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid invite code' },
                },
            },
        },
        '/user': {
            get: {
                tags: ['Users'],
                summary: 'List users (admin)',
                description: 'Get paginated list of users with optional search',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
            post: {
                tags: ['Users'],
                summary: 'Create a user (admin)',
                description:
                    'Create a user with a password. The password policy applies. Registration settings do not apply to users that an admin creates.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['username', 'email', 'password'],
                                properties: {
                                    username: { type: 'string', minLength: 3, maxLength: 50 },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 },
                                    name: { type: 'string' },
                                    role: { type: 'string', enum: ['user', 'admin'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User created',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    '400': { description: 'Invalid input or weak password' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '409': { description: 'Username or email already exists' },
                },
            },
        },
        '/user/{id}': {
            put: {
                tags: ['Users'],
                summary: 'Update a user (admin)',
                description:
                    'Change the username, email or role. An admin cannot remove their own admin role.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
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
                                    role: { type: 'string', enum: ['user', 'admin'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'User updated',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    '400': { description: 'Invalid input or a change to your own role' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                },
            },
            delete: {
                tags: ['Users'],
                summary: 'Delete a user (admin)',
                description:
                    'Delete a user, their sessions, API keys and secret requests. Their secrets stay until they expire. An admin cannot delete their own account here.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'User deleted' },
                    '400': { description: 'You tried to delete your own account' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/user/{id}/ban': {
            post: {
                tags: ['Users'],
                summary: 'Ban a user (admin)',
                description:
                    'Ban a user and end all their sessions. Their API keys stop working at once. Without expiresInSeconds, the ban has no end.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string', maxLength: 500 },
                                    expiresInSeconds: { type: 'integer', minimum: 60 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'User banned',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    '400': { description: 'You tried to ban yourself' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/user/{id}/unban': {
            post: {
                tags: ['Users'],
                summary: 'Unban a user (admin)',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'User unbanned',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/User' } },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/user/{id}/password': {
            put: {
                tags: ['Users'],
                summary: 'Set the password of a user (admin)',
                description:
                    'Set a new password. The password policy applies. A user with only social logins gets a password login.',
                security: [{ cookieAuth: [] }, { bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: { password: { type: 'string', minLength: 8 } },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Password set' },
                    '400': { description: 'Weak password' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { description: 'User not found' },
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
                description:
                    'API key authentication. Send `Authorization: Bearer hemmelig_...`. A key acts with the role of its owner, so an admin key can use the admin routes. Changing the password, deleting the account and creating API keys need a signed-in session.',
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
                    views: {
                        type: 'integer',
                        nullable: true,
                        description: 'Views left. Null means no view limit.',
                    },
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
                    views: {
                        type: 'integer',
                        nullable: true,
                        description: 'Views left after this reveal. Null means no view limit.',
                    },
                    expiresAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isBurnable: { type: 'boolean' },
                    ipRange: { type: 'string', nullable: true },
                    deleteToken: {
                        type: 'string',
                        description:
                            'Capability token that allows deleting the secret after reading it',
                    },
                    files: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                filename: { type: 'string' },
                                token: {
                                    type: 'string',
                                    description:
                                        'Short-lived download capability token for this file',
                                },
                            },
                        },
                    },
                },
            },
            CreateSecretRequest: {
                type: 'object',
                required: ['secret', 'salt', 'expiresAt'],
                properties: {
                    secret: {
                        type: 'object',
                        additionalProperties: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 255,
                        },
                        description:
                            'Encrypted secret content sent as a JSON-serialized Uint8Array',
                        example: { '0': 116, '1': 101, '2': 115, '3': 116 },
                    },
                    title: {
                        type: 'object',
                        nullable: true,
                        additionalProperties: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 255,
                        },
                        description: 'Encrypted title as a JSON-serialized Uint8Array',
                        example: { '0': 78, '1': 111, '2': 116, '3': 101 },
                    },
                    salt: { type: 'string', description: 'Salt used for encryption' },
                    passwordVerifier: {
                        type: 'string',
                        description:
                            'Hex-encoded SHA-256 verifier derived from the password on the client. The password never leaves the browser.',
                    },
                    expiresAt: {
                        type: 'integer',
                        description: 'Expiration time in seconds from now',
                    },
                    views: {
                        type: 'integer',
                        nullable: true,
                        minimum: 1,
                        maximum: 9999,
                        default: 1,
                        description:
                            'Number of allowed views. Null removes the view limit, so the secret lives until it expires.',
                    },
                    isBurnable: {
                        type: 'boolean',
                        default: true,
                        description:
                            'When true, the last view sends the secret.burned webhook event instead of secret.viewed.',
                    },
                    ipRange: {
                        type: 'string',
                        nullable: true,
                        description: 'IP range restriction (CIDR notation)',
                    },
                    fileIds: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Deprecated. Use files instead.',
                        deprecated: true,
                    },
                    files: {
                        type: 'array',
                        maxItems: 20,
                        items: {
                            type: 'object',
                            required: ['id', 'token'],
                            properties: {
                                id: { type: 'string' },
                                token: { type: 'string' },
                            },
                        },
                        description: 'Signed file attachments',
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
                    instanceLogo: { type: 'string', description: 'Base64 data URL of the logo' },
                    instanceLogoDark: {
                        type: 'string',
                        description: 'Base64 data URL of the logo for the dark theme',
                    },
                    defaultTheme: {
                        type: 'string',
                        enum: ['light', 'dark', 'system'],
                        description: 'Theme for visitors who have not chosen one',
                    },
                    allowRegistration: { type: 'boolean' },
                    defaultSecretExpiration: { type: 'integer' },
                    defaultMaxViews: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 9999,
                        description: 'Max views that the composer preselects',
                    },
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
                    instanceLogo: { type: 'string', description: 'Base64 data URL of the logo' },
                    instanceLogoDark: {
                        type: 'string',
                        description: 'Base64 data URL of the logo for the dark theme',
                    },
                    defaultTheme: { type: 'string', enum: ['light', 'dark', 'system'] },
                    allowRegistration: { type: 'boolean' },
                    requireEmailVerification: { type: 'boolean' },
                    defaultSecretExpiration: { type: 'integer' },
                    defaultMaxViews: { type: 'integer', minimum: 1, maximum: 9999 },
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
                    lockedByEnvironment: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                        readOnly: true,
                        description:
                            'Settings that an environment variable controls outside managed mode, mapped to the variable name. An update with a different value for one of these settings returns 409.',
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
            SessionOnly: {
                description:
                    'Forbidden - this action needs a signed-in session. API keys cannot change credentials.',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'string',
                                    example: 'This action requires a signed-in session.',
                                },
                            },
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
