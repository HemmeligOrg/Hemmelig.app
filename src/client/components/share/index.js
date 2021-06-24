import { h } from 'preact';
import style from './style.css';

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
                title: 'Hemmelig.app: Here is your URL with sensitive information. It can only be opened once!',
                url,
            });
        } catch (e) {
            console.error(e);
        }
    };

    if (!navigator.share) {
        return (
            <button class={style.share} onClick={() => navigator.clipboard.writeText(url)}>
                <Copy />
                <span class={style.text}>Click to copy and share the secret link</span>
            </button>
        );
    }

    return (
        <button class={style.share} onClick={onClick}>
            <Share />
            <span class={style.text}>Click to Share the secret link</span>
        </button>
    );
};

export default ShareButton;
