const trackPageView = async (path) => {
    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path,
            }),
        });
    } catch (error) {
        console.error('Failed to track page view:', error);
    }
};

const getAnalyticsData = async () => {
    try {
        const response = await fetch('/api/analytics/data/aggregate/daily', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 403) {
                return {
                    statusCode: 403,
                    error: response.statusText,
                };
            }

            throw new Error('Failed to fetch analytics data');
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        throw error;
    }
};

const getStatistics = async () => {
    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 403) {
                return {
                    statusCode: 403,
                    error: response.statusText,
                };
            }

            throw new Error('Failed to fetch analytics data');
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        throw error;
    }
};

export { getAnalyticsData, getStatistics, trackPageView };
