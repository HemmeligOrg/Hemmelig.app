import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 dark:text-slate-400 text-xs">
            {t('footer.tagline')}
          </p>
          <div className="flex items-center space-x-3">
            <a
              href="https://x.com/iamdothash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
              aria-label="X (Twitter)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
