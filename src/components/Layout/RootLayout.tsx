import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { trackPageView } from '../../lib/analytics';

export function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-light-800 dark:bg-dark-900 text-gray-900 dark:text-white">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
