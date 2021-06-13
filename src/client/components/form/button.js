import { h } from 'preact';
import cc from 'classcat';
import style from './style.css';

const Button = ({ buttonType, full = false, children, ...rest }) => (
    <button
        class={cc({
            [style.buttonBurn]: buttonType === 'burn',
            [style.buttonCreate]: buttonType === 'create',
            [style.full]: full,
        })}
        {...rest}
    >
        {children}
    </button>
);

export default Button;
