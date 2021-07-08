import React from 'react';
import { Link } from 'react-router-dom';
import style from './style.module.css';

const Footer = () => (
    <footer className={style.footer}>
        <nav>
            <Link to="/signin">SIGN IN</Link> | <Link to="/account">ACCOUNT</Link> |{' '}
            <Link to="/privacy">PRIVACY</Link> | <Link to="/api-docs">API</Link> |{' '}
            <Link to="/about">ABOUT</Link> |{' '}
            <Link to="https://www.github.com/HemmeligOrg/hemmelig">❤️ BY HEMMELIG</Link>
        </nav>
    </footer>
);

export default Footer;
