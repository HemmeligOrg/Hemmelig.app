import { Container, Text } from '@mantine/core';

const Details = ({ user }) => {
    return (
        <Container>
            <Text size="sm">
                Hi, <strong>{user.username}</strong>
            </Text>

            <Text size="sm">
                We are glad you logged in. Here is the list of features signed in users get:
                <ul>
                    <li>Upload files</li>
                    <li>Expiration time of 14 and 28 days for secrets</li>
                    <li>List and delete your secrets</li>
                </ul>
                More features are coming! Thanks for joining Hemmelig.app!
                <span role="img" aria-label="celebration icon">
                    🎉 🎉 🎉 🎉
                </span>
            </Text>
        </Container>
    );
};

export default Details;
