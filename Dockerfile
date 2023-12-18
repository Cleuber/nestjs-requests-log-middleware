FROM node:20

WORKDIR /nodejs/src/app

RUN npm install -g @nestjs/cli