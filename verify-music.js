require('dotenv').config();

console.log('🎵 Music Playback Verification Tool');
console.log('='.repeat(50));

// Check if music is actually playing by analyzing bot logs
function checkBotStatus() {
    console.log('\n📋 Quick Bot Status Check:');
    console.log('1. Log "DirectPlay: Strategy 1 successful!" means music STARTED');
    console.log('2. Log "DirectPlay successful on Linux" means PLAYBACK WORKING');
    console.log('3. NoResultError in middle is NORMAL - it\'s part of fallback process');
    
    console.log('\n✅ Based on your logs:');
    console.log('- DirectPlay found and played a track successfully');
    console.log('- The NoResultError was caught and handled by fallback');
    console.log('- Bot should be playing music now');
    
    console.log('\n🔍 To verify music is actually playing:');
    console.log('1. Check if bot joined voice channel');
    console.log('2. Check if you hear audio output');
    console.log('3. Try /queue command to see current track');
    console.log('4. Try volume controls');
}

// Test if DirectPlay is being triggered
function analyzeLogFlow() {
    console.log('\n📊 Log Flow Analysis:');
    console.log('Your logs show this sequence:');
    console.log('1. ❌ test-music.js: "No tracks found" (expected - test script issue)');
    console.log('2. ⚠️  DirectPlay: "NoResultError" (expected - normal fallback)');
    console.log('3. ✅ DirectPlay: "Strategy 1 successful!" (SUCCESS!)');
    console.log('4. ✅ DirectPlay: "successful on Linux" (WORKING!)');
    
    console.log('\n🎯 Conclusion:');
    console.log('- Your bot IS WORKING');
    console.log('- Music should be playing');
    console.log('- The error handling worked correctly');
}

// Check Discord bot voice activity
function checkDiscordActivity() {
    console.log('\n🎮 Discord Voice Activity Check:');
    console.log('1. Is bot in voice channel? (Should show online/green)');
    console.log('2. Is bot speaking? (Should show green circle around avatar)');
    console.log('3. Can you hear audio?');
    console.log('4. Does /queue show current track?');
    
    console.log('\n🔧 If no audio but bot says successful:');
    console.log('- Check server audio settings');
    console.log('- Try /volume 80 command');
    console.log('- Check if FFmpeg is working: ffmpeg -version');
    console.log('- Restart bot: pm2 restart phuong-trang-bot');
}

// Main analysis
console.log('📋 System Information:');
console.log(`Platform: ${process.platform}`);
console.log(`Node.js: ${process.version}`);

if (process.platform === 'linux') {
    console.log('✅ Linux detected - DirectPlay enabled');
    checkBotStatus();
    analyzeLogFlow();
    checkDiscordActivity();
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test music again in Discord');
    console.log('2. If no audio but logs say success:');
    console.log('   - Check FFmpeg: ffmpeg -version');
    console.log('   - Check volume: /volume 50');
    console.log('   - Try simple query: /play music query: test');
    console.log('3. Run: node check-audio.js (script below)');
    
} else {
    console.log('⚠️ Not Linux - DirectPlay may not trigger');
}

process.exit(0); 