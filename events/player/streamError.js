const { useLogger } = require("../../lib/hooks");
const { GuildQueueEvent } = require("discord-player");

module.exports = {
	name: GuildQueueEvent.Error,
	type: "Player",
	/**
	 * @param { import('discord-player').GuildQueue } queue
	 * @param { Error } error
	 */
	execute: async (queue, error) => {
		const logger = useLogger();
		
		logger.error("=== STREAM ERROR DEBUG ===");
		logger.error(`Error type: ${error.name}`);
		logger.error(`Error message: ${error.message}`);
		logger.error(`Error stack: ${error.stack}`);
		
		// Log current track info
		const currentTrack = queue.currentTrack;
		if (currentTrack) {
			logger.error("=== CURRENT TRACK INFO ===");
			logger.error(`Title: ${currentTrack.title}`);
			logger.error(`Author: ${currentTrack.author}`);
			logger.error(`URL: ${currentTrack.url}`);
			logger.error(`Duration: ${currentTrack.duration}`);
			logger.error(`Source: ${currentTrack.source}`);
			logger.error(`Query Type: ${currentTrack.queryType}`);
		}
		
		// Log system info
		logger.error("=== SYSTEM INFO ===");
		logger.error(`Platform: ${process.platform}`);
		logger.error(`Node.js: ${process.version}`);
		logger.error(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
		
		// Log voice connection state
		if (queue.connection) {
			logger.error("=== VOICE CONNECTION ===");
			logger.error(`State: ${queue.connection.state.status}`);
			logger.error(`Channel ID: ${queue.connection.joinConfig.channelId}`);
		}
		
		// Send to error log channel
		queue.player.client?.errorLog?.("**🎵 Stream Error**");
		queue.player.client?.errorLog?.(error.message);
		
		// Try to skip to next track if available
		if (queue.tracks.length > 0) {
			logger.info("Attempting to skip to next track due to stream error");
			try {
				queue.node.skip();
			} catch (skipError) {
				logger.error("Failed to skip track:", skipError.message);
			}
		}
	},
}; 