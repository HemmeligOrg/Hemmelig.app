import React from 'react';
import cc from 'classcat';
import style from './style.module.css';

const Button = ({ buttonType, full = false, children, ...rest }) => (
    <button
        className={cc({
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
