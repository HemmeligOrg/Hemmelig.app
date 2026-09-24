import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buttonClassName } from '../components/Button';

export function NotFoundPage() {
    const { t } = useTranslation();

    return (
        <main className="max-w-reading mx-auto px-6 py-28 grid gap-4.5">
            <div className="font-mono text-ui text-faint">{t('not_found_page.kicker')}</div>
            <h1 className="m-0 text-[44px] leading-tight font-medium tracking-[-0.035em]">
                {t('not_found_page.title')}
            </h1>
            <p className="m-0 text-fg-3 text-lg text-pretty">{t('not_found_page.message')}</p>
            <Link
                to="/"
                className={buttonClassName({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'justify-self-start text-fg',
                })}
            >
                {t('not_found_page.create_secret_button')}
            </Link>
        </main>
    );
}
