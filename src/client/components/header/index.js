import { h } from 'preact';
import { Link } from 'preact-router/match';
import Logo from './logo.js';
import style from './style.css';
const Header = () => (
    <header class={style.header}>
        <Link class={style.link} href="/">
            <Logo class={style.logo} />
        </Link>
    </header>
);

export default Header;
