import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
    // Return false to exempt requests from being fulfilled by index.html.
    ({ request, url }) => {
        // If this isn't a navigation, skip.
        if (request.mode !== 'navigate') {
            return false;
        } // If this is a URL that starts with /_, skip.

        if (url.pathname.startsWith('/_')) {
            return false;
        } // If this looks like a URL for a resource, because it contains // a file extension, skip.

        if (url.pathname.match(fileExtensionRegexp)) {
            return false;
        } // Return true to signal that we want to use the handler.

        return true;
    },
    createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
    // Add in any other file extensions or routing criteria as needed.
    ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.ico'),
    ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.css'),
    ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.js'),
    ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'), // Customize this strategy as needed, e.g., by changing to CacheFirst.
    new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [
            // Ensure that once this runtime cache reaches a maximum size the
            // least-recently used images are removed.
            new ExpirationPlugin({ maxEntries: 50 }),
        ],
    })
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Any other custom service worker logic can go here.
