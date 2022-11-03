[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HemmeligOrg_Hemmelig.app&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HemmeligOrg_Hemmelig.app)
[![Better Uptime Badge](https://betteruptime.com/status-badges/v1/monitor/he71.svg)](https://betteruptime.com/?utm_source=status_badge)

<div align="center">
  <img src="banner.png" alt="hemmelig" />
</div>

<h1 align="center">Free encrypted secret sharing for everyone!</h1>

<div align="center">
  This application is to be used to share encrypted secrets cross organizations, or as private persons. Hemmelig truly cares about your privacy, and will do everything to stay that way. I hope you enjoy the product.
</div>



## SaaS

Hemmelig is available at [https://hemmelig.app](https://hemmelig.app)

![Desktop](desktop.png)


## How it works

You enter [https://hemmelig.app](https://hemmelig.app), write your sensitive information, expire time, optional password, and click create a secret link. You share the secret link. The receiver of the link opens it, writes the optional password, and retrieves the sensitive information.
When a secret link is created, it gets its unique encryption key that is not saved to the database and only will be part of the URL. This is how the encryption works: `encrypt(DATA, YOUR_UNIQUE_ENCRYPTION_KEY)`. The encryption of the text and files is done in the client; this means the server will get the encrypted information, and nothing in clear text.

## Features

- Client side encryption
- Encrypted sensitive information sharing
- Encrypted file upload for signed in users
- Secret lifetime
- Set max views per secret
- Optional encrypted title
- Optional password protection
- Optional IP address restriction
- QR Code of the secret link
- Encrypted key is part of the URL, and not saved to the database for an extra layer of security
- It will detect if the secret is base64 encoded, and add a button to convert it to plain text on read
- Self-hosted version. Keywords: Regulatory compliance
- CLI Support

## Linode Referral

Hemmelig.app is running on Linode, and is not being sponsored by anyone. If you want to support Hemmelig, and use Linode. Here is a referral link that we get free credit if you use. By using this link you will get $100 of credit as well: [https://www.linode.com/lp/refer/?r=a47390eeafc5a46b8e5407a5d2bf28368d474993](https://www.linode.com/lp/refer/?r=a47390eeafc5a46b8e5407a5d2bf28368d474993)

## Docker image

- hemmeligapp/hemmelig:bleeding-edge (pushed on every commit to main)
- hemmeligapp/hemmelig:weekly (pushed every week on Friday)
- hemmeligapp/hemmelig:daily
- hemmeligapp/hemmelig:v3.4.0 (see the github tags)
- hemmeligapp/hemmelig:latest (pushed on releases)

## Self-hosting

If you have to follow some sort of compliance, and have to self-host, [https://hemmelig.app](https://hemmelig.app) is available as a docker image. The following is the bare minimum to run the docker image.

```bash
# To use this image you need a redis database enabled.
# Example:
#
# $ docker run -p 6379:6379 --name some-redis -d redis
#

docker run -p 3000:3000 -d --name=hemmelig \
    -e SECRET_REDIS_HOST=127.0.0.1 \
    -v /var/tmp/hemmelig:/var/tmp/hemmelig/upload/files # this is how you mount a local directory if you choose to use disk upload, and not do/s3
    hemmeligapp/hemmelig:latest
```

Alternatively you can use [docker-compose](https://docs.docker.com/compose/):

```bash
# get docker-compose.yml
wget https://raw.githubusercontent.com/HemmeligOrg/Hemmelig.app/main/docker-compose.yml

# start hemmelig & redis
docker-compose up -d

# stop container
docker-compose down
```

Have a look at the Dockerfile for a full example of how to run this application.

## CLI

Hemmelig can be used as a CLI to create secrets on the fly

```bash
    Usage
      $ hemmelig <secret>

    Options
      --title,            -t   The secret title
      --password,         -p   The password to protect the secret
      --passwordPrompt,   -pp  Use a prompt for the password (password will not be shown in the terminal)
      --lifetime,         -l   The lifetime of the secret
      --maxViews,         -m   The max views of the secret
      --cidr,             -c   Provide the IP or CIDR range
      --expire,           -e   Burn the secret only after the expire time
      --url,              -u   If you have your own instance of the Hemmelig.app

    Examples
      $ hemmelig "my super secret" --password=1337
      [*] Hemmelig.app URL: https://hemmelig.app/secret/myencryptionkey/thesecretid

      # Pipe data to the hemmelig cli
      $ cat mysecret.txt | hemmelig
      [*] Hemmelig.app URL: https://hemmelig.app/secret/myencryptionkey2/thesecretid2

      $ npx hemmelig "my super secret" -x
      password: ****
      [*] Hemmelig.app URL: https://hemmelig.app/secret/myencryptionkey/thesecretid
```

## Environment variables

| ENV vars                      | Description                                                           | Default            |
| ------------------------------|:---------------------------------------------------------------------:| ------------------:|
| `SECRET_LOCAL_HOSTNAME`       | The local hostname for the fastify instance                           | 0.0.0.0            |
| `SECRET_PORT`                 | The port number for the fastify instance                              | 3000               |
| `SECRET_HOST`                 | Used for i.e. set cors to your domain name                            | ""                 |
| `SECRET_REDIS_HOST`           | Override this for your redis host address                             | ""                 |
| `SECRET_REDIS_PORT`           | The redis port number                                                 | 6379               |
| `SECRET_REDIS_TLS`            | If the redis instance is using tls                                    | false              |
| `SECRET_REDIS_USER`           | Your redis user name                                                  | ""                 |
| `SECRET_REDIS_PASSWORD`       | Your redis password                                                   | ""                 |
| `SECRET_MAX_TEXT_SIZE`        | The max text size for the secret. Is set in kb. i.e. 256 for 256kb.   | 256                |
| `SECRET_JWT_SECRET`           | Override this for the secret signin JWT tokens for log in             | good_luck_have_fun |
| `SECRET_FILE_SIZE`            | Set the total allowed upload file size in mb.                         | 4                  |
| `SECRET_ENABLE_FILE_UPLOAD`   | Enable or disable file upload                                         | true               |
| `SECRET_DISABLE_USERS`        | Disable user registration                                            | false              |
| `SECRET_FORCED_LANGUAGE`      | Set the default language for the application.                         | en                 |
| `SECRET_DO_SPACES_ENDPOINT`   | The Digital Ocean Spaces/AWS s3 endpoint                              | ""                 |
| `SECRET_DO_SPACES_KEY`        | The Digital Ocean Spaces/AWS s3 key                                   | ""                 |
| `SECRET_DO_SPACES_SECRET`     | The Digital Ocean Spaces/AWS s3 secret                                | ""                 |
| `SECRET_DO_SPACES_BUCKET`     | The Digital Ocean Spaces/AWS s3 bucket name                           | ""                 |
| `SECRET_DO_SPACES_FOLDER`     | The Digital Ocean Spaces/AWS s3 folder for the uploaded files         | ""                 |

## Supported languages

Have a look at the `public/locales/` folder.

## Run locally

```bash
# First you have to run redis
# Example by using docker
docker run -itd -p 6379:6379 redis

npm install

# Start the frontend/backend
npm run dev
# http://0.0.0.0:3000

```

## Discord
[Discord](https://discord.gg/NUkvtKdjs7)

## My lovely contributors
<a href="https://github.com/HemmeligOrg/Hemmelig.app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=HemmeligOrg/Hemmelig.app" />
</a>

## Contribution

Feel free to contribute to this repository. Have a look at CONTRIBUTION.md for guidelines.
