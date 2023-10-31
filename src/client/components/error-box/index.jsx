import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const ErrorBox = ({ message, title = 'home.bummer' }) => {
    const { t } = useTranslation();

    return (
        <Alert
            icon={<IconAlertCircle size="1rem" />}
            title={t(title)}
            color="red"
            variant="outline"
        >
            {message}
        </Alert>
    );
};

export default ErrorBox;
