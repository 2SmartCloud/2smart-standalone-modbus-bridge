FROM node:12.5-alpine

RUN apk update \
    && apk add bash git make gcc g++ python linux-headers udev tzdata \
    && npm install serialport --build-from-source

COPY .bin .bin
COPY etc etc
COPY lib lib
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY app.js app.js

RUN npm i --production

CMD npm start