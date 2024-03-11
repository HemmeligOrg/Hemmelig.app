import style from './style.module.css';

const Spinner = () => <div className={style.loader}>{t('loading')}...</div>;

export default Spinner;
