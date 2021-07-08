import React from 'react';

import Wrapper from '../../components/wrapper';
import Info from '../../components/info/info';

const Privacy = () => {
    return (
        <>
            <Wrapper>
                <h1>Privacy</h1>

                <h2>Is my data secure?</h2>
                <Info align="left">
                    Yes, your data is secure. Hemmelig is encrypting every message with the AES 256
                    algorithm with a dynamic IV before saving it to our database. The salt used is
                    both a master key defined by the server, and a user key that is generated for
                    each secret which is not saved to the database. The same is valid for password
                    generation. The only difference is that the password is using the bcrypt
                    algorithm.
                </Info>

                <h2>Do you track me?</h2>
                <Info align="left">
                    We do not track anything. Hemmelig cares strongly about your privacy. Future
                    wise we might track the status of how many secrets that are being created, which
                    is not personal data, and will be publicly available on this site.
                </Info>

                <h2>I still don't trust this application.</h2>
                <Info align="left">
                    If that is being the case, Hemmelig offers a docker image to self-host the
                    application.
                </Info>
            </Wrapper>
        </>
    );
};

export default Privacy;
