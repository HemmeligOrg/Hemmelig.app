import adminSettings from '../adminSettings.js';

const authRegex = /^\/api\/authentication\/.*$/i;
const accountRegex = /^\/api\/account\/.*$/i;
const errorMessage = 'Access denied. You are not allowed create or sign in users. 🥲';

export default async function disableUserHandler(request, reply) {
    const { url } = request;

    if (adminSettings.get('disable_users') && (!authRegex.test(url) || !accountRegex.test(url))) {
        return reply.code(403).send({ error: errorMessage });
    }
}
