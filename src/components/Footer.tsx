import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left - Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/privacy"
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-xs transition-colors"
            >
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <Link
              to="/terms"
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-xs transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
          
          {/* Right - X and Theme Toggle */}
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
        
        {/* Center - Tagline on its own line */}
        <p className="text-gray-500 dark:text-slate-400 text-xs text-center mt-3">
          {t('footer.tagline')}
        </p>
      </div>
    </footer>
  );
}
