require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

console.log('🎵 Simple Music Player Test for Linux');
console.log('='.repeat(50));

// Test DirectPlay method
async function testDirectPlay() {
    try {
        const client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
        });
        
        const player = new Player(client);
        
        // Force load only YouTube extractor
        const { YoutubeiExtractor } = require('discord-player-youtubei');
        player.extractors.register(YoutubeiExtractor, {});
        console.log('✅ YoutubeiExtractor loaded');
        
        const testQueries = [
            'lofi hip hop',
            'acoustic guitar',
            'piano music',
            'Dương Domic Mất Kết Nối'
        ];
        
        for (const query of testQueries) {
            console.log(`\n🔍 Testing: "${query}"`);
            
            try {
                // Test search only (no actual playback)
                const result = await player.search(query, {
                    searchEngine: 'youtube'
                });
                
                if (result.tracks?.length > 0) {
                    const track = result.tracks[0];
                    console.log(`✅ Found: ${track.title} by ${track.author}`);
                    console.log(`   Duration: ${track.duration}`);
                    console.log(`   URL: ${track.url}`);
                    
                    // Test simplified version
                    const simplified = query.split(' ').slice(0, 3).join(' ');
                    if (simplified !== query) {
                        console.log(`   Simplified query: "${simplified}"`);
                        
                        const simpleResult = await player.search(simplified, {
                            searchEngine: 'youtube'
                        });
                        
                        if (simpleResult.tracks?.length > 0) {
                            console.log(`   ✅ Simplified also works: ${simpleResult.tracks[0].title}`);
                        }
                    }
                    
                } else {
                    console.log(`❌ No tracks found for "${query}"`);
                }
            } catch (error) {
                console.log(`❌ Error searching "${query}": ${error.message}`);
            }
        }
        
        console.log('\n📋 Test Summary:');
        console.log('- If searches work, the issue is in stream extraction');
        console.log('- DirectPlay method should handle stream extraction differently');
        console.log('- Try playing music with the bot to see improved logs');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
}

// Test system info
console.log('📋 System Information:');
console.log(`Platform: ${process.platform}`);
console.log(`Node.js: ${process.version}`);
console.log(`Architecture: ${process.arch}`);

// Check if running on Linux
if (process.platform === 'linux') {
    console.log('✅ Running on Linux - DirectPlay will be used automatically');
} else {
    console.log('⚠️ Not running on Linux - DirectPlay may not trigger');
}

testDirectPlay(); 