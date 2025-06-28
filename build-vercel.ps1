# Vercel Build Script for Dental Clinic Demo
Write-Host "🚀 Starting Vercel build for Dental Clinic Demo..." -ForegroundColor Green

# Copy the clean package.json for web deployment
Write-Host "📦 Using clean package.json for web deployment..." -ForegroundColor Yellow
Copy-Item package.vercel.json package.json -Force

# Install dependencies without scripts to avoid Electron
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install --ignore-scripts

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
