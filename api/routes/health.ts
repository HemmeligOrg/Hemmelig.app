import { constants } from 'fs';
import { access, unlink, writeFile } from 'fs/promises';
import { Hono } from 'hono';
import { join } from 'path';
import prisma from '../lib/db';
import { UPLOAD_DIR } from '../lib/files';

const app = new Hono();

type CheckStatus = 'healthy' | 'unhealthy';

type CheckResult = {
    status: CheckStatus;
    latency_ms?: number;
    error?: string;
    [key: string]: unknown;
};

type HealthResponse = {
    status: CheckStatus;
    timestamp: string;
    checks: {
        database: CheckResult;
        storage: CheckResult;
        memory: CheckResult;
    };
};

/**
 * Check database connectivity by executing a simple query
 */
async function checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            status: 'healthy',
            latency_ms: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latency_ms: Date.now() - start,
            error: error instanceof Error ? error.message : 'Database connection failed',
        };
    }
}

/**
 * Check file storage is accessible and writable
 */
async function checkStorage(): Promise<CheckResult> {
    const testFile = join(UPLOAD_DIR, `.health-check-${Date.now()}`);
    try {
        // Check directory exists and is accessible
        await access(UPLOAD_DIR, constants.R_OK | constants.W_OK);

        // Try to write and delete a test file
        await writeFile(testFile, 'health-check');
        await unlink(testFile);

        return {
            status: 'healthy',
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Storage check failed',
        };
    }
}

/**
 * Check memory usage is within acceptable bounds
 * Note: heapUsed/heapTotal ratio is often high (90%+) in normal Node.js operation
 * since the heap grows dynamically. We use RSS-based threshold instead.
 */
function checkMemory(): CheckResult {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);

    // Consider unhealthy if RSS exceeds 1GB (reasonable default for most deployments)
    const RSS_THRESHOLD_MB = 1024;
    const isHealthy = rssMB < RSS_THRESHOLD_MB;

    return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        heap_used_mb: heapUsedMB,
        heap_total_mb: heapTotalMB,
        rss_mb: rssMB,
        rss_threshold_mb: RSS_THRESHOLD_MB,
    };
}

/**
 * GET /health/live - Liveness probe
 * Simple check to verify the process is running
 */
app.get('/live', (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * GET /health/ready - Readiness probe
 * Comprehensive check of all dependencies
 */
app.get('/ready', async (c) => {
    const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);

    const memory = checkMemory();

    const checks = { database, storage, memory };

    const overallStatus: CheckStatus = Object.values(checks).every(
        (check) => check.status === 'healthy'
    )
        ? 'healthy'
        : 'unhealthy';

    const response: HealthResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
    };

    return c.json(response, overallStatus === 'healthy' ? 200 : 503);
});

export default app;
