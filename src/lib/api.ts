import { hc } from 'hono/client';
import type { AppType } from '../../api/routes';
import { useErrorStore } from '../store/errorStore';

interface ApiError {
    error?: string | { issues?: { message: string }[]; message?: string };
}

const client = hc<AppType>('/api', {
    fetch(input, init) {
        return fetch(input, init).then(async (res) => {
            if (!res.ok) {
                const errorData: ApiError = await res.json();
                const errorMessage =
                    typeof errorData.error === 'string'
                        ? errorData.error
                        : errorData.error?.issues?.[0]?.message ||
                          errorData.error?.message ||
                          'Unknown error';
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
