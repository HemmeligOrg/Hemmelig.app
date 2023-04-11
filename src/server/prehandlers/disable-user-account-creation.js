import adminSettings from '../adminSettings.js';

const authenticationRegex = /^\/api\/authentication\/signup.*$/i;
const errorMessage = 'Access denied. You are not allowed create a user. 🥲';

export default async function disableUserAccountCreation(request, reply) {
    const { url } = request;

    if (adminSettings.get('disable_user_account_creation') && authenticationRegex.test(url)) {
        return reply.code(403).send({ error: errorMessage });
    }
}
