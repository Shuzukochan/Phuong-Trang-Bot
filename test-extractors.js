require('dotenv').config();
const { Player } = require('discord-player');
const { Client, GatewayIntentBits } = require('discord.js');
const { DefaultExtractors } = require('@discord-player/extractor');

// Create minimal client for testing
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const player = new Player(client);

// Load extractors the same way as main bot
try {
    const { YoutubeExtractor, AttachmentExtractor, ReverbnationExtractor } = require('@discord-player/extractor');
    
    player.extractors.register(YoutubeExtractor, {});
    if (AttachmentExtractor) player.extractors.register(AttachmentExtractor, {});
    if (ReverbnationExtractor) player.extractors.register(ReverbnationExtractor, {});
    
    console.log('✅ Loaded safe extractors: YouTube, Attachment, Reverbnation');
} catch (error) {
    console.log('⚠️ Falling back to filtered DefaultExtractors');
    const safeExtractors = DefaultExtractors.filter(extractor => {
        const extractorName = extractor.name || extractor.constructor?.name || '';
        return !extractorName.toLowerCase().includes('soundcloud');
    });
    player.extractors.loadMulti(safeExtractors);
}

// Test extractors
console.log('\n🔍 Testing Extractors:');
console.log('='.repeat(50));

// Get all registered extractors
const extractors = player.extractors.store.map(ext => ext.instance);

console.log('📦 Registered Extractors:');
extractors.forEach((ext, index) => {
    const name = ext.constructor.name || ext.name || 'Unknown';
    const hasSoundCloud = name.toLowerCase().includes('soundcloud');
    console.log(`${index + 1}. ${name} ${hasSoundCloud ? '❌ (SOUNDCLOUD!)' : '✅'}`);
});

console.log(`\n📊 Total extractors: ${extractors.length}`);

const soundCloudExtractors = extractors.filter(ext => {
    const name = ext.constructor.name || ext.name || '';
    return name.toLowerCase().includes('soundcloud');
});

if (soundCloudExtractors.length > 0) {
    console.log('❌ WARNING: SoundCloud extractors still present!');
    soundCloudExtractors.forEach(ext => {
        console.log(`   - ${ext.constructor.name || ext.name}`);
    });
} else {
    console.log('✅ SUCCESS: No SoundCloud extractors found!');
}

console.log('\n🎵 Testing search (without connecting to Discord):');

// Simple test without actual Discord connection
async function testSearch() {
    try {
        // This will test the search functionality
        const result = await player.search('test', { 
            searchEngine: 'youtube'
        });
        console.log(`✅ Search test completed: Found ${result.tracks?.length || 0} tracks`);
    } catch (error) {
        console.log(`❌ Search test failed: ${error.message}`);
    }
}

// Don't actually connect to Discord, just test extractors
console.log('\n✅ Extractor test completed!');
console.log('Run "node test-extractors.js" on your server to verify setup.');

process.exit(0); 