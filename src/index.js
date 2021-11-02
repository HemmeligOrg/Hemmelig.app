import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './client/app';
import configureStore from './client/helpers/configureStore';
import './client/index.css';

const store = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
