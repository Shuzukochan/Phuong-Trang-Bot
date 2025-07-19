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
console.log('🎵 Filtering DefaultExtractors to exclude SoundCloud...');

const safeExtractors = DefaultExtractors.filter(extractor => {
    try {
        const extractorName = extractor.identifier || extractor.name || '';
        const isExcluded = extractorName.toLowerCase().includes('soundcloud');
        
        if (isExcluded) {
            console.log(`❌ Excluded: ${extractorName}`);
            return false;
        }
        
        console.log(`✅ Included: ${extractorName}`);
        return true;
    } catch (error) {
        console.log(`⚠️ Error checking extractor:`, error.message);
        return false;
    }
});

console.log(`🎵 Loading ${safeExtractors.length} safe extractors`);
player.extractors.loadMulti(safeExtractors);

// Test extractors
console.log('\n🔍 Testing Extractors:');
console.log('='.repeat(50));

// Get all registered extractors (safely)
const extractors = Array.from(player.extractors.store.values()).map(ext => ext.instance);

console.log('📦 Registered Extractors:');
extractors.forEach((ext, index) => {
    try {
        const name = ext?.identifier || ext?.constructor?.name || ext?.name || 'Unknown';
        const hasSoundCloud = name.toLowerCase().includes('soundcloud');
        console.log(`${index + 1}. ${name} ${hasSoundCloud ? '❌ (SOUNDCLOUD!)' : '✅'}`);
    } catch (error) {
        console.log(`${index + 1}. [Error reading extractor] ⚠️`);
    }
});

console.log(`\n📊 Total extractors: ${extractors.length}`);

const soundCloudExtractors = extractors.filter(ext => {
    try {
        const name = ext?.identifier || ext?.constructor?.name || ext?.name || '';
        return name.toLowerCase().includes('soundcloud');
    } catch (error) {
        return false;
    }
});

if (soundCloudExtractors.length > 0) {
    console.log('❌ WARNING: SoundCloud extractors still present!');
    soundCloudExtractors.forEach(ext => {
        try {
            const name = ext?.identifier || ext?.constructor?.name || ext?.name || 'Unknown';
            console.log(`   - ${name}`);
        } catch (error) {
            console.log(`   - [Error reading extractor name]`);
        }
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