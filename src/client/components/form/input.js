import { h } from 'preact';
import { forwardRef } from 'preact/compat';
import style from './style.css';

const Input = forwardRef((props, ref) => (
    <input
        class={style.input}
        data-gramm_editor="false"
        data-lpignore="true"
        autocomplete="new-password"
        ref={ref}
        {...props}
    />
));

export default Input;
