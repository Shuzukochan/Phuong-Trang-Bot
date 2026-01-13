const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config.js");
const musicIcons = require('../../ui/icons/musicicons.js');

module.exports = {
    name: "help",
    description: "Hiển thị hướng dẫn sử dụng bot và danh sách lệnh",
    
    async run(client, interaction) {
        await interaction.deferReply();

        // Định nghĩa các categories và commands
        const commands = {
            "🎵 Music Commands": [
                {
                    name: "/play",
                    description: "Phát nhạc từ YouTube, hoặc link trực tiếp",
                    usage: "/play <tên bài hát hoặc link>",
                    example: "/play never gonna give you up"
                },
                {
                    name: "/filters",
                    description: "Áp dụng hiệu ứng âm thanh cho nhạc đang phát",
                    usage: "/filters <filter_name>",
                    example: "/filters bassboost"
                },
                {
                    name: "🎮 Music Player Controls",
                    description: `Các nút điều khiển trong music card:\n⏮️ Previous - Bài trước hoặc restart\n⏸️ Pause/Resume - Tạm dừng/tiếp tục\n⏭️ Skip - Bỏ qua bài hiện tại\n🔁 Loop - Lặp lại bài/queue\n⏹️ Stop - Dừng và disconnect\n🔀 Shuffle - Xáo trộn hàng đợi\n🎛️ Filters - Menu hiệu ứng âm thanh\n📋 Queue - Xem danh sách chờ\n📝 Lyrics - Hiển thị lời bài hát\n🔄 Autoplay - Bật/tắt tự động phát`,
                    usage: "Bấm vào các nút trên music card",
                    example: "Sử dụng buttons khi đang phát nhạc"
                }
            ],
            "⚙️ Utility Commands": [
                {
                    name: "/ping",
                    description: "Kiểm tra độ trễ và trạng thái kết nối của bot",
                    usage: "/ping",
                    example: "/ping"
                },
                {
                    name: "/statistics",
                    description: "Xem thông tin chi tiết về bot và hệ thống",
                    usage: "/statistics",
                    example: "/statistics"
                },
                {
                    name: "/avatar",
                    description: "Hiển thị avatar của một user",
                    usage: "/avatar [user]",
                    example: "/avatar @username"
                },
                {
                    name: "/help",
                    description: "Hiển thị menu hướng dẫn này",
                    usage: "/help",
                    example: "/help"
                }
            ]
        };

        // Tạo main help embed
        function createMainEmbed() {
            const totalCommands = Object.values(commands).flat().length;
            
            return new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`📚 ${client.user.username} - Hướng Dẫn Sử Dụng`)
                .setDescription(
                    `**Chào mừng bạn đến với ${client.user.username}!** 🎵\n\n` +
                    `Bot âm nhạc chuyên nghiệp với nhiều tính năng mạnh mẽ:\n` +
                    `• **High Quality Music** - Âm thanh chất lượng cao từ Lavalink\n` +
                    `• **Multiple Sources** - YouTube, SoundCloud\n` +
                    `• **Interactive Controls** - Buttons và menu dễ sử dụng\n` +
                    `• **Audio Filters** - Nhiều hiệu ứng âm thanh độc đáo\n\n` +
                    `**📊 Quick Stats:**\n` +
                    `• **Total Commands:** \`${totalCommands}\`\n` +
                    `• **Servers:** \`${client.guilds.cache.size}\`\n` +
                    `• **Active Players:** \`${client.riffy?.players?.size || 0}\`\n\n` +
                    `**🔗 Quick Links:**\n` +
                    `[Support Server](${config.SupportServer}) • [Bot Invite](${config.SupportServer})`
                )
                .addFields(
                    { name: "🎵 Music Commands", value: `${commands["🎵 Music Commands"].length} commands`, inline: true },
                    { name: "⚙️ Utility Commands", value: `${commands["⚙️ Utility Commands"].length} commands`, inline: true },
                    { name: "💡 Tips", value: "Sử dụng menu bên dưới để xem chi tiết", inline: true }
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
                .setFooter({
                    text: `Yêu cầu bởi: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 })
                })
                .setTimestamp();
        }

        // Tạo category embed
        function createCategoryEmbed(categoryName) {
            const categoryCommands = commands[categoryName];
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${categoryName}`)
                .setDescription(`**Danh sách lệnh trong category ${categoryName}:**\n`)
                .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
                .setFooter({
                    text: `${categoryCommands.length} commands • Yêu cầu bởi: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ size: 1024 })
                })
                .setTimestamp();

            categoryCommands.forEach((cmd, index) => {
                embed.addFields({
                    name: `${index + 1}. ${cmd.name}`,
                    value: `**Mô tả:** ${cmd.description}\n**Cách dùng:** \`${cmd.usage}\`\n**Ví dụ:** \`${cmd.example}\``,
                    inline: false
                });
            });

            return embed;
        }

        // Tạo select menu cho categories
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("help_select")
            .setPlaceholder("📂 Chọn category để xem chi tiết...")
            .addOptions([
                {
                    label: "🏠 Main Menu",
                    description: "Quay về trang chính",
                    value: "main",
                    emoji: "🏠"
                },
                {
                    label: "Music Commands",
                    description: "Lệnh điều khiển nhạc",
                    value: "music",
                    emoji: "🎵"
                },
                {
                    label: "Utility Commands", 
                    description: "Lệnh tiện ích và thông tin",
                    value: "utility",
                    emoji: "⚙️"
                }
            ]);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        // Gửi main embed (chỉ có select menu)
        await interaction.editReply({
            embeds: [createMainEmbed()],
            components: [selectRow]
        });

        // Collector cho interactions
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            if (i.isStringSelectMenu() && i.customId === 'help_select') {
                await i.deferUpdate();
                
                const value = i.values[0];
                let embed;

                switch (value) {
                    case 'main':
                        embed = createMainEmbed();
                        break;
                    case 'music':
                        embed = createCategoryEmbed("🎵 Music Commands");
                        break;
                    case 'utility':
                        embed = createCategoryEmbed("⚙️ Utility Commands");
                        break;
                    default:
                        embed = createMainEmbed();
                        break;
                }

                await i.editReply({ embeds: [embed] });
            }
        });

        collector.on('end', async () => {
            try {
                const message = await interaction.fetchReply();
                const disabledSelectMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);

                await message.edit({
                    components: [new ActionRowBuilder().addComponents(disabledSelectMenu)]
                });
            } catch (error) {
                // Message might be deleted, ignore error
            }
        });
    }
};
