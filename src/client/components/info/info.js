import React from 'react';
import cc from 'classcat';
import style from './style.module.css';

const Error = ({ children, align = '' }) => (
    <p className={cc([style.info, style[align]])}>{children}</p>
);

export default Error;
