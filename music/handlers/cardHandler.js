const { EmbedBuilder } = require("discord.js");
const config = require("../../config.js");
const musicIcons = require('../../ui/icons/musicicons.js');
const { formatDuration } = require('../utils/playerUtils');

async function createMusicCard(track, requester, isFinished = false, currentTime = 0, requesterUser = null) {
    try {
        // Tạo progress bar hiện đại
        const duration = track.length || 0;
        const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
        const progressBarLength = 20;
        const filledLength = Math.floor(progress * progressBarLength);
        const emptyLength = progressBarLength - filledLength;

        // Modern progress bar với emoji và Unicode characters
        const filled = '▰'.repeat(filledLength);
        const empty = '▱'.repeat(emptyLength);
        const progressBar = `${filled}${empty}`;
        
        // Format thời gian
        const formatTime = (ms) => {
            const seconds = Math.floor(ms / 1000);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const currentTimeStr = formatTime(currentTime);
        const durationStr = formatTime(duration);
        const progressLine = `${currentTimeStr} | ${progressBar} | ${durationStr}`;
        
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: isFinished ? 'Song Finished' : `Playing ${track.title}`, 
                iconURL: isFinished ? musicIcons.stopIcon : musicIcons.playerIcon,
                url: track.uri // Click vào author sẽ mở link bài hát
            })
            .setFooter({ 
                text: `Yêu cầu bởi: ${requester}`, 
                iconURL: requesterUser?.displayAvatarURL({ size: 1024 }) || musicIcons.heartIcon 
            })
            .setTimestamp()
            .setDescription(  
                `${progressLine}\n` +
                `- **Author:** ${track.author || 'Unknown Artist'}\n` +
                `- **Source:** ${track.sourceName}\n` + 
                (isFinished ? '**- Status:** ✅ **Completed**' : '')
            )
            .setThumbnail(track.thumbnail || 'https://media.discordapp.net/attachments/674531732929904640/788440918256123974/BFL-Official.jpg?ex=6879cc13&is=68787a93&hm=21fef225201d2dcd46717d21dcb32d202a2fb96781b160eea260685a7fb5ba1c&=&format=webp')
            .setColor(isFinished ? '#00FF00' : '#FF8674');

        return { embed };
    } catch (error) {
        console.error("Error creating music card:", error.message);
        throw error;
    }
}

module.exports = {
    createMusicCard
};
