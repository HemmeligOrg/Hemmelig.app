import { defineConfig } from 'prisma/config';

// Load dotenv only if available and not in Docker build context
try {
    await import('dotenv/config');
} catch {
    // dotenv not needed in Docker build context
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: process.env.DATABASE_URL || 'file:./database/hemmelig.db',
    },
});
