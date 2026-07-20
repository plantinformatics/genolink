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
ARG GENESYS_SERVER
ARG GENOTYPE_MAPPING_SOURCE
ARG VITE_DEFAULT_INSTITUTE_CODE
ARG VITE_GENOTYPE_FILTER_STATUS
ARG VITE_PLATFORM
ARG VITE_REQUIRE_GIGWA_CREDENTIALS
ARG BASE_PATH

ENV GENESYS_SERVER=$GENESYS_SERVER
ENV GENOTYPE_MAPPING_SOURCE=$GENOTYPE_MAPPING_SOURCE
ENV VITE_DEFAULT_INSTITUTE_CODE=$VITE_DEFAULT_INSTITUTE_CODE
ENV VITE_GENOTYPE_FILTER_STATUS=$VITE_GENOTYPE_FILTER_STATUS
ENV VITE_PLATFORM=$VITE_PLATFORM
ENV VITE_REQUIRE_GIGWA_CREDENTIALS=$VITE_REQUIRE_GIGWA_CREDENTIALS
ENV BASE_PATH=$BASE_PATH

# Build the frontend
RUN npm run build

# Stage 2: Set up the backend and serve the frontend
FROM node:20-alpine

# Set the working directory
WORKDIR /app/back

# Copy package.json and package-lock.json from backend
COPY back/package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend application code, excluding node_modules
COPY back/ .

COPY shared-data ../shared-data

# Copy the frontend build files from the previous stage
COPY --from=frontend-build /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
