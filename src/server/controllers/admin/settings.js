import getEmailDomain from '../../../shared/helpers/get-email-domain.js';
import { updateAdminSettings } from '../../bootstrap.js';
import prisma from '../../services/prisma.js';

async function settings(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async () => {
            const settings = await prisma.settings.findFirst({
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
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        disable_users: { type: 'boolean', default: false },
                        disable_user_account_creation: { type: 'boolean', default: false },
                        read_only: { type: 'boolean', default: false },
                        disable_file_upload: { type: 'boolean', default: false },
                        restrict_organization_email: { type: 'string', default: '' },
                    },
                },
            },
        },
        async (request) => {
            const {
                disable_users,
                disable_user_account_creation,
                read_only,
                disable_file_upload,
                restrict_organization_email,
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
                    restrict_organization_email: getEmailDomain(restrict_organization_email), // Whitelist organization email for user creation
                },
                create: { id: 'admin_settings' },
            });

            updateAdminSettings(settings);

            return settings;
        }
    );
}

export default settings;
