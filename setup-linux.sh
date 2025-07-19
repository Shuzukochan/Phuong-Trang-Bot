#!/bin/bash

echo "🚀 Setting up Phuong Trang Bot for Linux Server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not exists
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install FFmpeg for audio processing
echo "🎵 Installing FFmpeg for audio processing..."
sudo apt install ffmpeg -y

# Install additional audio codecs
echo "🎵 Installing audio codecs..."
sudo apt install -y \
    libav-tools \
    libavcodec-extra \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavutil-dev \
    libpostproc-dev \
    libswresample-dev \
    libswscale-dev

# Install Python build tools (needed for some npm packages)
echo "🔧 Installing build tools..."
sudo apt install -y python3 python3-pip build-essential

# Install PM2 for process management
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Verify installations
echo "✅ Verifying installations..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "FFmpeg version: $(ffmpeg -version | head -1)"
echo "PM2 version: $(pm2 --version)"

# Set up project
echo "📁 Setting up project..."
npm install --production

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'phuong-trang-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create .env file with your credentials"
echo "2. Start bot: pm2 start ecosystem.config.js"
echo "3. Save PM2 config: pm2 save && pm2 startup"
echo "4. View logs: pm2 logs phuong-trang-bot" 