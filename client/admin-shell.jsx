import { IconMenu2 } from '@tabler/icons';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import Logo from './components/header/logo';
import Nav from './components/header/nav';
import MainLinks from './components/settings/main-links';
import SecondaryLinks from './components/settings/secondary-links';

const AdminShell = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header
                className="fixed top-0 left-0 right-0 h-[75px] bg-gray-800/95 backdrop-blur-sm 
                             border-b border-gray-700/50 z-50"
            >
                <div className="h-full px-5 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <Logo className="w-10 h-10 [&>g]:fill-gray-100" />
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white 
                                 hover:bg-gray-700 focus:outline-none focus:ring-2 
                                 focus:ring-gray-600 transition-colors"
                    >
                        <IconMenu2 size={24} />
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:block">
                        <Nav />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-[75px] left-0 h-[calc(100vh-75px)] w-[280px] bg-gray-800/95 
                           backdrop-blur-sm border-r border-gray-700/50 transform transition-transform 
                           duration-300 ease-in-out lg:translate-x-0 z-40
                           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col p-4">
                    {/* Scrollable area for links */}
                    <div
                        className="flex-1 overflow-y-auto space-y-6 scrollbar-thin 
                                  scrollbar-thumb-gray-700 scrollbar-track-transparent"
                    >
                        {/* Main Links Section */}
                        <div>
                            <h2 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Main Navigation
                            </h2>
                            <MainLinks />
                        </div>

                        {/* Secondary Links Section */}
                        <div>
                            <h2 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Other Links
                            </h2>
                            <SecondaryLinks />
                        </div>
                    </div>

                    {/* Version or Additional Info (optional) */}
                    <div className="pt-4 mt-4 border-t border-gray-700/50">
                        <div className="px-3 text-xs text-gray-500">Hemmelig</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`min-h-[calc(100vh-75px)] transition-all duration-300 ease-in-out
                           lg:ml-[280px] mt-[75px] p-6`}
            >
                <Outlet />
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminShell;
