# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build

# Set the working directory
WORKDIR /app

COPY .env . 

# Copy package.json and package-lock.json from frontend
COPY front/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend application code, excluding node_modules
COPY front/ .

COPY shared-data ./shared-data

# Build the frontend
RUN npm run build

# Stage 2: Set up the backend and serve the frontend
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json from backend
COPY back/package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend application code, excluding node_modules
COPY back/ .

COPY shared-data ./shared-data

# Copy the frontend build files from the previous stage
COPY --from=frontend-build /app/dist ./dist

# Command to run the app
CMD ["node", "index.js"]
