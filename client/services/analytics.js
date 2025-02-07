const trackPageView = async (path) => {
    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path,
                referrer: document.referrer,
            }),
        });
    } catch (error) {
        console.error('Failed to track page view:', error);
    }
};

export { trackPageView };
