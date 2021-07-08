import React from 'react';
import style from './style.module.css';

const Select = ({ compress, children, ...rest }) => (
    <select className={style.select} {...rest}>
        {children}
    </select>
);

export default Select;
