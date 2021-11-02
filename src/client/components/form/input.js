import React, { forwardRef } from 'react';
import cc from 'classcat';
import style from './style.module.css';

const Input = forwardRef((props, ref) => (
    <input
        className={cc({
            [style.checkbox]: props.type === 'checkbox',
            [style.input]: true,
        })}
        data-gramm_editor="false"
        data-lpignore="true"
        autoComplete="new-password"
        ref={ref}
        {...props}
    />
));

export default Input;
