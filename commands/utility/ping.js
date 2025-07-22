const { EmbedBuilder } = require('discord.js');
const config = require("../../config.js");

module.exports = {
  name: "ping",
  description: "Kiểm tra độ trễ và hiệu suất của bot",
  permissions: "0x0000000000000800",
  options: [],
  
  async run(client, interaction, lang) {
    try {
      const initialResponse = await interaction.reply({ content: "🏓 Pinging...", fetchReply: true });

      const roundTripLatency = initialResponse.createdTimestamp - interaction.createdTimestamp;
      const botPing = client.ws.ping;
      
      const latencyStatus = 
        botPing > 200 ? "🔴 Kém" :
        botPing > 100 ? "🟡 Tốt" :
        "🟢 Xuất sắc";

      const informationEmbed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setColor(config.embedColor)
        .setDescription(`Chào ${interaction.user}! Đây là độ trễ và trạng thái ping của tôi:`)
        .addFields(
          { name: "🌐 Độ trễ vòng lặp", value: `${roundTripLatency}ms`, inline: true },
          { name: "🌙 Trạng thái độ trễ", value: latencyStatus, inline: true },
          {
            name: "🔥 Dấu thời gian hiện tại",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
        )
        .setThumbnail(client.user.displayAvatarURL({ size: 1024, dynamic: true }))
        .setTimestamp()
        .setFooter({
          text: `Yêu cầu bởi: ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
        });

      await interaction.editReply({ content: null, embeds: [informationEmbed] });
      
    } catch (error) {
      console.error("Ping command error:", error);
      await interaction.followUp({
        content: "❌ Có lỗi khi thực hiện ping command.",
        ephemeral: true,
      });
    }
  },
};
