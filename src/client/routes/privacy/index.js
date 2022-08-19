import React from 'react';
import { Container, Stack, Title, Text } from '@mantine/core';

const Privacy = () => {
    return (
        <Container>
            <Stack>
                <Title order={1}>Privacy</Title>

                <Title order={2}>Is my data secure?</Title>
                <Text>
                    Yes, your data is secure. Hemmelig is encrypting every message with TweetNACL
                    before saving it to our database. The salt used is both a master key defined by
                    the server, and a user key that is generated for each secret which is not saved
                    to the database. The same is valid for password generation. The only difference
                    is that the password is using the bcrypt algorithm.
                </Text>

                <Title order={2}>Do you track me?</Title>
                <Text>
                    We do not track anything. Hemmelig cares strongly about your privacy. Future
                    wise we might track the status of how many secrets that are being created, which
                    is not personal data, and will be publicly available on this site.
                </Text>

                <Title order={2}>I still don't trust this application.</Title>
                <Text>
                    If that is being the case, Hemmelig offers a docker image to self-host the
                    application.
                </Text>
            </Stack>
        </Container>
    );
};

export default Privacy;
