import { h } from 'preact';
import style from './style.css';

const Success = ({ children }) => (
    <p class={style.success}>
        Success: <strong>{children}</strong>
    </p>
);

export default Success;
