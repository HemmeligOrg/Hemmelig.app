import { h } from 'preact';
import cc from 'classcat';
import style from './style.css';

const Textarea = ({ compress, thickBorder, children, ...rest }) => (
    <textarea
        class={cc({
            [style.textarea]: true,
            [style.compress]: compress,
            [style.thick]: thickBorder,
        })}
        spellcheck="false"
        autocomplete="off"
        data-gramm_editor="false"
        {...rest}
    >
        {children}
    </textarea>
);

export default Textarea;
