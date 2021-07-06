FROM node:alpine

WORKDIR /thumbnailer

RUN apk add --update --no-cache --virtual .gyp \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

COPY package*.json ./

#RUN npm install --only=production
RUN npm install

COPY . .

RUN apk del .gyp

CMD [ "npm", "start" ]
