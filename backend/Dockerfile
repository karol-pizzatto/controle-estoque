FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["node", "index.js"]
