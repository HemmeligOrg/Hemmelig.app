import { hc } from 'hono/client';
import type { AppType } from '../../api/routes';
import { useErrorStore } from '../store/errorStore';

interface ApiError {
    error?: string | { issues?: { message: string }[]; name?: string; message?: string };
}

function extractErrorMessage(errorData: ApiError): string {
    const { error } = errorData;
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;

    // Zod v4 ZodError serializes as { name: "ZodError", message: "[...JSON stringified issues...]" }
    if (error.name === 'ZodError' && typeof error.message === 'string') {
        try {
            const issues = JSON.parse(error.message);
            if (Array.isArray(issues)) {
                return issues.map((i: { message: string }) => i.message).join(', ');
            }
        } catch {
            // Fall through to other checks
        }
    }

    if (Array.isArray(error.issues)) {
        return error.issues.map((i) => i.message).join(', ');
    }

    return error.message || 'Unknown error';
}

const client = hc<AppType>('/api', {
    fetch(input, init) {
        return fetch(input, init).then(async (res) => {
            if (!res.ok) {
                const errorData: ApiError = await res.json();
                const errorMessage = extractErrorMessage(errorData);
                useErrorStore.getState().addError(errorMessage);
                throw new Error(errorMessage);
            }
            return res;
        });
    },
});

// Raw client without error handling (for validation endpoints where errors are expected)
export const apiRaw = hc<AppType>('/api');

export const api = client;
