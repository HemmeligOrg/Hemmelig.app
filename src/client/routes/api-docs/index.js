import React from 'react';
import { Link } from 'react-router-dom';
import style from './style.module.css';

import Wrapper from '../../components/wrapper';

import Info from '../../components/info/info';

const ApiDocs = () => {
    return (
        <>
            <Wrapper>
                <h1>API Docs</h1>

                <h2>How can I use Hemmelig programmatically?</h2>
                <Info align="left">
                    First of all you have to create an <Link to="/signin">account</Link> to obtain
                    your basic auth token.
                </Info>

                <h2>Endpoints</h2>
                <code className={style.code}>Coming..</code>
            </Wrapper>
        </>
    );
};

export default ApiDocs;
