import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';

interface AuthPageLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    backTo: string;
    backLabel: string;
    errorModal?: {
        isOpen: boolean;
        message: string;
        close: () => void;
    };
}

export function AuthPageLayout({
    children,
    title,
    subtitle,
    backTo,
    backLabel,
    errorModal,
}: AuthPageLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Link
                    to={backTo}
                    className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>{backLabel}</span>
                </Link>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
                </div>

                {children}
            </div>
            {errorModal && (
                <Modal
                    isOpen={errorModal.isOpen}
                    onClose={errorModal.close}
                    title={t('common.error')}
                    confirmText={t('common.ok')}
                    onConfirm={errorModal.close}
                    confirmButtonClass="bg-blue-600 hover:bg-blue-700"
                >
                    <p>{errorModal.message}</p>
                </Modal>
            )}
        </div>
    );
}
