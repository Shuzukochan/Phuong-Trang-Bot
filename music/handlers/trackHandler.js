const { EmbedBuilder } = require("discord.js");
const { requesters, requesterUsers } = require("../../commands/music/play");
const { autoplayCollection } = require('../../firebase.js');
const { createMusicCard } = require('./cardHandler');
const { createActionRow1 } = require('../utils/playerUtils');
const { sendMessageWithPermissionsCheck } = require('../utils/messageUtils');
const { setupCollector } = require('./buttonHandler');
const { guildTrackMessages } = require('./lyricsHandler');

// Global tracking maps
const guildCurrentTracks = new Map();
const guildDisconnectTimeouts = new Map();
const guildProgressIntervals = new Map(); // Track progress update intervals

async function handleTrackStart(client, player, track) {
    const channel = client.channels.cache.get(player.textChannel);
    const guildId = player.guildId;
    const trackUri = track.info.uri;
    const requester = requesters.get(trackUri);

    // Clear any existing disconnect timeout when a new track starts
    const existingTimeout = guildDisconnectTimeouts.get(guildId);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
        guildDisconnectTimeouts.delete(guildId);
        console.log(`🔄 Cleared disconnect timeout for guild: ${guildId} - new track started`);
    }

    // Store current track info for later use
    guildCurrentTracks.set(guildId, {
        info: track.info,
        requester: requesters.get(trackUri)
    });

    // Set voice channel status
    try {
        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        if (voiceChannel && voiceChannel.type === 2) { // Voice channel type
            // Use REST API to set voice channel status
            await client.rest.put(
                `/channels/${player.voiceChannel}/voice-status`,
                {
                    body: {
                        status: `:cd: Now playing: ${track.info.title}`
                    }
                }
            );
            console.log(`🎤 Set voice channel status: ${track.info.title}`);
        }
    } catch (error) {
        console.error("Error setting voice channel status:", error);
    }

    try {
        const requesterUser = requesterUsers.get(trackUri);
        const { embed } = await createMusicCard(track.info, requester, false, 0, requesterUser);

        // Lấy trạng thái autoplay cho guild này
        const autoplaySetting = await autoplayCollection.findOne({ guildId });
        const isAutoplayEnabled = autoplaySetting?.autoplay || false;

        const [actionRow1, actionRow2] = createActionRow1(false, player.paused, isAutoplayEnabled, player.loop);

        const message = await sendMessageWithPermissionsCheck(channel, embed, null, actionRow1, actionRow2);
        
        if (message) {
            // Stop progress interval cũ và xóa message cũ nếu có
            if (guildTrackMessages.has(guildId)) {
                // Clear progress interval trước
                if (guildProgressIntervals.has(guildId)) {
                    clearInterval(guildProgressIntervals.get(guildId));
                    guildProgressIntervals.delete(guildId);
                }
                
                const oldMessages = guildTrackMessages.get(guildId);
                for (const msgData of oldMessages) {
                    try {
                        const oldChannel = client.channels.cache.get(msgData.channelId);
                        if (oldChannel) {
                            const oldMessage = await oldChannel.messages.fetch(msgData.messageId);
                            if (oldMessage) {
                                await oldMessage.delete();
                            }
                        }
                    } catch (error) {
                        // Im lặng, không log error khi xóa message cũ
                    }
                }
            }

            // Store the new track message for this guild (thay thế hoàn toàn)
            guildTrackMessages.set(guildId, [{
                messageId: message.id,
                channelId: channel.id,
                type: 'track'
            }]);

            // Set up progress bar update interval
            const interval = setInterval(async () => {
                try {
                    // Get current position from player
                    const currentTime = player.position || 0;
                    const trackDuration = track.info.length;
                                        
                    // Stop if track finished - với buffer 1 giây để tránh race condition
                    if (currentTime >= trackDuration - 1000) {
                        clearInterval(interval);
                        guildProgressIntervals.delete(guildId);
                        console.log("🛑 Progress interval detected track completion - clearing");
                        
                        // Trigger completion logic if trackEnd event missed
                        setTimeout(async () => {
                            await updateTrackCardToFinished(client, player);
                        }, 1000);
                        return;
                    }
                    
                    // Check if player still exists and is connected
                    if (!player || !player.connected) {
                        clearInterval(interval);
                        guildProgressIntervals.delete(guildId);
                        console.log("🛑 Stopping progress updates - player disconnected");
                        return;
                    }

                    // Update progress bar
                    const requesterUser = requesterUsers.get(track.info.uri);
                    const { embed } = await createMusicCard(track.info, requester, false, currentTime, requesterUser);
                    
                    // Lấy trạng thái autoplay cho guild này
                    const autoplaySetting = await autoplayCollection.findOne({ guildId });
                    const isAutoplayEnabled = autoplaySetting?.autoplay || false;
                    
                    const [actionRow1, actionRow2] = createActionRow1(false, player.paused, isAutoplayEnabled, player.loop);

                    await message.edit({
                        embeds: [embed],
                        components: [actionRow1, actionRow2]
                    });
                    
                } catch (error) {
                    // Nếu message bị xóa (Unknown Message), stop interval im lặng
                    if (error.code === 10008) {
                        clearInterval(interval);
                        guildProgressIntervals.delete(guildId);
                        return;
                    }
                    
                    // Các lỗi khác mới log
                    console.error("Error updating progress:", error);
                    clearInterval(interval);
                    guildProgressIntervals.delete(guildId);
                }
            }, 5000); // Update every 5 seconds

            // Store interval for cleanup
            guildProgressIntervals.set(guildId, interval);

            const collector = setupCollector(client, player, channel, message);
        }

    } catch (error) {
        console.error("Error creating or sending music card:", error.message);
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription("⚠️ **Unable to load track card. Continuing playback...**");
        await channel.send({ embeds: [errorEmbed] });
    }
}

async function handleTrackEnd(client, player) {
    console.log("🎵 Track ended, updating music card...");
    
    // Clear progress interval immediately and forcefully
    const guildId = player.guildId;
    const interval = guildProgressIntervals.get(guildId);
    if (interval) {
        clearInterval(interval);
        guildProgressIntervals.delete(guildId);
        console.log(`🔄 CLEARED progress interval for guild: ${guildId}`);
    } else {
        console.log(`⚠️ No interval found for guild: ${guildId}`);
    }
    
    // Clear voice channel status when track ends (in case no more tracks)
    try {
        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        const guild = client.guilds.cache.get(guildId);
        const botVoiceState = guild?.voiceStates?.cache?.get(client.user.id);
        
        console.log(`🔍 Track end debug:`);
        console.log(`   - Queue size: ${player.queue.size}`);
        console.log(`   - Voice channel exists: ${!!voiceChannel}`);
        console.log(`   - Bot in voice channel: ${!!botVoiceState}`);
        console.log(`   - Bot voice channel ID: ${botVoiceState?.channelId}`);
        
        if (voiceChannel && voiceChannel.type === 2) {
            try {
                // Only try to clear status if bot is still in voice channel
                if (botVoiceState && botVoiceState.channelId === player.voiceChannel) {
                    await client.rest.put(
                        `/channels/${player.voiceChannel}/voice-status`,
                        {
                            body: {
                                status: null
                            }
                        }
                    );
                    console.log(`🎤 Cleared voice channel status for guild: ${guildId}`);
                } else {
                    console.log(`⚠️ Bot not in voice channel, skipping status clear`);
                }
            } catch (restError) {
                console.log(`❌ Failed to clear voice status:`, restError.message);
            }
        }
    } catch (error) {
        console.error("Error clearing voice channel status on track end:", error);
    }
    
    // Update the music card to show it's finished - no delay needed since interval is cleared
    await updateTrackCardToFinished(client, player);
}

async function updateTrackCardToFinished(client, player) {
    const guildId = player.guildId;
    const messages = guildTrackMessages.get(guildId) || [];
    
    console.log(`📝 Attempting to update track card for guild: ${guildId}`);
    console.log(`📨 Found ${messages.length} messages to check`);
    
    for (const messageInfo of messages) {
        if (messageInfo.type === 'track') {
            try {
                const channel = client.channels.cache.get(messageInfo.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(messageInfo.messageId).catch(() => null);
                    if (message) {
                        console.log("📤 Found message to update");
                        
                        // Get track info from stored data or player
                        const storedTrack = guildCurrentTracks.get(guildId);
                        let track = storedTrack?.info || player.current?.info || player.previousTrack?.info;
                        let requester = storedTrack?.requester;
                        
                        if (!track) {
                            console.log("❌ No track info available, skipping update");
                            return;
                        }
                        console.log(`🎵 Updating card for track: ${track.title}`);

                        const requesterUser = requesterUsers.get(track.uri);
                        const { embed } = await createMusicCard(track, requester, true, track.length, requesterUser);

                        // Create disabled action row
                        const [actionRow1, actionRow2] = createActionRow1(true, false, false, "none");

                        // Update the message
                        await message.edit({
                            embeds: [embed],
                            components: [actionRow1, actionRow2]
                        });
                        
                        console.log("✅ Successfully updated music card to FINISHED state");
                    } else {
                        console.log("❌ Message not found");
                    }
                } else {
                    console.log("❌ Channel not found");
                }
            } catch (error) {
                console.error("❌ Error updating track card to finished:", error);
            }
        }
    }
}

async function handleQueueEnd(client, player) {
    const channel = client.channels.cache.get(player.textChannel);
    const guildId = player.guildId;

    try {
        const autoplaySetting = await autoplayCollection.findOne({ guildId });

        if (autoplaySetting?.autoplay) {
            const nextTrack = await player.autoplay(player);

            if (!nextTrack) {
                player.destroy();
                await channel.send("⚠️ **No more tracks to autoplay. Disconnecting...**");
            }
        } else {
            // Clear voice channel status
            try {
                const voiceChannel = client.channels.cache.get(player.voiceChannel);
                if (voiceChannel && voiceChannel.type === 2) {
                    await client.rest.put(
                        `/channels/${player.voiceChannel}/voice-status`,
                        {
                            body: {
                                status: null
                            }
                        }
                    );
                    console.log(`🎤 Cleared voice channel status for guild: ${guildId}`);
                }
            } catch (error) {
                console.error("Error clearing voice channel status:", error);
            }
            
            console.log(`Autoplay is disabled for guild: ${guildId} - setting disconnect timeout`);
            
            // Set a timeout for disconnection
            const timeoutId = setTimeout(async () => {
                try {
                    const currentPlayer = client.riffy.players.get(guildId);
                    
                    console.log(`🔍 Checking disconnect conditions for guild ${guildId}:`);
                    if (currentPlayer) {
                        console.log(`   - Queue size: ${currentPlayer.queue.size}`);
                        console.log(`   - Player state: ${currentPlayer.state || 'unknown'}`);
                        console.log(`   - Is playing: ${currentPlayer.playing || false}`);
                    }
                    
                    if (currentPlayer && 
                        currentPlayer.queue.size === 0 && 
                        !currentPlayer.playing) {
                        console.log(`⏰ 3 minutes passed for guild ${guildId}, disconnecting...`);
                        
                        // Clear voice channel status before destroying player
                        try {
                            const voiceChannel = client.channels.cache.get(currentPlayer.voiceChannel);
                            if (voiceChannel && voiceChannel.type === 2) {
                                await client.rest.put(
                                    `/channels/${currentPlayer.voiceChannel}/voice-status`,
                                    {
                                        body: {
                                            status: null
                                        }
                                    }
                                );
                                console.log(`🎤 Cleared voice channel status on timeout for guild: ${guildId}`);
                            }
                        } catch (error) {
                            console.error("Error clearing voice channel status on timeout:", error);
                        }
                        
                        currentPlayer.destroy();
                        await channel.send("⏰ **3 minutes have passed. Disconnecting from voice channel.**");
                    } else {
                        console.log(`⏰ Not disconnecting guild ${guildId} - conditions not met`);
                    }
                } catch (error) {
                    console.error("Error in disconnect timeout:", error);
                }
                guildDisconnectTimeouts.delete(guildId);
            }, 180000); // 3 minutes timeout
            
            // Store the timeout so we can clear it if a new song starts
            guildDisconnectTimeouts.set(guildId, timeoutId);
        }
    } catch (error) {
        console.error("Error handling autoplay:", error);
        player.destroy();
        await channel.send("👾**Queue Empty! Disconnecting...**");
    }
}

async function handlePlayerDisconnect(client, player) {
    const guildId = player.guildId;
    
    // Clear any existing disconnect timeout when player disconnects
    const existingTimeout = guildDisconnectTimeouts.get(guildId);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
        guildDisconnectTimeouts.delete(guildId);
    }
    
    // Clear voice channel status when player disconnects
    try {
        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        if (voiceChannel && voiceChannel.type === 2) {
            await client.rest.put(
                `/channels/${player.voiceChannel}/voice-status`,
                {
                    body: {
                        status: null
                    }
                }
            );
            console.log(`🎤 Cleared voice channel status on disconnect for guild: ${guildId}`);
        }
    } catch (error) {
        console.error("Error clearing voice channel status on disconnect:", error);
    }
    
    console.log(`🔌 Player disconnected for guild: ${guildId} - keeping music cards visible`);
}

module.exports = {
    handleTrackStart,
    handleTrackEnd,
    handleQueueEnd,
    handlePlayerDisconnect,
    guildCurrentTracks,
    guildDisconnectTimeouts
};
