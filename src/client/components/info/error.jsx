import React from 'react';
import style from './style.module.css';

const ErrorComponent = ({ children }) => (
    <p className={style.error}>
        An error occured: <strong>{children}</strong>
    </p>
);

export default ErrorComponent;
