import extractDomain from 'extract-domain';
import prisma from '../../services/prisma.js';
import { updateAdminSettings } from '../../bootstrap.js';

async function settings(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
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
            const {
                disable_users = false,
                disable_user_account_creation = false,
                read_only = false,
                disable_file_upload = false,
                restrict_organization_email = '',
            } = request.body;

            const settings = await prisma.settings.upsert({
                where: {
                    id: 'admin_settings',
                },
                update: {
                    disable_users, // Disable user registration
                    disable_user_account_creation, // Disable user account creation
                    read_only, // Allow visiting users to read secrets, and not create any except if you are an admin
                    disable_file_upload, // Disable file uploads
                    restrict_organization_email: extractDomain(restrict_organization_email), // Whitelist organization email for user creation
                },
                create: { id: 'admin_settings' },
            });

            updateAdminSettings(settings);

            return settings;
        }
    );
}

export default settings;
