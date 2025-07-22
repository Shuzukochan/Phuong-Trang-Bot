const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require('axios');
const config = require("../../config.js");
const { sendEmbed } = require('../utils/messageUtils');

// Global variables for tracking
const guildTrackMessages = new Map();

async function getLyrics(trackName, artistName, duration) {
    try {
        // Clean track name
        trackName = trackName
            .replace(/\b(Official|Audio|Video|Lyrics|Theme|Soundtrack|Music|Full Version|HD|4K|Visualizer|Radio Edit|Live|Remix|Mix|Extended|Cover|Parody|Performance|Version|Unplugged|Reupload)\b/gi, "") 
            .replace(/\s*[-_/|]\s*/g, " ") 
            .replace(/\s+/g, " ") 
            .trim();

        // Clean artist name
        artistName = artistName
            .replace(/\b(Topic|VEVO|Records|Label|Productions|Entertainment|Ltd|Inc|Band|DJ|Composer|Performer)\b/gi, "")
            .replace(/ x /gi, " & ") 
            .replace(/\s+/g, " ") 
            .trim();

        // Try with duration first
        let response = await axios.get(`https://lrclib.net/api/get`, {
            params: { track_name: trackName, artist_name: artistName, duration }
        });

        if (response.data.syncedLyrics || response.data.plainLyrics) {
            return response.data.syncedLyrics || response.data.plainLyrics;
        }

        // Try without duration
        response = await axios.get(`https://lrclib.net/api/get`, {
            params: { track_name: trackName, artist_name: artistName }
        });

        return response.data.syncedLyrics || response.data.plainLyrics;
    } catch (error) {
        console.error("❌ Lyrics fetch error:", error.response?.data?.message || error.message);
        return null;
    }
}

async function showLyrics(channel, player) {
    if (!player || !player.current || !player.current.info) {
        sendEmbed(channel, "🚫 **No song is currently playing.**");
        return;
    }

    const track = player.current.info;
    const lyrics = await getLyrics(track.title, track.author, Math.floor(track.length / 1000));

    if (!lyrics) {
        sendEmbed(channel, "❌ **Lyrics not found!**");
        return;
    }

    const lines = lyrics.split('\n').map(line => line.trim()).filter(Boolean);
    const songDuration = Math.floor(track.length / 1000); 

    const embed = new EmbedBuilder()
        .setTitle(`🎵 Live Lyrics: ${track.title}`)
        .setDescription("🔄 Syncing lyrics...")
        .setColor(config.embedColor);

    const stopButton = new ButtonBuilder()
        .setCustomId("stopLyrics")
        .setLabel("Stop Lyrics")
        .setStyle(ButtonStyle.Danger);

    const fullButton = new ButtonBuilder()
        .setCustomId("fullLyrics")
        .setLabel("Full Lyrics")
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(fullButton, stopButton);
    
    const message = await channel.send({ embeds: [embed], components: [row] });

    // Store the lyrics message
    const guildId = player.guildId;
    if (!guildTrackMessages.has(guildId)) {
        guildTrackMessages.set(guildId, []);
    }
    guildTrackMessages.get(guildId).push({
        messageId: message.id,
        channelId: channel.id,
        type: 'lyrics'
    });

    const updateLyrics = async () => {
        const currentTime = Math.floor(player.position / 1000); 
        const totalLines = lines.length;

        const linesPerSecond = totalLines / songDuration; 
        const currentLineIndex = Math.floor(currentTime * linesPerSecond); 

        const start = Math.max(0, currentLineIndex - 3);
        const end = Math.min(totalLines, currentLineIndex + 3);
        const visibleLines = lines.slice(start, end).join('\n');

        embed.setDescription(visibleLines);
        await message.edit({ embeds: [embed] });
    };

    const interval = setInterval(updateLyrics, 3000);
    updateLyrics(); 

    const collector = message.createMessageComponentCollector({ time: 600000 });

    collector.on('collect', async i => {
        await i.deferUpdate();
    
        if (i.customId === "stopLyrics") {
            clearInterval(interval);
            await message.delete();
        } else if (i.customId === "fullLyrics") {
            clearInterval(interval);
            embed.setDescription(lines.join('\n'));
    
            const deleteButton = new ButtonBuilder()
                .setCustomId("deleteLyrics")
                .setLabel("Delete")
                .setStyle(ButtonStyle.Danger);
    
            const deleteRow = new ActionRowBuilder().addComponents(deleteButton);
    
            await message.edit({ embeds: [embed], components: [deleteRow] });
        } else if (i.customId === "deleteLyrics") {
            await message.delete();
        }
    });

    collector.on('end', () => {
        clearInterval(interval);
        message.delete().catch(() => {});
    });
}

module.exports = {
    showLyrics,
    guildTrackMessages
};
