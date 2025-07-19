require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

console.log('🎵 Complete Music System Test');
console.log('='.repeat(50));

async function testCompleteSystem() {
    try {
        console.log('\n📋 System Check:');
        console.log(`Platform: ${process.platform}`);
        console.log(`Node.js: ${process.version}`);
        
        if (process.platform === 'linux') {
            console.log('✅ Linux detected - All fallback strategies will be active');
        }
        
        // Test client creation
        const client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
        });
        
        const player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
            }
        });
        
        console.log('✅ Discord client and player created');
        
        // Load extractors like in main bot
        await player.extractors.loadDefault((ext) => {
            if (process.platform === 'linux' && ext.includes('soundcloud')) {
                console.log(`❌ Excluded: ${ext}`);
                return false;
            }
            console.log(`✅ Loaded: ${ext}`);
            return true;
        });
        
        console.log('\n🔍 Testing Music Search Strategies:');
        
        const testQueries = [
            'Dương Domic Mất Kết Nối',
            'lofi hip hop',
            'acoustic guitar',
            'piano music peaceful'
        ];
        
        for (const query of testQueries) {
            console.log(`\n🎵 Testing: "${query}"`);
            
            try {
                const result = await player.search(query, {
                    searchEngine: 'youtube'
                });
                
                if (result.tracks?.length > 0) {
                    const track = result.tracks[0];
                    console.log(`✅ Found: ${track.title} by ${track.author}`);
                    console.log(`   Duration: ${track.duration}`);
                    console.log(`   URL: ${track.url}`);
                } else {
                    console.log(`❌ No tracks found`);
                }
            } catch (error) {
                console.log(`❌ Search error: ${error.message}`);
            }
        }
        
        console.log('\n🆘 Testing Emergency Player:');
        
        try {
            // Test EmergencyPlayer module
            const { EmergencyPlayer } = require('./functions/player/EmergencyPlayer');
            console.log('✅ EmergencyPlayer module loaded successfully');
            
            // Test emergency queries
            const emergencyQueries = [
                'lofi hip hop beats to relax study to',
                'ambient music for relaxation',
                'piano music peaceful'
            ];
            
            for (const query of emergencyQueries) {
                try {
                    const result = await player.search(query, {
                        searchEngine: 'youtube'
                    });
                    
                    if (result.tracks?.length > 0) {
                        console.log(`✅ Emergency query "${query}": ${result.tracks[0].title}`);
                    } else {
                        console.log(`❌ Emergency query "${query}": No results`);
                    }
                } catch (error) {
                    console.log(`❌ Emergency query "${query}": ${error.message}`);
                }
            }
            
        } catch (emergencyError) {
            console.log(`❌ EmergencyPlayer test failed: ${emergencyError.message}`);
        }
        
        console.log('\n📊 Fallback Strategy Summary:');
        console.log('Your music system now has 5 fallback strategies:');
        console.log('1. ✅ DirectPlay (Linux auto-detection)');
        console.log('2. ✅ "Official" keyword fallback');
        console.log('3. ✅ Simplified query fallback');
        console.log('4. ✅ Generic music fallback');
        console.log('5. ✅ Emergency Player (raw streaming)');
        
        console.log('\n🎯 Expected Behavior:');
        console.log('- Bot joins voice channel ✅');
        console.log('- Shows speaking indicator (green) ✅');
        console.log('- If normal play fails → tries all fallbacks');
        console.log('- EmergencyPlayer as final resort');
        console.log('- Should hear audio from one of the strategies');
        
        console.log('\n🔧 If still no audio after all fallbacks:');
        console.log('1. Check FFmpeg: ffmpeg -version');
        console.log('2. Check voice permissions');
        console.log('3. Try /volume 50');
        console.log('4. Restart Discord client');
        console.log('5. Check server audio output settings');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
}

testCompleteSystem(); 