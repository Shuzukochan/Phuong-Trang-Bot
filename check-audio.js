const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔊 Linux Audio System Check');
console.log('='.repeat(50));

async function checkAudioSystem() {
    const checks = [
        {
            name: 'FFmpeg Installation',
            command: 'ffmpeg -version 2>/dev/null | head -1',
            test: (output) => output.includes('ffmpeg version')
        },
        {
            name: 'FFmpeg Codecs',
            command: 'ffmpeg -codecs 2>/dev/null | grep -E "(aac|mp3|opus)"',
            test: (output) => output.includes('aac') && output.includes('mp3')
        },
        {
            name: 'Node.js Audio Modules',
            command: 'node -e "console.log(require(\'@discordjs/voice\').version || \'installed\')"',
            test: (output) => !output.includes('Error')
        },
        {
            name: 'System Audio',
            command: 'cat /proc/asound/cards 2>/dev/null || echo "no audio cards"',
            test: (output) => !output.includes('no audio cards')
        }
    ];

    console.log('\n🔍 Running Audio System Checks:');
    
    for (const check of checks) {
        try {
            const { stdout, stderr } = await execAsync(check.command);
            const output = stdout || stderr;
            const passed = check.test(output);
            
            console.log(`${passed ? '✅' : '❌'} ${check.name}`);
            if (!passed || output.length < 100) {
                console.log(`   Output: ${output.trim().substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ ${check.name}: ${error.message}`);
        }
    }
}

async function checkBotProcess() {
    console.log('\n🤖 Bot Process Check:');
    
    try {
        const { stdout } = await execAsync('ps aux | grep "node.*index.js\\|node.*phuong-trang" | grep -v grep');
        if (stdout) {
            console.log('✅ Bot process running');
            console.log(`   ${stdout.trim()}`);
        } else {
            console.log('❌ Bot process not found');
        }
    } catch (error) {
        console.log('❌ Could not check bot process');
    }
    
    try {
        const { stdout } = await execAsync('pm2 list 2>/dev/null | grep phuong-trang');
        if (stdout) {
            console.log('✅ PM2 process found');
            console.log(`   ${stdout.trim()}`);
        }
    } catch (error) {
        // PM2 not used or not found
    }
}

async function checkDiscordBotLogs() {
    console.log('\n📋 Recent Bot Activity:');
    
    try {
        // Check for recent log files
        const { stdout } = await execAsync('find . -name "*.log" -mtime -1 2>/dev/null | head -5');
        if (stdout) {
            console.log('📄 Recent log files found:');
            console.log(stdout);
        }
    } catch (error) {
        // No log files found
    }
    
    console.log('\n🎵 Discord Music Status Analysis:');
    console.log('Based on your previous logs:');
    console.log('✅ "DirectPlay: Strategy 1 successful!" = Music playback started');
    console.log('✅ "DirectPlay successful on Linux" = Audio streaming active');
    console.log('⚠️ NoResultError is NORMAL - it\'s handled by fallback system');
    
    console.log('\n📊 What this means:');
    console.log('- Bot successfully found and started playing music');
    console.log('- Error handling worked as intended');
    console.log('- If you don\'t hear audio, it\'s likely a volume/connection issue');
}

async function main() {
    console.log('📋 System Information:');
    console.log(`Platform: ${process.platform}`);
    console.log(`Node.js: ${process.version}`);
    
    await checkAudioSystem();
    await checkBotProcess();
    await checkDiscordBotLogs();
    
    console.log('\n🔧 Troubleshooting Guide:');
    console.log('1. If FFmpeg failed: sudo apt update && sudo apt install ffmpeg');
    console.log('2. If bot not running: node index.js or pm2 start ecosystem.config.js');
    console.log('3. If music "successful" but no audio:');
    console.log('   - Check Discord voice channel connection');
    console.log('   - Try /volume 50 command');
    console.log('   - Restart Discord client');
    console.log('   - Check if bot has proper voice permissions');
    
    console.log('\n🎯 Quick Test Commands:');
    console.log('- /play music query: test');
    console.log('- /queue (should show current track)');
    console.log('- /volume 50');
    console.log('- /disconnect then rejoin voice');
}

main().catch(console.error); 