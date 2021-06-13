import { h } from 'preact';
import style from './style.css';

const Error = ({ children }) => (
    <p class={style.error}>
        An error occured: <strong>{children}</strong>
    </p>
);

export default Error;
