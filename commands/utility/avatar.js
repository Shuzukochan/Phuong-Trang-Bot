const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const config = require("../../config.js");

module.exports = {
    name: "avatar",
    description: "Hiển thị avatar của một user",
    options: [
        {
            name: "user",
            description: "Chọn user để xem avatar",
            type: ApplicationCommandOptionType.User,
            required: true // Thay đổi thành bắt buộc
        }
    ],
    
    async run(client, interaction) {
        await interaction.deferReply();

        // Lấy user từ option (bắt buộc có)
        const targetUser = interaction.options.getUser("user");
        
        // Lấy member để có server avatar nếu có
        let targetMember = null;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch (error) {
            // User không trong server này
        }

        // Lấy các loại avatar
        const globalAvatar = targetUser.displayAvatarURL({ 
            size: 4096, 
            extension: 'png',
            dynamic: true 
        });
        
        const serverAvatar = targetMember?.avatar 
            ? targetMember.displayAvatarURL({ 
                size: 4096, 
                extension: 'png',
                dynamic: true 
            })
            : null;

        // Tạo embed
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🖼️ Avatar của ${targetUser.username}`)
            .setDescription(
                `**User:** ${targetUser.toString()}\n` +
                `**User ID:** \`${targetUser.id}\`\n` +
                `**Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>\n\n` +
                `**📱 Avatar Links:**\n` +
                `• [Global Avatar (PNG)](${globalAvatar.replace('webp', 'png')})\n` +
                `• [Global Avatar (JPG)](${globalAvatar.replace('webp', 'jpg')})\n` +
                `• [Global Avatar (WEBP)](${globalAvatar})\n` +
                (serverAvatar ? `• [Server Avatar](${serverAvatar})\n` : '')
            )
            .setImage(serverAvatar || globalAvatar)
            .setFooter({
                text: `Yêu cầu bởi: ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ size: 1024 })
            })
            .setTimestamp();

        // Thêm field cho server avatar nếu có
        if (serverAvatar && serverAvatar !== globalAvatar) {
            embed.addFields({
                name: "🎭 Server Avatar",
                value: "User này có avatar riêng cho server này!",
                inline: true
            });
        }

        // Thêm field về avatar type
        const avatarType = targetUser.avatar 
            ? (targetUser.avatar.startsWith('a_') ? 'Animated (GIF)' : 'Static (PNG/JPG)')
            : 'Default Discord Avatar';
            
        embed.addFields({
            name: "📷 Avatar Type",
            value: avatarType,
            inline: true
        });

        // Thêm field về member info nếu có
        if (targetMember) {
            embed.addFields({
                name: "👤 Member Info",
                value: `**Joined Server:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>\n**Roles:** ${targetMember.roles.cache.size - 1}`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
