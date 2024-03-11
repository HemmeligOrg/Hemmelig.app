import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { RouterProvider } from 'react-router-dom';
import appRouter from './routes.jsx';

const HemmeligApplication = () => {
    return (
        <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
                colorScheme: 'dark',
                colors: {
                    hemmelig: [
                        '#ffffff',
                        '#eaf5f4',
                        '#d4ebe9',
                        '#bfe2dd',
                        '#aad8d2',
                        '#95cec7',
                        '#7fc4bc',
                        '#6abab1',
                        '#55b1a5',
                        '#3fa79a',
                        '#2a9d8f',
                    ],
                    'hemmelig-orange': [
                        '#ffffff',
                        '#fff5f0',
                        '#ffeae1',
                        '#ffe0d2',
                        '#ffd5c3',
                        '#ffcbb4',
                        '#ffc1a5',
                        '#ffb696',
                        '#ffac87',
                        '#ffa178',
                        '#ff9769',
                    ],
                },
                fontFamily: 'Inter, sans-serif',
                fontFamilyMonospace: 'Inter, sans-serif',
                headings: { fontFamily: 'Inter, sans-serif' },
            }}
        >
            <ModalsProvider>
                <RouterProvider router={appRouter}></RouterProvider>
            </ModalsProvider>
        </MantineProvider>
    );
};

export default HemmeligApplication;
