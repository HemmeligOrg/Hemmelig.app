# Hemmelig

Hemmelig aims to be the modern version of onetimesecret. This application is to be used to share encrypted secrets cross organizations, or as private persons. Hemmelig truly cares about your privacy, and will do everything to stay that way. I hope you enjoy the product.

## SaaS

Hemmelig is available at https://hemmelig.app

## State of Hemmelig

Currently, Hemmelig is a MVP (minimum viable product), however, we aim to add many features going forward.

## Self host

It is possible to self host. The instructions (all env variables) are located as comments within the Dockerfile. Here is the bare minimum of running Hemmelig.

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
