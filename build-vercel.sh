#!/bin/bash

# Vercel Build Script for Dental Clinic Demo
echo "🚀 Starting Vercel build for Dental Clinic Demo..."

# Copy the clean package.json for web deployment
echo "📦 Using clean package.json for web deployment..."
cp package.vercel.json package.json

# Install dependencies without scripts to avoid Electron
echo "📥 Installing dependencies..."
npm install --ignore-scripts

# Build the project
echo "🔨 Building the project..."
npm run build

echo "✅ Build completed successfully!"
