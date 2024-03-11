export default function readCookieAllRoutesHandler(fastify) {
    return async (request) => {
        const token = request.cookies['__HEMMELIG_TOKEN'] || null;

        if (!token) {
            return;
        }

        if (request.user) {
            return;
        }

        // assign the cookie user value to request.user for routes
        // with no authentication
        try {
            request.user = fastify.jwt.verify(token);
        } catch (err) {
            console.error(err);
        }
    };
}
