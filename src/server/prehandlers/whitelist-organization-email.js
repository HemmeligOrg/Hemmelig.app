import extractDomain from 'extract-domain';
import adminSettings from '../adminSettings.js';

const authenticationRegex = /^\/api\/authentication\/signup.*$/i;
const errorMessage = 'Access denied. You are not allowed create a user. 🥲';

export default async function whitelistOrganizationEmailHandler(request, reply) {
    const email = request?.body?.email ?? '';
    const { url } = request;
    const whitelist = adminSettings.get('whitelist_organization_email');

    console.log(email, url, whitelist, extractDomain(email));

    if (
        whitelist &&
        extractDomain(whitelist) !== extractDomain(email) &&
        authenticationRegex.test(url)
    ) {
        return reply.code(403).send({ error: errorMessage });
    }
}
