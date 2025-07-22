const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const musicIcons = require('../../ui/icons/musicicons.js');

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    return [
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        `${seconds}s`,
    ]
        .filter(Boolean)
        .join(' ');
}

function createActionRow1(disabled, isPaused = false, isAutoplayEnabled = false, loopMode = "none") {
    // Hàng 1: Back, Pause/Play, Next, Loop, Stop
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("prevTrack").setEmoji(musicIcons.prev).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("pauseToggle").setEmoji(isPaused ? musicIcons.play : musicIcons.pause).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("skipTrack").setEmoji(musicIcons.next).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("loopToggle").setEmoji(musicIcons.loop).setStyle(loopMode === "track" ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("stopTrack").setEmoji(musicIcons.stop).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
    
    // Hàng 2: Autoplay, Shuffle, Filter, Queue, Lyrics
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("autoplayToggle").setEmoji(musicIcons.autoplay).setStyle(isAutoplayEnabled ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("shuffleQueue").setEmoji(musicIcons.shuffle).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("showFilters").setEmoji(musicIcons.fillter).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("showQueue").setEmoji(musicIcons.queue).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("showLyrics").setEmoji(musicIcons.lyrics).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
    
    return [row1, row2];
}

function adjustVolume(player, channel, amount) {
    const { sendEmbed } = require('./messageUtils');
    const newVolume = Math.min(100, Math.max(10, player.volume + amount));
    if (newVolume === player.volume) {
        sendEmbed(channel, amount > 0 ? '🔊 **Volume is already at maximum!**' : '🔉 **Volume is already at minimum!**');
    } else {
        player.setVolume(newVolume);
        sendEmbed(channel, `🔊 **Volume changed to ${newVolume}%!**`);
    }
}

function toggleLoop(player, channel) {
    // Chỉ toggle giữa track loop và none (bỏ queue loop)
    player.setLoop(player.loop === "track" ? "none" : "track");
}

function disableLoop(player, channel) {
    const { sendEmbed } = require('./messageUtils');
    player.setLoop("none");
    sendEmbed(channel, "❌ **Loop is disabled!**");
}

module.exports = {
    formatDuration,
    createActionRow1,
    adjustVolume,
    toggleLoop,
    disableLoop
};
