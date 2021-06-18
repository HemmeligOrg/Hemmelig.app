import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getToken, hasToken } from '../../helpers/token';
import { Link } from 'preact-router';
import style from './style.css';

import Wrapper from '../../components/wrapper';

import Info from '../../components/info/info';

const ENDPOINTS = `// Example using cURL to create a secret
$ curl 'https://user:token@hemmelig.app/api/secret' \\
    -H 'Content-Type: application/json' \\
    --data-raw '{"text":"MY SECRET :)","password":"not_today","ttl":3600}'

// response: {"id":"jMyQ2wU6Fw-WIEOPOsYzy"}


// Example of fetching a secret
// If this is successful, the secret will be burned
// https://user:token@hemmelig.app/api/secret/:id
$ curl 'https://user:token@hemmelig.app/api/secret/jMyQ2wU6Fw-WIEOPOsYzy' \\
    -H 'Content-Type: application/json' \\
    --data-raw '{"password":"not_today"}'

// response: {"secret":"MY SECRET :)"}


// Example of burning a secret before it is fetched
// https://user:token@hemmelig.app/api/secret/:id/burn
$ curl 'https://user:token@hemmelig.app/api/secret/jMyQ2wU6Fw-WIEOPOsYzy/burn'

// response: {"success":"Secret burned"}
`;

const ApiDocs = () => {
    return (
        <>
            <Wrapper>
                <h1>API Docs</h1>

                <h2>How can I use Hemmelig programmatically?</h2>
                <Info align="left">
                    First of all you have to create an <Link href="/signin">account</Link> to obtain
                    your basic auth token.
                </Info>

                <h2>Endpoints</h2>
                <Info align="left">
                    <strong>Payload:</strong>
                    <Info align="left">The password field is optional</Info>

                    <code class={style.code}>
                        {JSON.stringify(
                            { text: 'MY SECRET :)', password: 'not_today', ttl: 3600 },
                            null,
                            2
                        )}
                    </code>

                    <code class={style.code}>{ENDPOINTS}</code>
                </Info>
            </Wrapper>
        </>
    );
};

export default ApiDocs;
