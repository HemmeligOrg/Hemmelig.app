import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguagePicker } from './LanguagePicker';
import { ThemeToggle } from './ThemeToggle';

const linkClass = 'lowercase text-muted hover:text-fg';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="w-full max-w-content mx-auto px-6 mt-14">
            <div className="flex flex-wrap gap-4 justify-between items-center border-t border-line-soft py-5 font-mono text-xs text-faint">
                <span>{t('footer.tagline')}</span>
                <div className="flex flex-wrap items-center gap-4.5">
                    <Link to="/privacy" className={linkClass}>
                        {t('footer.privacy')}
                    </Link>
                    <Link to="/terms" className={linkClass}>
                        {t('footer.terms')}
                    </Link>
                    <a href="/api/docs" className={linkClass}>
                        {t('footer.api')}
                    </a>
                    <a
                        href="https://github.com/HemmeligOrg/Hemmelig.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                    >
                        github
                    </a>
                    <span className="flex items-center gap-2 pl-3 border-l border-line-soft">
                        <LanguagePicker />
                        <ThemeToggle />
                    </span>
                </div>
            </div>
        </footer>
    );
}
