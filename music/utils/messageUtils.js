const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const config = require("../../config.js");

async function sendMessageWithPermissionsCheck(channel, embed, attachment, actionRow1, actionRow2) {
    try {
        const permissions = channel.permissionsFor(channel.guild.members.me);
        if (!permissions.has(PermissionsBitField.Flags.SendMessages) ||
            !permissions.has(PermissionsBitField.Flags.EmbedLinks) ||
            !permissions.has(PermissionsBitField.Flags.AttachFiles) ||
            !permissions.has(PermissionsBitField.Flags.UseExternalEmojis)) {
            console.error("Bot lacks necessary permissions to send messages in this channel.");
            return;
        }

        const messageData = {
            embeds: [embed],
            components: actionRow2 ? [actionRow1, actionRow2] : [actionRow1]
        };

        // Add files only if attachment is provided
        if (attachment) {
            messageData.files = [attachment];
        }

        const message = await channel.send(messageData);
        return message;
    } catch (error) {
        console.error("Error sending message:", error.message);
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription("⚠️ **Unable to send message. Check bot permissions.**");
        await channel.send({ embeds: [errorEmbed] });
    }
}

async function sendEmbed(channel, message) {
    const embed = new EmbedBuilder().setColor(config.embedColor).setDescription(message);
    const sentMessage = await channel.send({ embeds: [embed] });
    setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
}

module.exports = {
    sendMessageWithPermissionsCheck,
    sendEmbed
};
