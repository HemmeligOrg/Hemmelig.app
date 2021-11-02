import React from 'react';
import cc from 'classcat';

import style from './style.module.css';

const InputGroup = ({ direction, children }) => (
    <div
        className={cc({
            [style.inputGroup]: true,
            [style.inputGroupRow]: direction === 'row',
        })}
    >
        {children}
    </div>
);

export default InputGroup;
