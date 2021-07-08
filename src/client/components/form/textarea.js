import React from 'react';
import cc from 'classcat';
import style from './style.module.css';

const Textarea = ({ compress, thickBorder, isActive, children, ...rest }) => (
    <textarea
        className={cc({
            [style.textarea]: true,
            [style.compress]: compress,
            [style.thick]: thickBorder,
            [style.isActive]: isActive,
        })}
        spellCheck="false"
        autoComplete="off"
        data-gramm_editor="false"
        {...rest}
    >
        {children}
    </textarea>
);

export default Textarea;
