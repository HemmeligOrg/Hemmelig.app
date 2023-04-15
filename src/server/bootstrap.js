import config from 'config';
import prisma from './services/prisma.js';
import adminSettings from './adminSettings.js';
import { hash } from './helpers/password.js';

const username = config.get('account.root.user');
const email = config.get('account.root.email');
const password = config.get('account.root.password');

export function updateAdminSettings(settings = {}) {
    Object.keys(settings).forEach((key) => {
        adminSettings.set(key, settings[key]);
    });
}

// Create admin settings we can use by the server
async function createAdminSettings() {
    const [settings] = await prisma.settings.findMany({ where: { id: 'admin_settings' } });

    updateAdminSettings(settings);
}

// Remove expired secrets
async function dbCleaner() {
    try {
        await prisma.secret.deleteMany({
            where: {
                expiresAt: {
                    lte: new Date(),
                },
            },
        });
    } catch (err) {
        console.error(err, 'Nothing to delete from the database');
    }
}

// Create a root user the first time the server is running
async function createRootUser() {
    const rootUser = await prisma.user.findFirst({
        where: { username, email },
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
    }, 20 * 1000);

    createAdminSettings();

    createRootUser();
})();
