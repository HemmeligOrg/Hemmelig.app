import { h } from 'preact';

import style from './style.css';

const Expandable = ({ summary = 'Advanced configuration', children }) => (
    <details class={style.expandable}>
        <summary class={style.title}>{summary}</summary>
        {children}
    </details>
);

export default Expandable;
