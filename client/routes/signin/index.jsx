import { Button, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconLogin, IconUser } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { userLogin } from '../../actions';
import { signIn } from '../../api/authentication';

const SignIn = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },
    });

    const onSignIn = async (values) => {
        const data = await signIn(values.username, values.password);

        if (data.statusCode === 401) {
            form.setErrors({
                username: "{t('signin.wrong_credentials')}",
                password: "{t('signin.wrong_credentials')}",
            });

            setSuccess(false);

            return;
        }

        if (data.statusCode === 403) {
            setError(data.error);

            setSuccess(false);

            return;
        }

        dispatch(userLogin(data));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignIn(values))}>
                <Stack>
                    <Title order={1} align="center">
                        {t('signin.title')}
                    </Title>

                    <Text size="sm" align="center">
                        {t('signin.heading')}
                    </Text>

                    {error && <ErrorBox message={error} />}

                    <TextInput
                        icon={<IconUser size={14} />}
                        placeholder={t('signin.username')}
                        required
                        autoFocus
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        icon={<IconLock size={14} />}
                        placeholder={t('signin.password')}
                        required
                        {...form.getInputProps('password')}
                    />

                    <Button color="hemmelig" leftIcon={<IconLogin size={14} />} type="submit">
                        {t('signin.signin')}
                    </Button>
                </Stack>
            </form>

            {success && (
                <>
                    <SuccessBox message={'Redirecting to your account page.'} />
                    <Navigate replace to="/account" />
                </>
            )}
        </Container>
    );
};

export default SignIn;
