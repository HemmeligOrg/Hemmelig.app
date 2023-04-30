import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './i18n';
import { LoadingOverlay } from '@mantine/core';

import HemmeligApplication from './client/app';
import configureStore from './client/helpers/configureStore';
import './client/index.css';

const store = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <Suspense
            fallback={
                <LoadingOverlay
                    loaderProps={{ size: 'xl', color: 'green', variant: 'oval' }}
                    overlayOpacity={1}
                    overlayColor="#131313"
                    visible
                />
            }
        >
            <HemmeligApplication />
        </Suspense>
    </Provider>,
    document.getElementById('root')
);
