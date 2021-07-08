import React from 'react';

import style from './style.module.css';

const Expandable = ({ summary = 'Advanced configuration', children }) => (
    <details className={style.expandable}>
        <summary className={style.title}>{summary}</summary>
        {children}
    </details>
);

export default Expandable;
