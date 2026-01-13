const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const musicIcons = require('../../ui/icons/musicicons.js');
const requesters = new Map();
const requesterUsers = new Map(); // Lưu user objects

async function play(client, interaction, lang) {
    try {
        const query = interaction.options.getString('name');

        if (!interaction.member.voice.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang.play.embed.error,
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({
                    text: `Yêu cầu bởi: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 })
                })
                .setDescription(lang.play.embed.noVoiceChannel);

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!client.riffy.nodes || client.riffy.nodes.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang.play.embed.error,
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({
                    text: `Yêu cầu bởi: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 })
                })
                .setDescription(lang.play.embed.noLavalinkNodes);

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const player = client.riffy.createConnection({
            guildId: interaction.guildId,
            voiceChannel: interaction.member.voice.channelId,
            textChannel: interaction.channelId,
            deaf: true
        });

        await interaction.deferReply();

        // Xử lý query: nếu không phải URL thì thêm ytsearch:
        let searchQuery = query;
        const isUrl = query.startsWith('http://') || query.startsWith('https://') || query.startsWith('www.');
        const hasPrefix = query.includes(':') && (query.startsWith('ytsearch:') || query.startsWith('ytmsearch:') || query.startsWith('scsearch:'));

        // if (!isUrl && !hasPrefix) {
        //     searchQuery = `ytsearch:${query}`;
        // }

        const resolve = await client.riffy.resolve({ query: searchQuery, requester: interaction.user.username });

        if (!resolve || typeof resolve !== 'object' || !Array.isArray(resolve.tracks)) {
            throw new TypeError('Invalid response from Riffy');
        }

        let isPlaylist = false;

        if (resolve.loadType === 'playlist') {
            isPlaylist = true;
            for (const track of resolve.tracks) {
                track.info.requester = interaction.user.username;
                player.queue.add(track);
                requesters.set(track.info.uri, interaction.user.username);
                requesterUsers.set(track.info.uri, interaction.user);
            }
        } else if (resolve.loadType === 'search' || resolve.loadType === 'track') {
            const track = resolve.tracks.shift();
            track.info.requester = interaction.user.username;
            player.queue.add(track);
            requesters.set(track.info.uri, interaction.user.username);
            requesterUsers.set(track.info.uri, interaction.user);
        } else {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({
                    name: lang.play.embed.error,
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({
                    text: `Yêu cầu bởi: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 })
                })
                .setDescription(lang.play.embed.noResults);

            await interaction.followUp({ embeds: [errorEmbed] });
            return;
        }

        // Start playing if not already playing
        if (!player.playing && !player.paused && player.queue.length > 0) {
            try {
                if (typeof player.play === 'function') {
                    player.play();
                } else if (typeof player.start === 'function') {
                    player.start();
                } else {
                    console.log('Available player methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(player)));
                }
            } catch (error) {
                console.error('Error starting player:', error);
            }
        }

        const randomEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({
                name: lang.play.embed.requestUpdated,
                iconURL: musicIcons.beats2Icon,
                url: config.SupportServer
            })
            .setDescription(lang.play.embed.successProcessed)
            .setFooter({
                text: `Yêu cầu bởi: ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ size: 1024 })
            });

        const message = await interaction.followUp({ embeds: [randomEmbed] });

        setTimeout(() => {
            message.delete().catch(() => { });
        }, 3000);



    } catch (error) {
        console.error('Error processing play command:', error);
        await interaction.followUp({ content: "❌ An error occurred while processing the request." });
    }
}

module.exports = {
    name: "play",
    description: "Play a song from a name or link",
    permissions: "0x0000000000000800",
    options: [{
        name: 'name',
        description: 'Enter song name / link or playlist',
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    run: play,
    requesters: requesters,
    requesterUsers: requesterUsers,
};


