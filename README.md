[![Docker pulls](https://img.shields.io/docker/pulls/hemmeligapp/hemmelig)](https://hub.docker.com/r/hemmeligapp/hemmelig)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HemmeligOrg_Hemmelig.app&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HemmeligOrg_Hemmelig.app)
[![Better Uptime Badge](https://betteruptime.com/status-badges/v1/monitor/he71.svg)](https://betteruptime.com/?utm_source=status_badge)

<div align="center">
  <img src="banner.png" alt="hemmelig" />
</div>

<h1 align="center">Encrypted secret sharing for everyone!</h1>

<div align="center">
  Hemmelig is a encrypted sharing platform that enables secure transmission of sensitive information. All encryption occurs client-side using TweetNaCl, ensuring your data remains encrypted before it reaches our servers. The platform supports both personal and organizational use cases, with features like IP restrictions, expiration controls, and optional password protection. Whether you're sharing credentials, sensitive messages, or confidential files, Hemmelig strives to ensure your data remains private and secure.
</div>

## SaaS

Hemmelig is available at [https://hemmelig.app](https://hemmelig.app)

https://github.com/user-attachments/assets/fb237fdb-d811-4809-9d01-e0bb6e2b50be


## How it works

1. Visit [https://hemmelig.app](https://hemmelig.app) and enter your sensitive information
2. Configure your secret:
   - Set expiration time
   - Add optional password
   - Set view limits or IP restrictions
3. Click "Create secret link" to generate a secure URL
4. Share the generated link with your recipient

The security model works by:

- Generating a unique encryption key for each secret
- Performing all encryption in your browser before sending to the server
- Including the decryption key only in the URL fragment (never stored on server)
- Server only stores the encrypted data, never the plain text or keys

Example encryption flow:

```javascript
encryptedData = encrypt(yourSecretData, uniqueEncryptionKey)
// Only encryptedData is sent to server
// uniqueEncryptionKey is only shared via URL as a fragment.
```

## Hetzner Cloud Referral

Hemmelig is proudly hosted on [Hetzner Cloud](https://hetzner.cloud/?ref=Id028KbCZQoD). Hetzner provides reliable and scalable cloud solutions, making it an ideal choice for hosting secure applications like Hemmelig. By using our [referral link](https://hetzner.cloud/?ref=Id028KbCZQoD), you can join Hetzner Cloud and receive €20/$20 in credits. Once you spend at least €10/$10 (excluding credits), Hemmelig will receive €10/$10 in Hetzner Cloud credits. This is a great opportunity to explore Hetzner's services while supporting Hemmelig.

## Features

### Core Security

- Client-side encryption for all private content
- Decryption key stored only in URL fragment, never in database
- Optional password protection layer
- IP address restriction capabilities
- Rate-limited API for abuse prevention

### Secret Management

- Configurable secret lifetime
- Maximum view count limits
- Optional encrypted titles
- Base64 conversion support
- Rich text formatting with inline image support

### File Handling

- Encrypted file uploads for authenticated users
- File size and type restrictions

### Sharing Options

- Separate sharing of secret link and decryption key
- QR code generation for secret links
- Public paste option:
  - IP address logging for public pastes
  - No file upload support
  - Username-based public paste listing

### User Features

- Extended secret expiration (14 and 28 days)
- Personal file upload management
- Secret listing and deletion
- Account management

### Administrative Controls

- User registration management
- Read-only mode for non-admin users
- File upload restrictions
- User account creation controls
- Organization email domain restrictions

### Analytics Overview

When analytics are enabled (`SECRET_ANALYTICS_ENABLED=true`), administrators and creators have access to detailed visitor analytics through their account dashboard. The analytics system provides:

- Aggregated Monthly visitor analytics showing unique visitors and total visits
- Aggregated secret statistics of the current state of the instance
- Privacy-focused tracking that uses secure HMAC hashing for visitor identification
- Data caching for improved performance

All analytics data excludes bot traffic and respects user privacy by not storing raw IP addresses or personal information.

### Deployment Options

- Self-hosted version available
- SQLite database with Prisma ORM
- CLI support for automation
- Regulatory compliance support

## Docker image

Hemmelig strongly advises you to use the tagged docker images as the main branch will have breaking changes now and then. For Hemmelig versions supporting Redis, use <= v4.4.0.

Supported docker platforms: `amd/64`, `arm/64`.

- hemmeligapp/hemmelig:latest (Is created on each version release)
- hemmeligapp/hemmelig:v5 (Is created on each version release for the major version)
- hemmeligapp/hemmelig:v5.19 (Is created on each version release for the major and minor version)
- hemmeligapp/hemmelig:v5.19.28 see [tags](https://github.com/HemmeligOrg/Hemmelig.app/tags) for all version
- hemmeligapp/hemmelig:weekly (pushed every week on Friday)
- hemmeligapp/hemmelig:daily

## Self-hosting

If you have to follow some sort of compliance, and have to self-host, [https://hemmelig.app](https://hemmelig.app) is available as a docker image. The following is the bare minimum to run the docker image.

```bash
mkdir -p data/hemmelig database
sudo chown 1000:1000 data/hemmelig database

docker run -p 3000:3000 -d --name=hemmelig \
   -v ./data/hemmelig/:/var/tmp/hemmelig/upload/files \ # For the file uploads
   -v ./database/:/home/node/hemmelig/database/ \       # For the sqlite database
   hemmeligapp/hemmelig:v5.19.4
```

Alternatively you can use [docker compose](https://docs.docker.com/compose/):

**NEW**: Sign in with Github and edit the docker-compose.yml here https://www.dockerfile.app/docker-compose/cm2qfl57s00061059n94ruje5

```bash
# fetch docker-compose.yml
wget https://raw.githubusercontent.com/HemmeligOrg/Hemmelig.app/main/docker-compose.yml

# create volumes directories
mkdir -p data/hemmelig database

# set permissions (Node user has UID 1000 within the container)
sudo chown 1000:1000 data/hemmelig database

# start hemmelig 
docker compose up -d

# stop containers
docker compose down
```

Have a look at the Dockerfile for a full example of how to run this application.

## CLI

Hemmelig can be used as a CLI to create secrets on the fly!

```bash
# Pipe data to hemmelig
cat mysecretfile | npx hemmelig

# For the documentaiton
npx hemmelig --help
```

## Environment variables

| ENV vars                        | Description                                                           | Default              |
| --------------------------------|:---------------------------------------------------------------------:| --------------------:|
| `SECRET_LOCAL_HOSTNAME`         | The local hostname for the fastify instance                           | 0.0.0.0              |
| `SECRET_PORT`                   | The port number for the fastify instance                              | 3000                 |
| `SECRET_HOST`                   | Used for i.e. set cors/cookies to your domain name                    | ""                   |
| `SECRET_MAX_TEXT_SIZE`          | The max text size for the secret. Is set in kb. i.e. 256 for 256kb.   | 256                  |
| `SECRET_JWT_SECRET`             | Override this for the secret signin JWT tokens for log in             | good_luck_have_fun   |
| `SECRET_ROOT_USER`              | Override this for the root account username                           | groot                |
| `SECRET_ROOT_PASSWORD`          | This is the root password, override it with your own password         | iamgroot             |
| `SECRET_ROOT_EMAIL`             | This is the root email, override it with your own email               | <groot@hemmelig.app> |
| `SECRET_FILE_SIZE`              | Set the total allowed upload file size in mb.                         | 4                    |
| `SECRET_FORCED_LANGUAGE`        | Set the default language for the application.                         | en                   |
| `SECRET_UPLOAD_RESTRICTION`     | Set the restriction for uploads to signed in users                    | "true"               |
| `SECRET_RATE_LIMIT_MAX`         | The maximum allowed requests each time frame                          | 1000                 |
| `SECRET_RATE_LIMIT_TIME_WINDOW` | The time window for the requests before being rate limited in seconds | 60                   |
| `SECRET_DO_SPACES_ENDPOINT`     | The Digital Ocean Spaces/AWS s3 endpoint                              | ""                   |
| `SECRET_DO_SPACES_KEY`          | The Digital Ocean Spaces/AWS s3 key                                   | ""                   |
| `SECRET_DO_SPACES_SECRET`       | The Digital Ocean Spaces/AWS s3 secret                                | ""                   |
| `SECRET_DO_SPACES_BUCKET`       | The Digital Ocean Spaces/AWS s3 bucket name                           | ""                   |
| `SECRET_DO_SPACES_FOLDER`       | The Digital Ocean Spaces/AWS s3 folder for the uploaded files         | ""                   |
| `SECRET_AWS_S3_REGION`          | The Digital AWS s3 region                                             | ""                   |
| `SECRET_AWS_S3_KEY`             | The Digital AWS s3 key                                                | ""                   |
| `SECRET_AWS_S3_SECRET`          | The Digital AWS s3 secret                                             | ""                   |
| `SECRET_AWS_S3_BUCKET`          | The Digital AWS s3 bucket name                                        | ""                   |
| `SECRET_AWS_S3_FOLDER`          | The Digital AWS s3 folder for the uploaded files                      | ""                   |
| `SECRET_ANALYTICS_ENABLED`      | Enable analytics tracking                                             | "false"              |
| `SECRET_ANALYTICS_HMAC_SECRET`  | The HMAC secret for the analytics tracking                            | "1234567890"         |

## Supported languages

Have a look at the `public/locales/` folder.

## Run locally

```bash
npm install

# Start the frontend/backend
npm run dev
# http://0.0.0.0:3001

```

## Database

Hemmelig moved from using Redis as a backend to sqlite. Here we are using Prisma, and the sqlite file is available here:
`/database/hemmelig.db`. Have a look at the docker-compose.yml file for how to handle the database.

## Admin, roles and settings

Admins have access to adjust certain settings in Hemmelig. If you go to the account -> instance settings, you can see all the settings.

We also have different roles.

- Admin
- Creator
- User

The difference here is that if you i.e. set Hemmelig to be in read only mode, only `admin` and `creator` is allowed to create secrets, but non signed in users, and users with the role `user` can only view them.

Admins are also allowed to create new users in the settings. This is great if you want to limit who your users are by the `disable user account creation` setting.

## My lovely contributors

<a href="https://github.com/HemmeligOrg/Hemmelig.app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=HemmeligOrg/Hemmelig.app" />
</a>

## Contribution

Feel free to contribute to this repository. Have a look at CONTRIBUTION.md for the guidelines.

## Common errors

If this error occurs on the first run of your Hemmelig instance, this means there are some issues with the ownership of the files/directory for the database.

```bash
Datasource "db": SQLite database "hemmelig.db" at "file:../database/hemmelig.db"

Error: Migration engine error:
SQLite database error
unable to open database file: ../database/hemmelig.db
```

If you have any issues with uploading files to your instance, you will need the following as well:

Here is an example of how you would solve that:

```bash
sudo chown -R username.group /home/username/data/
sudo chown -R username.group /home/username/database/
```
