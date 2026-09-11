# Gunakan base image Node.js LTS Debian Slim
FROM node:20-bullseye-slim

# Pasang dependensi Chromium / Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libgbm1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Direktori kerja
WORKDIR /usr/src/app

# Salin package.json
COPY package*.json ./

# Pasang dependensi
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Ekspos port dashboard
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
