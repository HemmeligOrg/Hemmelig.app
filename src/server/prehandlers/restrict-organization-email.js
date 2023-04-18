import extractDomain from 'extract-domain';
import adminSettings from '../adminSettings.js';

const authenticationRegex = /^\/api\/authentication\/signup.*$/i;
const errorMessage = 'Access denied. You are not allowed create a user. 🥲';

export default async function restrictOrganizationEmailHandler(request, reply) {
    const email = request?.body?.email ?? '';
    const { url } = request;
    const restrict = adminSettings.get('restrict_organization_email');

    if (
        restrict &&
        extractDomain(restrict) !== extractDomain(email) &&
        authenticationRegex.test(url)
    ) {
        return reply.code(403).send({ error: errorMessage });
    }
}
