import { Anchor, Code, Container, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

const ApiDocs = () => {
    return (
        <Container>
            <Stack>
                <Title order={1}>API Docs</Title>

                <Title order={2}>How can I use Hemmelig programmatically?</Title>
                <Text>
                    First of all you have to create an{' '}
                    <Anchor component={Link} to="/signin">
                        account
                    </Anchor>{' '}
                    to obtain your basic auth token.
                </Text>

                <Title order={2}>Endpoints</Title>
                <Code>Coming..</Code>
            </Stack>
        </Container>
    );
};

export default ApiDocs;
