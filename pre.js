import fs from 'fs';
import config from 'config';
import template from 'y8';
import html from './html.js';

// This is scripts that has to be run before the
// frontend build process
fs.writeFileSync(
    'index.html',
    template(html, { config: `'${JSON.stringify(config.get('__client_config'))}';` })
);
