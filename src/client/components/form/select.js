import { h } from 'preact';
import style from './style.css';

const Select = ({ compress, children, ...rest }) => (
    <select class={style.select} {...rest}>
        {children}
    </select>
);

export default Select;
