import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/db';
import { handleNotFound } from '../lib/utils';
import {
    createSecretsSchema,
    updateSecretsSchema,
    secretsIdParamSchema,
    secretsQuerySchema,
    secretsSearchQuerySchema,
    processSecretsQueryParams,
} from '../validations/secrets';

const app = new Hono()
    // GET /secrets - Get all secrets
    .get('/', zValidator('query', secretsQuerySchema), async c => {
        try {
            const validatedQuery = c.req.valid('query');
            const options = processSecretsQueryParams(validatedQuery);
            const whereClause = { ...options.where }; // Start with existing where conditions

            // Get total count and items based on processed options (where, skip, take)
            const [items, total] = await Promise.all([
                prisma.secrets.findMany({
                    where: whereClause,
                    skip: options.skip,
                    take: options.take,
                    orderBy: { id: 'desc' },
                }),
                prisma.secrets.count({ where: whereClause }),
            ]);

            return c.json({
                data: items,
                meta: {
                    total,
                    skip: options.skip,
                    take: options.take,
                    page: Math.floor(options.skip / options.take) + 1,
                    totalPages: Math.ceil(total / options.take),
                },
            });
        } catch (error) {
            console.error('Failed to retrieve secrets:', error); // Log error
            c.status(500);
            return c.json({
                error: 'Failed to retrieve secrets',
                details:
                    error instanceof Error ? error.message : 'Unknown internal error',
            });
        }
    })
    // GET /secrets/:id - Get Secrets by ID
    .get('/:id', zValidator('param', secretsIdParamSchema), async c => {
        try {
            // Get validated ID from URL parameters
            const { id: validatedIdString } = c.req.valid('param');
            const id = validatedIdString;
            const whereClause: { id: string } = { id };

            const item = await prisma.secrets.findUnique({
                where: whereClause,
                // https://www.prisma.io/docs/orm/reference/prisma-client-reference#include
                // include: { name_of_relation: true }
            });

            // Handle not found
            if (!item) {
                c.status(404);
                return c.json({ error: 'secrets not found' });
            }

            return c.json(item);
        } catch (error: unknown) {
            console.error(`Failed to retrieve item ${c.req.param('id')}:`, error);

            return c.json({
                error: 'Failed to retrieve item',
                details:
                    error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    })
    // POST /secrets - Create a new Secrets
    .post('/', zValidator('json', createSecretsSchema), async c => {
        try {
            // Get validated data from the request body middleware (with cast)
            const validatedData = c.req.valid('json');

            // Create secrets using the validated data
            const item = await prisma.secrets.create({
                data: validatedData,
                // https://www.prisma.io/docs/orm/reference/prisma-client-reference#include
                // include: { name_of_relation: true }
            });

            c.status(201);

            return c.json(item);
        } catch (error: unknown) {
            console.error('Failed to create secrets:', error);
            // Handle potential Prisma unique constraint errors, etc.
            // @ts-expect-error: error is unknown
            if (error?.code === 'P2002') {
                // Example: Unique constraint failed
                c.status(409); // Conflict
                return c.json({
                    error: 'Could not create secrets',
                    // @ts-expect-error: error is unknown
                    details: error.meta?.target,
                });
            }
            c.status(500);
            return c.json({
                error: 'Failed to create secrets',
                details:
                    error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    })
    // PUT /secrets/:id - Update Secrets by ID
    .put(
        '/:id',
        zValidator('param', secretsIdParamSchema),
        zValidator('json', updateSecretsSchema),
        async c => {
            try {
                // Get validated ID and JSON body data (with cast)
                const { id: validatedIdString } = c.req.valid('param');
                const validatedData = c.req.valid('json');
                const id = validatedIdString;

                const whereClause: { id: string } = { id };

                const item = await prisma.secrets.update({
                    where: whereClause,
                    data: validatedData,
                    // https://www.prisma.io/docs/orm/reference/prisma-client-reference#include
                    // include: { name_of_relation: true }
                });

                return c.json(item);
            } catch (error: unknown) {
                console.error(`Failed to update secrets ${c.req.param('id')}:`, error);
                // Use the service function to handle common errors like 'not found' (P2025)
                // Also catches potential unique constraint errors on update (P2002)
                return handleNotFound(error, c);
            }
        },
    )
    // DELETE /secrets/:id - Delete Secrets by ID
    .delete('/:id', zValidator('param', secretsIdParamSchema), async c => {
        console.log("slay")
        try {
            // Get validated ID (with cast)
            const { id: validatedIdString } = c.req.valid('param');
            const id = validatedIdString;

            const whereClause: { id: string } = { id };

            await prisma.secrets.delete({
                where: whereClause,
            });

            // Return standard success response
            return c.json({
                success: true,
                message: 'secrets deleted successfully',
            });
        } catch (error: unknown) {
            console.error(`Failed to delete secrets ${c.req.param('id')}:`, error);
            // Use the service function to handle 'not found' (P2025)
            return handleNotFound(error, c);
        }
    })
    // GET /secrets/search - Search secrets by name
    .get('/search', zValidator('query', secretsSearchQuerySchema), async c => {
        try {
            // Get validated query parameters from middleware
            const validatedQuery = c.req.valid('query');

            // Pagination logic (similar to processsecretsQueryParams but simpler for just page/limit)
            const page = validatedQuery.page ? parseInt(validatedQuery.page, 10) : 1;
            const limit = validatedQuery.limit
                ? parseInt(validatedQuery.limit, 10)
                : 10;
            const take = Math.min(Math.max(limit, 1), 100); // Clamp limit between 1 and 100
            const skip = (page - 1) * take;

            // Prepare the where clause for Prisma
            const whereClause = {
                OR: [
                    {
                        secret: {
                            startsWith: validatedQuery.query,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        title: {
                            startsWith: validatedQuery.query,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        password: {
                            startsWith: validatedQuery.query,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        ipRange: {
                            startsWith: validatedQuery.query,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            };

            // Execute the search query and count query concurrently
            const [items, total] = await Promise.all([
                prisma.secrets.findMany({
                    where: whereClause,
                    skip: skip,
                    take: take,
                    orderBy: { id: 'desc' },
                }),
                prisma.secrets.count({ where: whereClause }),
            ]);

            // Return the paginated results
            return c.json({
                data: items,
                meta: {
                    total,
                    skip,
                    take,
                    page: page,
                    totalPages: Math.ceil(total / take),
                },
            });
        } catch (error) {
            console.error('Failed to search secrets:', error);
            c.status(500);
            return c.json({
                error: 'Failed to search secrets',
                details:
                    error instanceof Error ? error.message : 'Unknown internal error',
            });
        }
    });

export default app;
