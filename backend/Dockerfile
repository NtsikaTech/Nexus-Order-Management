# Use Node.js LTS Alpine image
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"] 