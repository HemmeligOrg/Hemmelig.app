import prisma from '../../services/prisma.js';
import { updateAdminSettings } from '../../bootstrap.js';

async function settings(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate],
        },
        async () => {
            const settings = await prisma.settings.findMany({
                where: {
                    id: 'admin_settings',
                },
            });

            return settings;
        }
    );

    fastify.put(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request) => {
            const { disable_users = false, read_only = false } = request.body;

            const settings = await prisma.settings.upsert({
                where: {
                    id: 'admin_settings',
                },
                update: {
                    disable_users, // Disable user registration
                    read_only, // Allow visiting users to read secrets, and not create any except if you are an admin
                },
                create: { id: 'admin_settings' },
            });

            updateAdminSettings(settings);

            return settings;
        }
    );
}

export default settings;
