import { useCallback, useState } from 'react';

export function useModalState(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    return { isOpen, open, close, toggle, setIsOpen };
}

export function useErrorModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const showError = useCallback((errorMessage: string) => {
        setMessage(errorMessage);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return { isOpen, message, showError, close };
}
