import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from './logo.js';
import { Account } from '../icon';

import emitter from '../../helpers/state-emitter';
import { hasToken, removeToken } from '../../helpers/token';

import style from './style.module.css';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [onSignOutRedirect, setOnSignOutRedirect] = useState(false);

    useEffect(() => {
        emitter.on('isLoggedIn', (e) => setIsLoggedIn(e));

        if (hasToken()) {
            emitter.emit('isLoggedIn', true);
        }
    }, [hasToken]);

    const onSignOut = (event) => {
        event.preventDefault();

        removeToken();

        emitter.emit('isLoggedIn', false);

        setOnSignOutRedirect(true);
    };

    return (
        <header className={style.header}>
            <Link className={style.link} to="/">
                <Logo className={style.logo} />
            </Link>
            {isLoggedIn && (
                <Link className={style.signOutButton} onClick={onSignOut} to="signin">
                    <span>Sign out</span> <Account />
                </Link>
            )}

            {!isLoggedIn && (
                <div className={style.signWrapper}>
                    <Link className={style.signInButton} to="/signin">
                        <span>Sign in</span>
                    </Link>

                    <Link className={style.signUpButton} to="/signup">
                        <span>Sign up</span> <Account />
                    </Link>
                </div>
            )}
            {onSignOutRedirect && <Redirect to="/signin" />}
        </header>
    );
};

export default Header;
