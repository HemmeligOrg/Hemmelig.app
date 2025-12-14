import { create } from 'zustand';

export interface SecretRequest {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
    maxViews: number;
    expiresIn: number;
    webhookUrl?: string;
    createdAt: string;
    expiresAt: string;
    fulfilledAt?: string;
    secretId?: string;
    creatorLink?: string;
}

interface SecretRequestState {
    requests: SecretRequest[];
    selectedRequest: SecretRequest | null;
    isLoading: boolean;
    error: string | null;
    setRequests: (requests: SecretRequest[]) => void;
    addRequest: (request: SecretRequest) => void;
    updateRequest: (id: string, updates: Partial<SecretRequest>) => void;
    removeRequest: (id: string) => void;
    setSelectedRequest: (request: SecretRequest | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSecretRequestStore = create<SecretRequestState>((set) => ({
    requests: [],
    selectedRequest: null,
    isLoading: false,
    error: null,
    setRequests: (requests) => set({ requests }),
    addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
    updateRequest: (id, updates) =>
        set((state) => ({
            requests: state.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
    removeRequest: (id) =>
        set((state) => ({
            requests: state.requests.filter((r) => r.id !== id),
        })),
    setSelectedRequest: (request) => set({ selectedRequest: request }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
