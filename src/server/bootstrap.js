import config from 'config';
import { PrismaClient } from '@prisma/client';
import adminSettings from './adminSettings.js';
import { hash } from './helpers/password.js';

const prisma = new PrismaClient();

const username = config.get('account.root.user');
const email = config.get('account.root.email');
const password = config.get('account.root.password');

// Create admin settings we can use by the server
async function createAdminSettings() {
    const [settings] = await prisma.settings.findMany({ where: { id: 'admin_settings' } });

    Object.keys(settings).forEach((key) => {
        adminSettings.set(key, settings[key]);
    });
}

// Remove expired secrets
async function dbCleaner() {
    await prisma.secret.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
}

// Create a root user the first time the server is running
async function createRootUser() {
    const rootUser = await prisma.user.findFirst({
        where: { username },
    });

    if (rootUser) {
        return;
    }

    await prisma.user.create({
        data: {
            username,
            email,
            password: await hash(password),
            generated: true,
            role: 'admin',
        },
    });
}

(async function main() {
    setInterval(() => {
        dbCleaner();

        // Update the admin settings
        createAdminSettings();
    }, 20 * 1000);

    createRootUser();
})();
