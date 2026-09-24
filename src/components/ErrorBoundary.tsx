import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Button, buttonClassName } from './Button';

export function ErrorBoundary() {
    const error = useRouteError();
    const { t } = useTranslation();

    const isRouteError = isRouteErrorResponse(error);
    const errorMessage = isRouteError
        ? error.statusText
        : error instanceof Error
          ? error.message
          : t('error_boundary.unknown_error');
    const kicker = isRouteError
        ? `${error.status} · ${t('error_boundary.kicker')}`
        : t('error_boundary.kicker');

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-canvas text-fg">
            <main className="max-w-reading mx-auto px-6 py-28 grid gap-4.5">
                <div className="font-mono text-ui text-faint">{kicker}</div>
                <h1 className="m-0 text-[44px] leading-tight font-medium tracking-tighter">
                    {t('error_boundary.title')}
                </h1>
                <p className="m-0 text-[17px] text-fg-3 text-pretty">
                    {t('error_boundary.message')} {t('error_boundary.hint')}
                </p>

                {errorMessage && (
                    <pre className="m-0 font-mono text-xs text-faint whitespace-pre-wrap break-words">
                        {t('error_boundary.error_details')} {errorMessage}
                    </pre>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="secondary" size="lg" onClick={handleReload}>
                        {t('error_boundary.try_again_button')}
                    </Button>
                    <Link to="/" className={buttonClassName({ variant: 'ghost', size: 'inline' })}>
                        {t('error_boundary.go_home_button')}
                    </Link>
                </div>
            </main>
        </div>
    );
}
