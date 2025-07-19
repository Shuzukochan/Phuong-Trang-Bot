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
            
            // Search for the track
            const searchResult = await player.search(query, {
                searchEngine: 'youtube',
                requestedBy: options.requestedBy
            });
            
            if (!searchResult.tracks?.length) {
                throw new Error('No tracks found');
            }
            
            const track = searchResult.tracks[0];
            logger.info(`DirectPlay: Found track "${track.title}" by ${track.author}`);
            
            // Use specific YouTube URL patterns that work better on Linux
            const directUrl = this.getOptimalYouTubeUrl(track.url);
            logger.info(`DirectPlay: Using optimized URL: ${directUrl}`);
            
            // Create a modified search result with the direct URL
            const directSearch = await player.search(directUrl, {
                searchEngine: 'youtube',
                requestedBy: options.requestedBy
            });
            
            if (!directSearch.tracks?.length) {
                throw new Error('Direct URL search failed');
            }
            
            // Enhanced node options for Linux
            const nodeOptions = {
                volume: 50,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000,
                selfDeaf: true,
                
                // Linux-specific optimizations
                bufferingTimeout: 3000,
                connectionTimeout: 30000,
                
                metadata: options.metadata || {
                    channel: voiceChannel,
                    requestedBy: options.requestedBy
                }
            };
            
            logger.info('DirectPlay: Starting playback with enhanced options');
            
            // Attempt playback
            await player.play(voiceChannel, directSearch, {
                nodeOptions,
                requestedBy: options.requestedBy
            });
            
            logger.info('DirectPlay: Playback started successfully');
            return { success: true, track: directSearch.tracks[0] };
            
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