import React from 'react';
import style from './style.module.css';

import { Copy, Share } from '../icon';

const ShareButton = ({ url }) => {
    // For the sake of pre rendered html
    if (!window) {
        return '';
    }

    const onClick = async (e) => {
        e.preventDefault();

        try {
            await navigator.share({
                title: 'Hemmelig.app - Your secret URL',
                url,
            });
        } catch (e) {
            console.error(e);
        }
    };

    if (!navigator.share) {
        return (
            <button className={style.share} onClick={() => navigator.clipboard.writeText(url)}>
                <Copy />
                <span className={style.text}>Click to copy and share the secret link</span>
            </button>
        );
    }

    return (
        <button className={style.share} onClick={onClick}>
            <Share />
            <span className={style.text}>Click to Share the secret link</span>
        </button>
    );
};

export default ShareButton;
