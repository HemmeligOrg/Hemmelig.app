import React, { forwardRef } from 'react';
import style from './style.module.css';

const Input = forwardRef((props, ref) => (
    <input
        className={style.input}
        data-gramm_editor="false"
        data-lpignore="true"
        autoComplete="new-password"
        ref={ref}
        {...props}
    />
));

export default Input;
