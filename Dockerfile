# To use this image you need a redis database enabled.
# Example:
#
# $ docker run -p 6379:6379 --name some-redis -d redis
#
# Bare minimum run
# ------------------------------
# $ docker run -p 3000:3000 -d --name=hemmelig \
#   -e SECRET_REDIS_HOST=127.0.0.1 \
#   hemmeligapp/hemmelig:latest


FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build


# Get ready for step two of the docker image build
FROM node:lts-alpine

RUN addgroup --gid 10001 --system nonroot \
    && adduser --uid 10000 --system --ingroup nonroot --home /home/nonroot nonroot

WORKDIR /home/nonroot/hemmelig

RUN mkdir build
COPY --from=0 /usr/src/app/build build/

RUN chown -R nonroot ./

USER nonroot

COPY package*.json ./

RUN npm ci --production --ignore-scripts

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
