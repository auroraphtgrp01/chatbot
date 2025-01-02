# Sử dụng node image làm base
FROM node:20-slim

RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY tsconfig.json ./
COPY .yarn ./.yarn

RUN yarn install

COPY . .
RUN rm -rf src

RUN yarn build

EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["yarn", "start"]
