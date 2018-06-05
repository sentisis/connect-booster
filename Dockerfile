FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/connect-booster
WORKDIR /usr/src/connect-booster

# Bundle app source
ADD package.json /usr/src/connect-booster
COPY yarn.lock /usr/src/connect-booster
RUN yarn install --production

ADD . /usr/src/connect-booster

ENV NODE_ENV production
ENTRYPOINT [ "yarn", "start" ]