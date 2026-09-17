FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install Node.js and dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Install Playwright browsers
RUN npx playwright install chromium

# Environment variables
ENV NODE_ENV=production

CMD ["npm", "start"]
