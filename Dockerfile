# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json from frontend
COPY front/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend application code, excluding node_modules
COPY front/ .

COPY shared-data ./shared-data

# Set environment variables for the build
ARG VITE_Genesys_OIDC_CLIENT_ID
ARG VITE_Genesys_OIDC_CLIENT_SECRET
ARG VITE_GENOLINK_SERVER
ARG VITE_GENESYS_SERVER

ENV VITE_Genesys_OIDC_CLIENT_ID=$VITE_Genesys_OIDC_CLIENT_ID
ENV VITE_Genesys_OIDC_CLIENT_SECRET=$VITE_Genesys_OIDC_CLIENT_SECRET
ENV VITE_FRONTEND_DEV_HOST=$VITE_FRONTEND_DEV_HOST
ENV VITE_FRONTEND_DEV_PORT=$VITE_FRONTEND_DEV_PORT
ENV VITE_GENOLINK_SERVER=$VITE_GENOLINK_SERVER
ENV VITE_GENESYS_SERVER=$VITE_GENESYS_SERVER

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

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
