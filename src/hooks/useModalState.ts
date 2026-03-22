import { useCallback, useState } from 'react';

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
