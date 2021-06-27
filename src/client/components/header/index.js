import { h } from 'preact';
import { Link } from 'preact-router/match';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import Logo from './logo.js';
import { Account } from '../icon';

import emitter from '../../helpers/state-emitter';
import { hasToken, removeToken } from '../../helpers/token';

import style from './style.css';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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

        route('/signin', true);
    };

    return (
        <header class={style.header}>
            <Link class={style.link} href="/">
                <Logo class={style.logo} />
            </Link>
            {isLoggedIn && (
                <Link class={style.signOutButton} onClick={onSignOut}>
                    <span>Sign out</span> <Account />
                </Link>
            )}

            {!isLoggedIn && (
                <div class={style.signWrapper}>
                    <Link class={style.signInButton} href="/signin">
                        <span>Sign in</span>
                    </Link>

                    <Link class={style.signUpButton} href="/signup">
                        <span>Sign up</span> <Account />
                    </Link>
                </div>
            )}
        </header>
    );
};

export default Header;
