import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function RootLayout() {

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-white">
            <Header />
            <main className="flex-grow mx-auto">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
