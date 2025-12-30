import { useCallback, useRef, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

export function useCopyFeedback(timeout = 2000) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const copy = useCallback(
        async (text: string) => {
            const success = await copyToClipboard(text);
            if (success) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setCopied(true);
                timeoutRef.current = setTimeout(() => setCopied(false), timeout);
            }
            return success;
        },
        [timeout]
    );

    return { copied, copy };
}

export function useCopyFeedbackWithId<T extends string = string>(timeout = 2000) {
    const [copiedId, setCopiedId] = useState<T | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const copy = useCallback(
        async (text: string, id: T) => {
            const success = await copyToClipboard(text);
            if (success) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setCopiedId(id);
                timeoutRef.current = setTimeout(() => setCopiedId(null), timeout);
            }
            return success;
        },
        [timeout]
    );

    const isCopied = useCallback((id: T) => copiedId === id, [copiedId]);

    return { copiedId, copy, isCopied };
}
