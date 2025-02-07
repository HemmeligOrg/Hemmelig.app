# Bare minimum run
# ------------------------------
# $ docker run -p 3000:3000 -d --name=hemmelig \
#   -v ./data/hemmelig/:/var/tmp/hemmelig/upload/files \
#   -v ./database/:/home/node/hemmelig/database/ \
#   hemmeligapp/hemmelig:v5.0.0

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json vite.config.js ./

RUN npm install

COPY . .

ARG GIT_SHA
ARG GIT_TAG
ENV GIT_SHA=${GIT_SHA}
ENV GIT_TAG=${GIT_TAG}

ENV NODE_ENV=production

RUN npm run build


# Get ready for step two of the docker image build
FROM node:20-alpine

RUN apk add curl openssl --no-cache

WORKDIR /home/node/hemmelig

COPY --from=0 /usr/src/app/client/build client/build

COPY package*.json ./

RUN npm ci --production --ignore-scripts

RUN chown -R node:node ./

COPY . .
RUN rm -f *.mp4 *.gif

RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "start"]
