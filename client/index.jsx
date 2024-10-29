import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';

import HemmeligApplication from './app';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <Suspense
        fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-100 z-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        }
    >
        <HemmeligApplication />
    </Suspense>
);
