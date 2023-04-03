# Bare minimum run
# ------------------------------
# $ docker run -p 3000:3000 -d --name=hemmelig \
#   -v ./data/hemmelig/:/var/tmp/hemmelig/upload/files \
#   -v ./database/:/home/node/hemmelig/database/ \
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

RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=production

USER node

CMD ["npm", "run", "start"]
