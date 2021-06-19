import { h } from 'preact';
import { Link } from 'preact-router/match';
import Logo from './logo.js';
import style from './style.css';
const Header = () => (
    <header class={style.header}>
        <Link class={style.link} href="/">
            <div class={style.logoWrapper}>
                <Logo class={style.logo} /> <span class={style.logoText}>hemmelig</span>
            </div>
        </Link>
    </header>
);

export default Header;
