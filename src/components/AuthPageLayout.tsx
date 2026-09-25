import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Modal } from './Modal';

interface AuthPageLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: ReactNode;
    errorModal?: {
        isOpen: boolean;
        message: string;
        close: () => void;
    };
}

/** The public top bar and a narrow centered column for the sign-in forms. */
export function AuthPageLayout({ children, title, subtitle, errorModal }: AuthPageLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-canvas text-fg">
            <Header />
            <main className="max-w-[380px] mx-auto px-6 py-20 grid gap-4">
                <div className="grid gap-1">
                    <h1 className="m-0 text-2xl font-medium tracking-tight">{title}</h1>
                    {subtitle && <p className="m-0 text-sm text-fg-3">{subtitle}</p>}
                </div>
                {children}
            </main>
            {errorModal && (
                <Modal
                    isOpen={errorModal.isOpen}
                    onClose={errorModal.close}
                    title={t('common.error')}
                    confirmText={t('common.ok')}
                    onConfirm={errorModal.close}
                    confirmVariant="primary"
                >
                    <p className="m-0">{errorModal.message}</p>
                </Modal>
            )}
        </div>
    );
}
