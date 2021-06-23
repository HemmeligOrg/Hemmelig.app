<div align="center">
  <img src="banner.png" alt="hemmelig" />
</div>

<h1 align="center">Free encryptet secret sharing for everyone!</h1>

<div align="center">
  This application is to be used to share encrypted secrets cross organizations, or as private persons. Hemmelig truly cares about your privacy, and will do everything to stay that way. I hope you enjoy the product.
</div>

## SaaS

Hemmelig is available at https://hemmelig.app

## State of Hemmelig

Currently, Hemmelig is a MVP (minimum viable product), however, we aim to add many features going forward.

## Docker image

`hemmeligapp/hemmelig:latest`

## Self-hosting

If you do not trust https://hemmelig.app, or you want to hide it from the public Internet. Hemmelig is available as a Docker image for self-hosting. Here is the bare minimum of running Hemmelig.

```bash
# To use this image you need a redis database enabled.
# Example:
#
# $ docker run -p 6379:6379 --name some-redis -d redis
#

docker run -p 3000:3000 -d --name=hemmelig \
    -e SECRET_MASTER_KEY=11111222223333344444555556666677 \ # has to be a secret key of 32 characters
    -e SECRET_REDIS_HOST=127.0.0.1 \
    hemmeligapp/hemmelig:latest
```

Have a look at the Dockerfile for a full example of how to run this application.

## Environment variables

-   `SECRET_LOCAL_HOSTNAME` Default: 0.0.0.0. - The local hostname for the fastify instance
-   `SECRET_PORT` Default: 3000. - The port number for the fastify instance
-   `SECRET_HOST` Default: "". - Used for i.e. set cors to your domain name
-   `SECRET_MASTER_KEY` Default: 11111222223333344444555556666677 - Override this with your SECRET master key for encryption of your secrets
-   `SECRET_REDIS_HOST` Default: 0.0.0.0 - Override this for your redis host adress
-   `SECRET_REDIS_PORT` Default: 6379 - The redis port number
-   `SECRET_REDIS_TLS` Default: false - If the redis instance is using tls
-   `SECRET_REDIS_USER` Default: "" - You redis user name
-   `SECRET_REDIS_PASSWORD` Default: "" - Your redis password
-   `SECRET_JWT_SECRET` Default: good_luck_have_fun - Override this for the secret signin JWT tokens for log in

## Run locally

```bash
$ npm install

# Start the frontend
$ npm run client-dev
# http://0.0.0.0:8080

# Start the backend
$ npm run server-dev
# http://0.0.0.0:3000
```
