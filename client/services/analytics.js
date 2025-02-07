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

const getAnalyticsData = async () => {
    try {
        const response = await fetch('/api/analytics/data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        throw error;
    }
};

export { getAnalyticsData, trackPageView };
