import React from 'react';
import style from './style.module.css';

const Success = ({ children }) => (
    <p className={style.success}>
        Success: <strong>{children}</strong>
    </p>
);

export default Success;
