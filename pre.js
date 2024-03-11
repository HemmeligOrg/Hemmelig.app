import config from 'config';
import fs from 'fs';
import template from 'y8';
import html from './html.js';

// This is scripts that has to be run before the
// frontend build process
fs.writeFileSync(
    'client/index.html',
    template(html, { config: `'${JSON.stringify(config.get('__client_config'))}';` })
);
