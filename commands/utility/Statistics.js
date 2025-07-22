const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const os = require("os");
const { version: DjsVersion } = require("discord.js");
const { execSync } = require("child_process");
const config = require("../../config.js");


module.exports = {
    name: "statistics",
    description: "View information about the system and bot statistics",
    
    async run(client, interaction) {
        await interaction.deferReply();


        // Get system information
        const osInfo = `${os.type()} ${os.release()} ${os.arch()}`;


        // Get GitHub Commit ID
        let githubCommitId = "N/A";
        try {
            githubCommitId = execSync("git rev-parse --short HEAD").toString().trim();
        } catch (error) {
            console.error("Không thể lấy GitHub Commit");
        }


        // Get owner IDs from config
        const ownerIDs = config.ownerID || [];


        // Calculate bot statistics
        const totalGuilds = client.guilds.cache.size;
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const voiceConnections = client.riffy?.players?.size || 0;
        
        // Count commands
        let totalCommands = 0;
        try {
            const fs = require('fs');
            const path = require('path');
            
            function countJSFiles(dir) {
                let count = 0;
                const files = fs.readdirSync(dir);
                
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        count += countJSFiles(filePath);
                    } else if (file.endsWith('.js')) {
                        count++;
                    }
                }
                return count;
            }
            
            totalCommands = countJSFiles('./commands');
        } catch (error) {
            console.error("Error counting commands:", error);
            totalCommands = "Unknown";
        }


        // Calculate uptime
        const uptimeTimestamp = Math.floor((Date.now() - client.uptime) / 1000);


        // Create main embed
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`📊 ${client.user.username} Statistics`)
            .setDescription(
                `**🤖 Bot Information:**\n` +
                `• **Owner/Developer:** ${ownerIDs.map(id => `<@${id}>`).join(" ") || "Not configured"}\n` +
                `• **Users:** \`${totalMembers.toLocaleString()}\`\n` +
                `• **Servers:** \`${totalGuilds}\`\n` +
                `• **Active Music Players:** \`${voiceConnections}\`\n` +
                `• **Available Commands:** \`${totalCommands}\`\n` +
                `• **Online Since:** <t:${uptimeTimestamp}:R>\n` +
                `• **Response Time:** \`${client.ws.ping} ms\`\n` +
                `• **Memory Usage:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``
            )
            .addFields(
                { name: "🖥️ System", value: osInfo, inline: true },
                { name: "📦 Discord.js", value: `v${DjsVersion}`, inline: true },
                { name: "🎵 Music Engine", value: "Riffy + Lavalink", inline: true },
                { name: "🔗 Git Commit", value: `\`${githubCommitId}\``, inline: true },
                { name: "⚡ Node.js", value: process.version, inline: true },
                { name: "💻 Platform", value: process.platform.charAt(0).toUpperCase() + process.platform.slice(1), inline: true }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
            .setFooter({
                text: `Yêu cầu bởi: ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ size: 1024 })
            })
            .setTimestamp();


        // Add support server button
        const linkRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("🏠 Support Server")
                .setStyle(ButtonStyle.Link)
                .setURL(config.SupportServer)
        );


        // Send the response
        await interaction.editReply({ 
            embeds: [embed], 
            components: [linkRow] 
        });
    }
};
