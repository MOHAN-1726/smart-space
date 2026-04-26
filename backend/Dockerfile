FROM node:20-slim

# Install dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5001

CMD ["npm", "start"]
