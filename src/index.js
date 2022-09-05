import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './i18n';
import { Suspense } from 'react';

import App from './client/app';
import configureStore from './client/helpers/configureStore';
import './client/index.css';

const store = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <Suspense fallback={<div>Loading... </div>}>
            <App />
        </Suspense>
    </Provider>,
    document.getElementById('root')
);
