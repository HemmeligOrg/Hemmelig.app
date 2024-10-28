import { IconMenu2 } from '@tabler/icons';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import Logo from './components/header/logo';
import Nav from './components/header/nav';
import logoStyles from './components/header/style.module.css';
import MainLinks from './components/settings/main-links';
import SecondaryLinks from './components/settings/secondary-links';

const AdminShell = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-[75px] bg-gray-800 z-50">
                <div className="h-full px-5 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <Logo className={logoStyles.logo} />
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white 
                                 hover:bg-gray-700 focus:outline-none focus:ring-2 
                                 focus:ring-gray-600"
                    >
                        <IconMenu2 size={24} />
                    </button>

                    {/* Navigation */}
                    <div className="hidden lg:block">
                        <Nav />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-[75px] left-0 h-[calc(100vh-75px)] w-[300px] bg-gray-800 
                           transform transition-transform duration-300 ease-in-out lg:translate-x-0
                           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col p-4">
                    {/* Main Links Section */}
                    <div className="flex-1">
                        <MainLinks />
                    </div>

                    {/* Secondary Links Section */}
                    <div className="flex-1">
                        <SecondaryLinks />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`min-h-[calc(100vh-75px)] transition-all duration-300 ease-in-out
                           lg:ml-[300px] mt-[75px] p-6`}
            >
                <Outlet />
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminShell;
