import { h } from 'preact';
import cc from 'classcat';
import style from './style.css';

const Error = ({ children, align = '' }) => (
    <p class={cc([style.info, style[align]])}>{children}</p>
);

export default Error;
