import { api } from './api';

const TRACKED_PATHS = ['/', '/secret'];

export async function trackPageView(path: string): Promise<void> {
    // Only track specific paths
    const shouldTrack = TRACKED_PATHS.some((trackedPath) => {
        if (trackedPath === '/') {
            return path === '/';
        }
        return path.startsWith(trackedPath);
    });

    if (!shouldTrack) {
        return;
    }

    // Normalize secret paths to just /secret for privacy
    const normalizedPath = path.startsWith('/secret/') ? '/secret' : path;

    try {
        await api.analytics.track.$post({ json: { path: normalizedPath } });
    } catch {
        // Silently fail - analytics should not affect user experience
    }
}
