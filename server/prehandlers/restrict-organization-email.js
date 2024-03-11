import getEmailDomain from '../../shared/helpers/get-email-domain.js';
import adminSettings from '../adminSettings.js';

const authenticationRegex = /^\/api\/authentication\/signup.*$/i;
const errorMessage = 'Access denied. You are not allowed create a user. 🥲';

export default async function restrictOrganizationEmailHandler(request, reply) {
    const email = request?.body?.email ?? '';
    const { url } = request;
    const restrict = adminSettings.get('restrict_organization_email');

    if (
        restrict &&
        getEmailDomain(restrict) !== getEmailDomain(email) &&
        authenticationRegex.test(url)
    ) {
        return reply.code(403).send({ message: errorMessage });
    }
}
