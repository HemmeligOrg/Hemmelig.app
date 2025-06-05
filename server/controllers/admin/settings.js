import getEmailDomain from '../../../shared/helpers/get-email-domain.js';
import { updateAdminSettings } from '../../bootstrap.js';
import prisma from '../../services/prisma.js';
import { updateOAuth2Strategy } from '../../auth/oauth2.js';

async function settings(fastify) {
    // Public endpoint to get settings
    fastify.get('/', async (request, reply) => {
        try {
            const settings = await prisma.settings.findFirst({
                where: {
                    id: 'admin_settings',
                },
            });

            if (!settings) {
                // Return default settings if none exist
                return {
                    id: 'admin_settings',
                    disable_users: false,
                    disable_user_account_creation: false,
                    hide_allowed_ip_input: false,
                    read_only: false,
                    disable_file_upload: false,
                    restrict_organization_email: '',
                    sso_client_id: '',
                    sso_client_secret: '',
                    sso_authorization_url: '',
                    sso_token_url: '',
                    sso_user_info_url: '',
                    sso_enabled: false,
                };
            }

            // Return only non-sensitive fields for the public GET route
            const { sso_client_secret: _, ...publicSettings } = settings;
            return publicSettings;
        } catch (error) {
            request.log.error('Failed to fetch admin settings:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Protected endpoint to update settings
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
                        hide_allowed_ip_input: { type: 'boolean', default: false },
                        read_only: { type: 'boolean', default: false },
                        disable_file_upload: { type: 'boolean', default: false },
                        restrict_organization_email: { type: 'string', default: '' },
                    },
                    required: [
                        'disable_users',
                        'disable_user_account_creation',
                        'read_only',
                        'disable_file_upload',
                    ],
                },
            },
        },
        async (request, reply) => {
            try {
                const {
                    disable_users,
                    disable_user_account_creation,
                    hide_allowed_ip_input,
                    read_only,
                    disable_file_upload,
                    restrict_organization_email,
                } = request.body;

                const currentSettings = await prisma.settings.findFirst({
                    where: { id: 'admin_settings' },
                });

                const settings = await prisma.settings.upsert({
                    where: {
                        id: 'admin_settings',
                    },
                    update: {
                        disable_users,
                        disable_user_account_creation,
                        hide_allowed_ip_input,
                        read_only,
                        disable_file_upload,
                        restrict_organization_email: getEmailDomain(restrict_organization_email),
                        // SSO fields are not updated here, handled by /sso route
                    },
                    create: {
                        id: 'admin_settings',
                        disable_users,
                        disable_user_account_creation,
                        hide_allowed_ip_input,
                        read_only,
                        disable_file_upload,
                        restrict_organization_email: getEmailDomain(restrict_organization_email),
                        // sso_enabled is false by default, other sso fields are null
                    },
                });

                updateAdminSettings({ ...currentSettings, ...settings });


                // Return only non-sensitive fields
                const { sso_client_secret: _, ...publicSettings } = settings;
                return publicSettings;
            } catch (error) {
                request.log.error('Failed to update admin settings:', error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );

    // Protected endpoint to get SSO settings (including secret)
    fastify.get(
        '/sso',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request, reply) => {
            try {
                const settings = await prisma.settings.findFirst({
                    where: {
                        id: 'admin_settings',
                    },
                    select: {
                        sso_client_id: true,
                        sso_client_secret: true,
                        sso_authorization_url: true,
                        sso_token_url: true,
                        sso_user_info_url: true,
                        sso_enabled: true,
                    },
                });

                if (!settings) {
                    return {
                        sso_client_id: '',
                        sso_client_secret: '',
                        sso_authorization_url: '',
                        sso_token_url: '',
                        sso_user_info_url: '',
                        sso_enabled: false,
                    };
                }
                return settings;
            } catch (error) {
                request.log.error('Failed to fetch SSO settings:', error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );

    // Protected endpoint to update SSO settings
    fastify.put(
        '/sso',
        {
            preValidation: [fastify.authenticate, fastify.admin],
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        sso_client_id: { type: 'string', nullable: true, default: '' },
                        sso_client_secret: { type: 'string', nullable: true, default: '' },
                        sso_authorization_url: { type: 'string', nullable: true, default: '' },
                        sso_token_url: { type: 'string', nullable: true, default: '' },
                        sso_user_info_url: { type: 'string', nullable: true, default: '' },
                        sso_enabled: { type: 'boolean', default: false },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const {
                    sso_client_id,
                    sso_client_secret,
                    sso_authorization_url,
                    sso_token_url,
                    sso_user_info_url,
                    sso_enabled,
                } = request.body;

                const currentSettings = await prisma.settings.findFirst({
                    where: { id: 'admin_settings' },
                });

                // Preserve existing non-SSO settings
                const updatedSettingsData = {
                    ...currentSettings, // spread existing settings first
                    sso_client_id: sso_client_id || '',
                    sso_client_secret: sso_client_secret || '', // Store secret, handle with care
                    sso_authorization_url: sso_authorization_url || '',
                    sso_token_url: sso_token_url || '',
                    sso_user_info_url: sso_user_info_url || '',
                    sso_enabled,
                };
                // remove id field if it was included from currentSettings spread
                delete updatedSettingsData.id;


                const newSettings = await prisma.settings.upsert({
                    where: {
                        id: 'admin_settings',
                    },
                    update: updatedSettingsData,
                    create: {
                        id: 'admin_settings', // This should ideally not happen if settings always exist
                        ...updatedSettingsData,
                    },
                });

                updateAdminSettings(newSettings);
                await updateOAuth2Strategy(); // Update OAuth2 strategy

                // Return all SSO fields for admin UI
                return {
                    sso_client_id: newSettings.sso_client_id,
                    sso_client_secret: newSettings.sso_client_secret,
                    sso_authorization_url: newSettings.sso_authorization_url,
                    sso_token_url: newSettings.sso_token_url,
                    sso_user_info_url: newSettings.sso_user_info_url,
                    sso_enabled: newSettings.sso_enabled,
                };
            } catch (error) {
                request.log.error('Failed to update SSO settings:', error);
                return reply.code(500).send({ error: 'Internal server error' });
            }
        }
    );
}

export default settings;
