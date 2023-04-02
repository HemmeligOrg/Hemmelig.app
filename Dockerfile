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


FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json vite.config.js ./

RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build


# Get ready for step two of the docker image build
FROM node:18-alpine

WORKDIR /home/node/hemmelig

RUN mkdir build
COPY --from=0 /usr/src/app/build build/

COPY package*.json ./

RUN npm ci --production --ignore-scripts

RUN chown -R node.node ./

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "start"]
