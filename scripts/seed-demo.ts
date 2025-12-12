import crypto from 'crypto';
import db from '../api/lib/db';

const DAYS_TO_GENERATE = 30;
const VISITOR_PATHS = ['/', '/secret'];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
    return date;
}

function generateUniqueVisitorId(): string {
    return crypto.randomBytes(16).toString('hex');
}

// ============================================
// Instance Settings
// ============================================
async function seedInstanceSettings() {
    console.log('Seeding instance settings...');

    const existing = await db.instanceSettings.findFirst();
    if (existing) {
        console.log('  Instance settings already exist, skipping...');
        console.log('  Done!\n');
        return existing;
    }

    const settings = await db.instanceSettings.create({
        data: {
            instanceName: 'Hemmelig Demo',
            instanceDescription: 'A demo instance of Hemmelig for testing and development.',
            allowRegistration: true,
            requireEmailVerification: false,
            defaultSecretExpiration: 72,
            maxSecretSize: 1024,
            allowPasswordProtection: true,
            allowIpRestriction: true,
            enableRateLimiting: true,
            rateLimitRequests: 100,
            rateLimitWindow: 60,
            requireInviteCode: false,
            webhookEnabled: false,
        },
    });

    console.log('  Created instance settings');
    console.log('  Done!\n');
    return settings;
}

// ============================================
// Secrets
// ============================================
async function seedSecrets() {
    console.log('Seeding secrets...');

    const records = [];

    for (let daysAgo = 0; daysAgo < DAYS_TO_GENERATE; daysAgo++) {
        // Generate between 1-15 secrets per day
        const secretsCount = randomInt(1, 15);

        for (let i = 0; i < secretsCount; i++) {
            const createdAt = randomDate(daysAgo);

            // Random expiration: 1 hour, 1 day, 1 week, or more
            const expirationHours = [1, 24, 168, 336, 672][randomInt(0, 4)];
            const expiresAt = new Date(createdAt.getTime() + expirationHours * 60 * 60 * 1000);

            // Random features
            const hasPassword = Math.random() < 0.3;
            const hasIpRange = Math.random() < 0.1;
            const isBurnable = Math.random() < 0.4;

            // Random views
            const views = randomInt(1, 20);

            // Generate dummy encrypted data
            const secret = Buffer.from(crypto.randomBytes(32));
            const title = Buffer.from(crypto.randomBytes(16));
            const salt = crypto.randomBytes(16).toString('hex');

            records.push({
                secret,
                title,
                salt,
                views,
                password: hasPassword ? crypto.randomBytes(32).toString('hex') : null,
                ipRange: hasIpRange ? '192.168.1.0/24' : '',
                isBurnable,
                createdAt,
                expiresAt,
            });
        }
    }

    // Batch insert
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await db.secrets.createMany({ data: batch });
        process.stdout.write(
            `\r  Created ${Math.min(i + batchSize, records.length)}/${records.length} secrets`
        );
    }

    console.log('\n  Done!\n');
}

// ============================================
// Visitor Analytics
// ============================================
async function seedVisitorAnalytics() {
    console.log('Seeding visitor analytics...');

    const records = [];

    for (let daysAgo = 0; daysAgo < DAYS_TO_GENERATE; daysAgo++) {
        // Generate between 5-50 unique visitors per day
        const uniqueVisitors = randomInt(5, 50);
        const visitorIds = Array.from({ length: uniqueVisitors }, () => generateUniqueVisitorId());

        for (const visitorId of visitorIds) {
            // Each visitor views 1-5 pages
            const pageViews = randomInt(1, 5);

            for (let i = 0; i < pageViews; i++) {
                const path = VISITOR_PATHS[randomInt(0, VISITOR_PATHS.length - 1)];
                records.push({
                    path,
                    uniqueId: visitorId,
                    timestamp: randomDate(daysAgo),
                });
            }
        }
    }

    // Batch insert
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await db.visitorAnalytics.createMany({ data: batch });
        process.stdout.write(
            `\r  Created ${Math.min(i + batchSize, records.length)}/${records.length} visitor records`
        );
    }

    console.log('\n  Done!\n');
}

// ============================================
// Clear Data
// ============================================
async function clearDemoData() {
    console.log('Clearing existing demo data...');

    await db.visitorAnalytics.deleteMany({});
    console.log('  Cleared visitor analytics');

    // Only delete anonymous secrets (no userId)
    await db.secrets.deleteMany({ where: { userId: null } });
    console.log('  Cleared anonymous secrets');

    await db.instanceSettings.deleteMany({});
    console.log('  Cleared instance settings');

    console.log('  Done!\n');
}

// ============================================
// Main
// ============================================
async function main() {
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');

    console.log('\n🌱 Hemmelig Demo Database Seeder\n');
    console.log('This will populate the database with demo data for development.\n');

    try {
        if (shouldClear) {
            await clearDemoData();
        }

        await seedInstanceSettings();
        await seedSecrets();
        await seedVisitorAnalytics();

        console.log('✅ Demo database seeded successfully!\n');
    } catch (error) {
        console.error('\n❌ An error occurred:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

main();
