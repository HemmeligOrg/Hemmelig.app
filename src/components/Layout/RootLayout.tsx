import { Outlet } from 'react-router-dom';
import { Footer } from '../Footer';
import { Header } from '../Header';

export function RootLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-canvas text-fg">
            <Header />
            <div className="flex-grow w-full">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}
