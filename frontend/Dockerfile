# 1) Build da aplicação com Vite
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2) Servir os arquivos estáticos com "serve"
FROM node:18-alpine
WORKDIR /app
# instala o serve globalmente
RUN npm install --global serve
# copia a pasta de saída do builder
COPY --from=builder /app/dist ./dist  

# Cloud Run injeta a porta em PORT (padrão 8080)
ENV PORT=8080
EXPOSE 8080

# serve a pasta dist em modo single-page-app
CMD ["serve", "-s", "dist", "-l", "8080"]
