import { Hono } from 'hono';
import { hash, compare } from '../lib/password'
import { zValidator } from '@hono/zod-validator';
import prisma from '../lib/db';
import { handleNotFound } from '../lib/utils';
import {
    createSecretsSchema,
    secretsIdParamSchema,
    secretsQuerySchema,
    processSecretsQueryParams,
} from '../validations/secrets';

const app = new Hono()
    // GET /secrets - Get all secrets
    .get('/', zValidator('query', secretsQuerySchema), async c => {
        // TODO: Use this GET request to retrieve all secrets for a user from the admin panel
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
                select: {
                    id: true,
                    secret: true,
                    title: true,
                    ipRange: true,
                    views: true,
                    expiresAt: true,
                    createdAt: true,
                    isBurnable: true,
                    password: true, // Include password if it exists
                }
            });

            // Handle not found
            if (!item) {
                c.status(404);
                return c.json({ error: 'secrets not found' });
            }

            if (item.password) {
                const isValidPassword = await compare(item.password, c.req.body.password);

                if (!isValidPassword) {
                    c.status(401);
                    return c.json({ error: 'Invalid password' });
                }
            }

            delete item.password; // Remove password from response

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

            const data = {
                ...validatedData,
                password: validatedData.password ? await hash(validatedData.password) : null,
            }

            // Create secrets using the validated data
            const item = await prisma.secrets.create({
                data,
                // https://www.prisma.io/docs/orm/reference/prisma-client-reference#include
                // include: { name_of_relation: true }
            });

            c.status(201);

            return c.json({ id: item.id });
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
                message: 'Secret deleted successfully',
            });
        } catch (error: unknown) {
            console.error(`Failed to delete secret ${c.req.param('id')}:`, error);
            // Use the service function to handle 'not found' (P2025)
            return handleNotFound(error, c);
        }
    });

export default app;
