import { h } from 'preact';
import { Link } from 'preact-router/match';
import Logo from './logo.js';
import { Account } from '../icon';

import style from './style.css';

const Header = () => (
    <header class={style.header}>
        <Link class={style.link} href="/">
            <Logo class={style.logo} />
        </Link>

        <Link class={style.linkButton} href="/signin">
            <span>Sign in</span> <Account />
        </Link>
    </header>
);

export default Header;
