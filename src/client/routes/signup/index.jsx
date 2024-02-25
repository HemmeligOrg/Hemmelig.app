import { Button, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAt, IconLock, IconLogin, IconUser } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { userLogin } from '../../actions';
import { signUp } from '../../api/authentication';

const SignUp = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            email: '',
        },
    });

    const onSignUp = async (values) => {
        const data = await signUp(values.email, values.username, values.password);

        if (data.statusCode === 403) {
            setError(data.error);

            setSuccess(false);

            return;
        }

        if (data.error) {
            form.setErrors({
                username: data.type == 'username' ? data.error : '',
                password: data.type == 'password' ? data.error : '',
                email: data.type == 'email' ? data.error : '',
            });

            setSuccess(false);

            return;
        }

        dispatch(userLogin(data));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignUp(values))}>
                <Stack>
                    <Title order={1} align="center">
                        {t('signup.title')}
                    </Title>

                    <Text size="sm" align="center">
                        {t('signup.heading')}
                    </Text>

                    {error && <ErrorBox message={error} />}

                    <TextInput
                        icon={<IconAt size={14} />}
                        placeholder={t('signup.email')}
                        required
                        {...form.getInputProps('email')}
                    />

                    <TextInput
                        icon={<IconUser size={14} />}
                        placeholder={t('signup.username')}
                        required
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        icon={<IconLock size={14} />}
                        placeholder={t('signup.password')}
                        required
                        {...form.getInputProps('password')}
                    />

                    <Button color="hemmelig" leftIcon={<IconLogin size={14} />} type="submit">
                        {t('signup.signup')}
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

export default SignUp;
