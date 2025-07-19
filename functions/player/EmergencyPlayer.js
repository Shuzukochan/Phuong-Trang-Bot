const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const { useMainPlayer } = require('discord-player');

// Fix logger import with fallback
let logger;
try {
    logger = require('../../startup/logger');
} catch (e) {
    // Fallback logger if startup/logger not found
    logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.log
    };
}

class EmergencyPlayer {
    constructor() {
        this.connections = new Map();
        this.players = new Map();
    }

    /**
     * Emergency play method using raw @discordjs/voice
     * @param {import('discord.js').VoiceChannel} voiceChannel 
     * @param {string} query 
     * @param {object} options 
     */
    async emergencyPlay(voiceChannel, query, options = {}) {
        try {
            logger.info(`EmergencyPlayer: Starting emergency playback for "${query}"`);
            
            const player = useMainPlayer();
            
            // Try with SoundCloud-based emergency streams
            const emergencyQueries = [
                'chillhop music soundcloud',
                'ambient electronic soundcloud',
                'piano ambient soundcloud',
                'lofi beats soundcloud'
            ];

            // Get or create voice connection
            let connection = this.connections.get(voiceChannel.guild.id);
            
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                
                this.connections.set(voiceChannel.guild.id, connection);
                logger.info('EmergencyPlayer: Voice connection created');
            }

            // Create basic audio player
            const audioPlayer = createAudioPlayer();
            this.players.set(voiceChannel.guild.id, audioPlayer);

            // Try emergency search with existing player
            for (let i = 0; i < emergencyQueries.length; i++) {
                const emergencyQuery = emergencyQueries[i];
                
                try {
                    logger.info(`EmergencyPlayer: Attempt ${i + 1} - searching "${emergencyQuery}"`);
                    
                    // Use existing player with SoundCloud config
                    const searchResult = await player.search(emergencyQuery, {
                        searchEngine: 'soundcloud',
                        requestedBy: options.requestedBy
                    });
                    
                    if (searchResult.tracks?.length > 0) {
                        const track = searchResult.tracks[0];
                        logger.info(`EmergencyPlayer: Found emergency track: ${track.title}`);
                        
                        // Create basic queue manually
                        const queue = player.nodes.create(voiceChannel.guild, {
                            volume: 50,
                            selfDeaf: true,
                            leaveOnEmpty: false,
                            leaveOnEnd: false,
                            metadata: {
                                channel: voiceChannel,
                                requestedBy: options.requestedBy,
                                emergency: true
                            }
                        });
                        
                        // Connect and add track
                        if (!queue.connection) {
                            await queue.connect(voiceChannel);
                        }
                        
                        queue.addTrack(track);
                        
                        // Start playing
                        if (!queue.currentTrack) {
                            await queue.node.play();
                        }
                        
                        logger.info('EmergencyPlayer: Emergency track started successfully');
                        
                        return {
                            success: true,
                            connection: queue.connection,
                            player: audioPlayer,
                            track: track,
                            emergencyQuery: emergencyQuery
                        };
                    }
                    
                } catch (emergencyError) {
                    logger.warn(`EmergencyPlayer: Attempt ${i + 1} failed: ${emergencyError.message}`);
                    continue;
                }
            }

            throw new Error('All emergency searches failed');

        } catch (error) {
            logger.error(`EmergencyPlayer error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Stop emergency playback
     * @param {string} guildId 
     */
    stop(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.stop();
            this.players.delete(guildId);
        }

        const connection = this.connections.get(guildId);
        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }

        logger.info('EmergencyPlayer: Stopped playback');
    }

    /**
     * Set volume (not supported in emergency mode)
     * @param {string} guildId 
     * @param {number} volume 
     */
    setVolume(guildId, volume) {
        logger.info(`EmergencyPlayer: Volume control not available in emergency mode`);
    }
}

module.exports = { EmergencyPlayer: new EmergencyPlayer() }; 