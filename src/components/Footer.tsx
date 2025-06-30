import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="py-8 text-center">
            <div className="container mx-auto px-4">
                <p className="text-slate-400 text-sm">
                    {t('footer.tagline')}
                </p>
            </div>
        </footer>
    );
}
