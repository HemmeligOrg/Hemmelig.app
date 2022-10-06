import React from 'react';
import style from './style.module.css';
import QRCode from 'react-qr-code';
import { Center } from '@mantine/core';

const QRLink = ({ value }) => (
    <Center>
        <div className={style.img}>
            <QRCode
                size={256}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                value={value}
                viewBox={`0 0 256 256`}
            />
        </div>
    </Center>
);

export default QRLink;
