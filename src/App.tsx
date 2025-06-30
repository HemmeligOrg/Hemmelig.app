import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="relative">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                {/* Content */}
                <div className="relative">
                    <RouterProvider router={router} />
                </div>
            </div>
        </div>
    );
}

export default App;
