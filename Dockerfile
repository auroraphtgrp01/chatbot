# Sử dụng node image làm base
FROM node:20-slim

# Cài đặt corepack và enable yarn
RUN corepack enable

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy toàn bộ code và file cấu hình
COPY . .

# Cài đặt dependencies
RUN yarn install

# Build ứng dụng
RUN yarn build

# Expose port mà Express sẽ chạy
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["yarn", "start"]