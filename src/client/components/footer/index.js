import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const Footer = () => (
    <footer class={style.footer}>
        <nav>
            <Link href="/signin">SIGN IN</Link> | <Link href="/account">ACCOUNT</Link> |{' '}
            <Link href="/privacy">PRIVACY</Link> | <Link href="/api-docs">API</Link> |{' '}
            <Link href="/about">ABOUT</Link> |{' '}
            <Link href="https://www.github.com/HemmeligOrg/hemmelig">❤️ BY HEMMELIG</Link>
        </nav>
    </footer>
);

export default Footer;
