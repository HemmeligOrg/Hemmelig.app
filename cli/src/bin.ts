#!/usr/bin/env node

import { createSecret, EXPIRATION_TIMES, type ExpirationKey, type SecretOptions } from './index.js';

const VERSION = '1.0.0';

/**
 * Prints help message
 */
function printHelp(): void {
    console.log(`
 _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \\ '_ \` _ \\| '_ \` _ \\ / _ \\ | |/ _\` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\\___|_| |_| |_|_| |_| |_|\\___|_|_|\\__, |
                                         |___/
Create encrypted secrets from the command line

Usage:
  hemmelig <secret> [options]
  echo "secret" | hemmelig [options]
  hemmelig --help

Options:
  -t, --title <title>      Set a title for the secret
  -p, --password <pass>    Protect with a password (if not set, key is in URL)
  -e, --expires <time>     Expiration time (default: 1d)
                           Valid: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 28d
  -v, --views <number>     Max views before deletion (default: 1, max: 9999)
  -b, --burnable           Burn after first view (default: true)
  --no-burnable            Don't burn after first view
  -u, --url <url>          Base URL (default: https://hemmelig.app)
  -h, --help               Show this help message
  --version                Show version number

Examples:
  # Create a simple secret
  hemmelig "my secret message"

  # Create a secret with a title and 7-day expiration
  hemmelig "my secret" -t "API Key" -e 7d

  # Create a password-protected secret
  hemmelig "my secret" -p "mypassword123"

  # Create a secret with 5 views allowed
  hemmelig "my secret" -v 5

  # Pipe content from a file
  cat ~/.ssh/id_rsa.pub | hemmelig -t "SSH Public Key"

  # Use a self-hosted instance
  hemmelig "my secret" -u https://secrets.mycompany.com
`);
}

/**
 * Parses command line arguments
 */
function parseArgs(args: string[]): SecretOptions & { help?: boolean; version?: boolean } {
    const options: SecretOptions & { help?: boolean; version?: boolean } = {
        secret: '',
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        switch (arg) {
            case '-h':
            case '--help':
                options.help = true;
                break;
            case '--version':
                options.version = true;
                break;
            case '-t':
            case '--title':
                options.title = args[++i];
                break;
            case '-p':
            case '--password':
                options.password = args[++i];
                break;
            case '-e':
            case '--expires':
                options.expiresIn = args[++i] as ExpirationKey;
                break;
            case '-v':
            case '--views':
                options.views = parseInt(args[++i], 10);
                break;
            case '-b':
            case '--burnable':
                options.burnable = true;
                break;
            case '--no-burnable':
                options.burnable = false;
                break;
            case '-u':
            case '--url':
                options.baseUrl = args[++i];
                break;
            default:
                // If it doesn't start with -, it's the secret
                if (!arg.startsWith('-') && !options.secret) {
                    options.secret = arg;
                }
                break;
        }
        i++;
    }

    return options;
}

/**
 * Reads from stdin if available
 */
async function readStdin(): Promise<string> {
    return new Promise((resolve) => {
        // Check if stdin is a TTY (interactive terminal)
        if (process.stdin.isTTY) {
            resolve('');
            return;
        }

        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            // Only trim trailing whitespace to preserve internal formatting
            resolve(data.trimEnd());
        });

        // Timeout after 100ms if no data
        setTimeout(() => {
            if (!data) {
                resolve('');
            }
        }, 100);
    });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (options.version) {
        console.log(VERSION);
        process.exit(0);
    }

    if (options.help) {
        printHelp();
        process.exit(0);
    }

    // Try to read from stdin if no secret provided
    if (!options.secret) {
        options.secret = await readStdin();
    }

    if (!options.secret) {
        console.error('Error: No secret provided. Use --help for usage information.');
        process.exit(1);
    }

    // Validate expiration time
    if (options.expiresIn && !(options.expiresIn in EXPIRATION_TIMES)) {
        console.error(`Error: Invalid expiration time "${options.expiresIn}".`);
        console.error('Valid options: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 28d');
        process.exit(1);
    }

    // Validate views
    if (options.views !== undefined && (options.views < 1 || options.views > 9999)) {
        console.error('Error: Views must be between 1 and 9999.');
        process.exit(1);
    }

    try {
        const result = await createSecret(options);
        console.log(result.url);
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

main();
