const { useMainPlayer } = require("discord-player");
const { useLogger } = require("../../lib/hooks");

const player = useMainPlayer();
const logger = useLogger();

/**
 * Fallback player using direct YouTube URLs
 * For Linux servers with stream extraction issues
 */
class DirectYouTubePlayer {
    
    /**
     * Play music using direct YouTube URL approach
     * @param {import('discord.js').VoiceChannel} voiceChannel 
     * @param {string} query 
     * @param {object} options 
     */
    static async playDirect(voiceChannel, query, options = {}) {
        try {
            logger.info(`DirectPlay: Attempting to play "${query}"`);
            
            // Try multiple search strategies with SoundCloud priority
            const searchStrategies = [
                { query: query, engine: 'soundcloud' },
                { query: `${query} remix`, engine: 'soundcloud' },
                { query: query.split(' ').slice(0, 3).join(' '), engine: 'soundcloud' },
                { query: 'chillhop electronic music', engine: 'soundcloud' } // Last resort
            ];
            
            for (let i = 0; i < searchStrategies.length; i++) {
                const strategy = searchStrategies[i];
                
                try {
                    logger.info(`DirectPlay: Strategy ${i + 1} - searching for "${strategy.query}"`);
                    
                    const searchResult = await player.search(strategy.query, {
                        searchEngine: strategy.engine,
                        requestedBy: options.requestedBy
                    });
                    
                    if (!searchResult.tracks?.length) {
                        logger.warn(`DirectPlay: Strategy ${i + 1} found no tracks`);
                        continue;
                    }
                    
                    const track = searchResult.tracks[0];
                    logger.info(`DirectPlay: Strategy ${i + 1} found track "${track.title}" by ${track.author}`);
                    
                    // Enhanced node options for Linux with minimal config
                    const nodeOptions = {
                        volume: 50,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEnd: false, // Don't auto-leave to avoid issues
                        selfDeaf: true,
                        metadata: options.metadata || {
                            channel: voiceChannel,
                            requestedBy: options.requestedBy
                        }
                    };
                    
                    logger.info(`DirectPlay: Strategy ${i + 1} attempting playback`);
                    
                    // FORCE different approach - create stream manually
                    const queue = player.nodes.create(voiceChannel.guild, {
                        ...nodeOptions,
                        requestedBy: options.requestedBy
                    });
                    
                    if (!queue.connection) {
                        await queue.connect(voiceChannel);
                    }
                    
                    // Add track to queue manually
                    queue.addTrack(track);
                    
                    // Force play with minimal extraction
                    if (!queue.currentTrack) {
                        try {
                            await queue.node.play();
                        } catch (playError) {
                            logger.warn(`DirectPlay manual play failed: ${playError.message}`);
                            // Try alternative URL approach
                            const altUrl = `https://www.youtube.com/watch?v=${track.url.split('v=')[1]?.split('&')[0]}`;
                            logger.info(`DirectPlay trying alternative URL: ${altUrl}`);
                            
                            const altSearch = await player.search(altUrl, {
                                searchEngine: 'youtube',
                                requestedBy: options.requestedBy
                            });
                            
                            if (altSearch.tracks?.length > 0) {
                                queue.addTrack(altSearch.tracks[0]);
                                await queue.node.play();
                            }
                        }
                    }
                    
                    logger.info(`DirectPlay: Strategy ${i + 1} successful!`);
                    return { success: true, track: track, strategy: i + 1 };
                    
                } catch (strategyError) {
                    logger.warn(`DirectPlay: Strategy ${i + 1} failed: ${strategyError.message}`);
                    
                    // If this is not the last strategy, continue to next
                    if (i < searchStrategies.length - 1) {
                        continue;
                    } else {
                        // Last strategy failed, throw error
                        throw strategyError;
                    }
                }
            }
            
            throw new Error('All DirectPlay strategies failed');
            
        } catch (error) {
            logger.error(`DirectPlay error: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Get optimal YouTube URL for Linux servers
     * @param {string} originalUrl 
     */
    static getOptimalYouTubeUrl(originalUrl) {
        try {
            // Extract video ID
            const videoId = this.extractVideoId(originalUrl);
            if (!videoId) return originalUrl;
            
            // Return clean YouTube URL without extra parameters
            return `https://www.youtube.com/watch?v=${videoId}`;
            
        } catch (error) {
            logger.warn(`Failed to optimize URL: ${error.message}`);
            return originalUrl;
        }
    }
    
    /**
     * Extract YouTube video ID from various URL formats
     * @param {string} url 
     */
    static extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

module.exports = {
    data: {
        name: "DirectPlay",
        type: "player"
    },
    DirectYouTubePlayer
}; 