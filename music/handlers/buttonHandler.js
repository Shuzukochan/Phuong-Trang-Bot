const { EmbedBuilder } = require("discord.js");
const config = require("../../config.js");
const { sendEmbed } = require('../utils/messageUtils');
const { adjustVolume, toggleLoop, disableLoop } = require('../utils/playerUtils');
const { showLyrics } = require('./lyricsHandler');
const { autoplayCollection } = require('../../firebase.js');
const { requesterUsers } = require("../../commands/music/play");

// Helper function to format time
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setupCollector(client, player, channel, message) {
    const filter = i => [
        'prevTrack', 'pauseToggle', 'skipTrack', 'loopToggle', 'stopTrack',
        'autoplayToggle', 'shuffleQueue', 'showFilters', 'showQueue', 'showLyrics'
    ].includes(i.customId);

    const collector = message.createMessageComponentCollector({ filter, time: 600000 });

    collector.on('collect', async i => {
        await i.deferUpdate();

        const member = i.member;
        const voiceChannel = member.voice.channel;
        const playerChannel = player.voiceChannel;

        if (!voiceChannel || voiceChannel.id !== playerChannel) {
            const vcEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription('🔒 **You need to be in the same voice channel to use the controls!**');
            const sentMessage = await channel.send({ embeds: [vcEmbed] });
            setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
            return;
        }

        handleInteraction(i, player, channel);
    });

    collector.on('end', () => {
        console.log("Collector stopped.");
    });

    return collector;
}

async function handleInteraction(i, player, channel) {
    switch (i.customId) {
        case 'prevTrack':
            // Chức năng quay lại bài trước
            try {
                if (player.queue.previous && player.queue.previous.length > 0) {
                    const previousTrack = player.queue.previous.pop();
                    player.queue.unshift(player.current);
                    player.play(previousTrack);
                } else {
                    // Nếu không có bài trước, restart bài hiện tại
                    player.seekTo(0);
                    
                    const { EmbedBuilder } = require("discord.js");
                    const restartEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setDescription("⏮️ **Restarted current track** (no previous track available)");
                    
                    const sentMessage = await channel.send({ embeds: [restartEmbed] });
                    setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
                }
            } catch (error) {
                console.error("Error with previous track:", error);
            }
            break;
        case 'pauseToggle':
            if (player.paused) {
                player.pause(false);
            } else {
                player.pause(true);
            }
            
            // Không cần update ngay lập tức, để trackHandler interval xử lý
            break;
        case 'stopTrack':
            player.stop();
            player.destroy();
            break;
        case 'skipTrack':
            player.stop();
            break;
        case 'autoplayToggle':
            try {
                const guildId = i.guild.id;
                
                // Lấy trạng thái autoplay hiện tại
                const autoplaySetting = await autoplayCollection.findOne({ guildId });
                const currentAutoplay = autoplaySetting?.autoplay || false;
                const newAutoplay = !currentAutoplay;
                
                // Cập nhật database
                await autoplayCollection.updateOne(
                    { guildId },
                    { $set: { autoplay: newAutoplay } },
                    { upsert: true }
                );
                
                // Cập nhật button để reflect trạng thái mới
                const { createActionRow1 } = require('../utils/playerUtils');
                const { createMusicCard } = require('./cardHandler');
                const track = player.current;
                const requester = player.get("requester") || "Unknown";
                
                if (track) {
                    const currentTime = player.position;
                    const requesterUser = requesterUsers.get(track.info.uri);
                    const { embed } = await createMusicCard(track.info, requester, false, currentTime, requesterUser);
                    const [actionRow1, actionRow2] = createActionRow1(false, player.paused, newAutoplay, player.loop);
                    
                    await i.editReply({
                        embeds: [embed],
                        components: [actionRow1, actionRow2]
                    });
                }
            } catch (error) {
                console.error("Error toggling autoplay:", error);
            }
            break;
        case 'loopToggle':
            toggleLoop(player, channel);
            
            // Không cần update ngay lập tức, để trackHandler interval xử lý
            break;
        case 'shuffleQueue':
            // Shuffle queue
            try {
                if (player.queue.size < 2) {
                    const { EmbedBuilder } = require("discord.js");
                    const noShuffleEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setDescription("🔀 **Need at least 2 songs in queue to shuffle!**");
                    
                    const sentMessage = await channel.send({ embeds: [noShuffleEmbed] });
                    setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
                    return;
                }
                
                player.queue.shuffle();
                
                const { EmbedBuilder } = require("discord.js");
                const shuffleEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`🔀 **Queue shuffled!** \`${player.queue.size}\` songs randomized.`);
                
                const sentMessage = await channel.send({ embeds: [shuffleEmbed] });
                setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
            } catch (error) {
                console.error("Error shuffling queue:", error);
            }
            break;
        case 'showFilters':
            // Hiển thị menu filters
            try {
                const { EmbedBuilder } = require("discord.js");
                const filterEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle("🎛️ Audio Filters")
                    .setDescription("**Available Filters:**\n" +
                        "• `bassboost` - Tăng cường bass\n" +
                        "• `nightcore` - Tăng tốc độ và cao độ\n" +
                        "• `vaporwave` - Làm chậm và bass sâu\n" +
                        "• `8d` - Hiệu ứng âm thanh 8D\n" +
                        "• `karaoke` - Loại bỏ vocal\n" +
                        "• `clear` - Xóa tất cả filter")
                    .setFooter({ text: "Sử dụng /filters <tên filter> để áp dụng" });
                
                await channel.send({ embeds: [filterEmbed] });
            } catch (error) {
                console.error("Error showing filters:", error);
            }
            break;
        case 'showQueue':
            // Hiển thị queue
            try {
                const { EmbedBuilder } = require("discord.js");
                
                if (!player.queue.size) {
                    const emptyQueueEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle("📋 Queue is Empty")
                        .setDescription("No songs in queue. Add some music with `/play`!");
                    
                    await channel.send({ embeds: [emptyQueueEmbed] });
                    return;
                }
                
                const queue = player.queue.map((track, index) => {
                    return `**${index + 1}.** [${track.info.title}](${track.info.uri}) - \`${formatTime(track.info.length)}\``;
                }).slice(0, 10); // Hiển thị 10 bài đầu
                
                const queueEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle("📋 Current Queue")
                    .setDescription(queue.join('\n'))
                    .setFooter({ 
                        text: `${player.queue.size} songs in queue | ${player.queue.size > 10 ? 'Showing first 10' : 'All songs shown'}` 
                    });
                
                await channel.send({ embeds: [queueEmbed] });
            } catch (error) {
                console.error("Error showing queue:", error);
            }
            break;
        case 'showLyrics':
            showLyrics(channel, player);
            break;
    }
}

module.exports = {
    setupCollector,
    handleInteraction
};
