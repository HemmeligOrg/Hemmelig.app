import { type Context } from 'hono';

/**
 * Handle not found error from Prisma
 * @param error Error from Prisma operation
 * @param c Hono context
 * @returns JSON error response
 */
export const handleNotFound = (error: any, c: Context) => {
  // Handle record not found error (Prisma P2025)
  if (error?.code === 'P2025') {
    c.status(404);
    return c.json({ error: 'Not found' });
  }

  // Handle other errors
  c.status(500);
  return c.json({
    error: 'Failed to process the operation',
    details: error.message,
  });
};
