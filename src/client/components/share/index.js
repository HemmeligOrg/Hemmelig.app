import { h } from 'preact';
import style from './style.css';

import IconButton from '../icon/icon-button';

const Share = ({ url }) => {
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
            <div class={style.share}>
                <IconButton icon="copy" onClick={() => navigator.clipboard.writeText(url)} />
                Copy and share the secret link
            </div>
        );
    }

    return (
        <div class={style.share}>
            <IconButton icon="share" onClick={onClick} />
            Share the secret link
        </div>
    );
};

export default Share;
