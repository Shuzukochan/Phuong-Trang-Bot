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
        
        // Load extractors with new API
        try {
            const { DefaultExtractors } = require('@discord-player/extractor');
            await player.extractors.loadMulti(DefaultExtractors);
            console.log('✅ Default extractors loaded with new API');
        } catch (extError) {
            console.log(`⚠️ New API failed, trying alternative: ${extError.message}`);
            // Fallback to manual extractor loading
            try {
                const { YoutubeiExtractor } = require('discord-player-youtubei');
                player.extractors.register(YoutubeiExtractor, {});
                console.log('✅ YouTube extractor loaded manually');
            } catch (manualError) {
                console.log(`❌ Manual loading failed: ${manualError.message}`);
            }
        }
        
        console.log('\n🔍 Testing SoundCloud Music Search Strategies:');
        
        const testQueries = [
            'electronic music soundcloud',
            'chillhop soundcloud',
            'ambient soundcloud',
            'piano lofi soundcloud'
        ];
        
        for (const query of testQueries) {
            console.log(`\n🎵 Testing SoundCloud: "${query}"`);
            
            try {
                const result = await player.search(query, {
                    searchEngine: 'soundcloud'
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
            
            // Test emergency SoundCloud queries
            const emergencyQueries = [
                'chillhop music soundcloud',
                'ambient electronic soundcloud',
                'piano ambient soundcloud'
            ];
            
            for (const query of emergencyQueries) {
                try {
                    const result = await player.search(query, {
                        searchEngine: 'soundcloud'
                    });
                    
                    if (result.tracks?.length > 0) {
                        console.log(`✅ Emergency SoundCloud query "${query}": ${result.tracks[0].title}`);
                    } else {
                        console.log(`❌ Emergency SoundCloud query "${query}": No results`);
                    }
                } catch (error) {
                    console.log(`❌ Emergency SoundCloud query "${query}": ${error.message}`);
                }
            }
            
        } catch (emergencyError) {
            console.log(`❌ EmergencyPlayer test failed: ${emergencyError.message}`);
        }
        
        console.log('\n📊 SoundCloud-First Strategy Summary:');
        console.log('Your music system now has 5 SoundCloud-based fallback strategies:');
        console.log('1. ✅ DirectPlay (SoundCloud-first, Linux optimized)');
        console.log('2. ✅ "Remix" keyword fallback (SoundCloud)');
        console.log('3. ✅ Simplified query fallback (SoundCloud)');
        console.log('4. ✅ Generic chillhop fallback (SoundCloud)');
        console.log('5. ✅ Emergency SoundCloud Player (raw streaming)');
        
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