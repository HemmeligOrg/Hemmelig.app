import { Notification } from '@mantine/core';
import { IconCheck } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const SuccessBox = ({ message, title = 'settings.success' }) => {
    const { t } = useTranslation();

    return (
        <Notification
            icon={<IconCheck size="1.1rem" />}
            color="teal"
            title={t(title)}
            withCloseButton={false}
        >
            {t(message)}
        </Notification>
    );
};

export default SuccessBox;
