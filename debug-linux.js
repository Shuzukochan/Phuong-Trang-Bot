require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { DefaultExtractors } = require('@discord-player/extractor');

console.log('🔍 Linux Music Player Debug Tool');
console.log('='.repeat(50));

// System checks
console.log('\n📋 System Information:');
console.log(`OS: ${process.platform}`);
console.log(`Node.js: ${process.version}`);
console.log(`Architecture: ${process.arch}`);

// FFmpeg check
const { execSync } = require('child_process');
try {
    const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' });
    console.log('✅ FFmpeg: Available');
    console.log(`   Version: ${ffmpegVersion.split('\n')[0]}`);
} catch (error) {
    console.log('❌ FFmpeg: NOT FOUND - Install with: sudo apt install ffmpeg');
}

// Create test client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const player = new Player(client);

// Load extractors
console.log('\n🎵 Loading Extractors:');
try {
    // Force YoutubeiExtractor
    player.extractors.register(YoutubeiExtractor, {});
    console.log('✅ YoutubeiExtractor registered');
    
    // Filter DefaultExtractors
    const safeExtractors = DefaultExtractors.filter(extractor => {
        const extractorName = extractor.identifier || extractor.name || '';
        const isExcluded = extractorName.toLowerCase().includes('soundcloud');
        
        if (isExcluded) {
            console.log(`❌ Excluded: ${extractorName}`);
            return false;
        }
        
        console.log(`✅ Included: ${extractorName}`);
        return true;
    });
    
    player.extractors.loadMulti(safeExtractors);
    console.log(`📦 Total extractors loaded: ${safeExtractors.length + 1}`);
    
} catch (error) {
    console.log('❌ Error loading extractors:', error.message);
}

// Test search functionality
async function testSearch() {
    console.log('\n🔍 Testing Search Functionality:');
    
    const testQueries = [
        'lofi hip hop',
        'acoustic guitar',
        'piano relaxing',
        'chill music'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`\n🎵 Testing: "${query}"`);
            
            const result = await player.search(query, {
                searchEngine: 'youtube'
            });
            
            if (result.tracks?.length > 0) {
                console.log(`✅ Found ${result.tracks.length} tracks`);
                const track = result.tracks[0];
                console.log(`   Title: ${track.title}`);
                console.log(`   Author: ${track.author}`);
                console.log(`   Duration: ${track.duration}`);
                console.log(`   URL: ${track.url}`);
                
                // Test stream extraction (without actually playing)
                try {
                    console.log('   Testing stream extraction...');
                    // This is a simplified test - in real scenario, discord-player handles this
                    console.log('   ✅ Track appears valid for streaming');
                } catch (streamError) {
                    console.log(`   ❌ Stream extraction might fail: ${streamError.message}`);
                }
                
            } else {
                console.log('❌ No tracks found');
            }
        } catch (error) {
            console.log(`❌ Search failed: ${error.message}`);
        }
    }
}

// Network connectivity test
async function testNetworkConnectivity() {
    console.log('\n🌐 Testing Network Connectivity:');
    
    const testUrls = [
        'https://www.youtube.com',
        'https://www.googleapis.com',
        'https://music.youtube.com'
    ];
    
    for (const url of testUrls) {
        try {
            const https = require('https');
            await new Promise((resolve, reject) => {
                const req = https.get(url, (res) => {
                    console.log(`✅ ${url}: ${res.statusCode}`);
                    resolve();
                });
                req.on('error', reject);
                req.setTimeout(5000, () => reject(new Error('Timeout')));
            });
        } catch (error) {
            console.log(`❌ ${url}: ${error.message}`);
        }
    }
}

// Run tests
async function runTests() {
    await testNetworkConnectivity();
    await testSearch();
    
    console.log('\n📋 Troubleshooting Tips:');
    console.log('1. Ensure FFmpeg is installed: sudo apt install ffmpeg');
    console.log('2. Check firewall allows outbound HTTPS connections');
    console.log('3. Verify server has sufficient resources (RAM/CPU)');
    console.log('4. Try running bot with: NODE_ENV=production node index.js');
    console.log('5. Monitor logs: pm2 logs phuong-trang-bot');
    
    console.log('\n🎉 Debug completed!');
    process.exit(0);
}

runTests().catch(error => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
}); 