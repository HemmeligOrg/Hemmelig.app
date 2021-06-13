import { h } from 'preact';

import style from './style.css';

const Wrapper = ({ children }) => <section class={style.wrapper}>{children}</section>;

export default Wrapper;
