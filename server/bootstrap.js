import config from 'config';
import adminSettings from './adminSettings.js';
import { hash } from './helpers/password.js';
import prisma from './services/prisma.js';

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
    const settings = await prisma.settings.upsert({
        where: { id: 'admin_settings' },
        update: {},
        create: {
            id: 'admin_settings',
            disable_users: false,
            disable_user_account_creation: false,
            read_only: false,
            disable_file_upload: false,
            restrict_organization_email: '',
        },
    });

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

// Initialize the application
(async function main() {
    try {
        await createAdminSettings();
        await createRootUser();

        setInterval(() => {
            dbCleaner();
        }, 20 * 1000);
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
})();
