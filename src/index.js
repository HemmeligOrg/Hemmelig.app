import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './i18n';
import { LoadingOverlay } from '@mantine/core';

import App from './client/app';
import configureStore from './client/helpers/configureStore';
import './client/index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

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
            <App />
        </Suspense>
    </Provider>,
    document.getElementById('root')
);

serviceWorkerRegistration.register();
