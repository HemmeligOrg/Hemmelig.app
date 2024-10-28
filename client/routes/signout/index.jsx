import { IconLogout } from '@tabler/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { userLogin, userLoginChanged } from '../../actions';
import { signOut } from '../../api/authentication';
import { removeCookie } from '../../helpers/cookie';

const SignOut = () => {
    const dispatch = useDispatch();
    const [redirect, setRedirect] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const performSignOut = async () => {
            // Remove cookie first
            removeCookie();

            // Call sign out API
            await signOut();

            // Update Redux state
            dispatch(userLogin({ username: '' }));
            dispatch(userLoginChanged(false));

            // Set redirect after delay
            setTimeout(() => {
                setRedirect(true);
            }, 1500);
        };

        performSignOut();
    }, [dispatch]);

    if (!redirect) {
        return (
            <div className="min-h-screen flex items-start justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-md w-full">
                    <div className="text-center space-y-8">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="p-4 bg-gray-800 rounded-full">
                                <IconLogout size={32} className="text-gray-400 animate-pulse" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-semibold text-white">{t('signout.title')}</h1>

                        {/* Message */}
                        <p className="text-gray-400">{t('signout.waiting')}</p>

                        {/* Loading Animation */}
                        <div className="flex justify-center">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            </div>
                        </div>

                        {/* Optional: Cat Image */}
                        <div className="flex justify-center mt-8">
                            <img
                                src="./static/secret_cat.png"
                                alt="Secret Cat"
                                className="w-48 h-48 object-contain opacity-50"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <Navigate to="/signin" replace />;
};

export default SignOut;
