import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { buttonClassName } from '../components/Button';

export function SecretNotFoundPage() {
    const error = useRouteError();
    const { t } = useTranslation();

    // A 404 response is the normal case. Show details only for unexpected errors.
    const details =
        error && !(isRouteErrorResponse(error) && error.status === 404) && error instanceof Error
            ? error.message
            : null;

    return (
        <main className="max-w-reading mx-auto px-6 py-28 grid gap-4.5">
            <div className="font-mono text-ui text-faint">{t('secret_not_found_page.kicker')}</div>
            <h1 className="m-0 text-[44px] leading-tight font-medium tracking-[-0.035em]">
                {t('secret_not_found_page.title')}
            </h1>
            <p className="m-0 text-fg-3 text-lg text-pretty">
                {t('secret_not_found_page.message')}
            </p>
            {details && (
                <pre className="m-0 p-3 rounded-sm bg-surface border border-line-soft font-mono text-xs text-muted whitespace-pre-wrap break-words">
                    {details}
                </pre>
            )}
            <Link
                to="/"
                className={buttonClassName({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'justify-self-start text-fg',
                })}
            >
                {t('secret_not_found_page.go_home_button')}
            </Link>
        </main>
    );
}
