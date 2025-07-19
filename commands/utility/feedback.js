const { useConfig } = require("../../lib/hooks");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = useConfig();
module.exports.data = {
	name: "feedback",
	description: "Gửi phản hồi cho nhà phát triển bot.",
	type: 1, // slash commad
	options: [
		{
			name: "message",
			description: "Nội dung phản hồi",
			type: 3,
			required: true,
		},
		{
			name: "type",
			description: "Loại phản hồi",
			type: 3,
			choices: [
				{ name: "Lỗi", value: "error" },
				{ name: "Yêu cầu", value: "request" },
				{ name: "Khác", value: "other" },
			],
		},
		{
			name: "image",
			description: "Hình ảnh kèm theo phản hồi",
			type: 11,
		},
	],
	integration_types: [0],
	contexts: [0, 1],
};

/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import('../../lang/vi.js') } lang
 */

module.exports.execute = async ({ interaction, lang }) => {
	const { options, client } = interaction;
	await interaction.reply({ content: "<a:loading:1151184304676819085> Loading..." });
	const message = await options.getString("message");
	const type = await options.getString("type");
	const image = await options.getAttachment("image");
	const defeerr = await interaction?.fetchReply();
	const embedrev = (e) =>
		new EmbedBuilder()
			.setColor(lang?.color || "Random")
			.setDescription(`**Phản hồi từ ${interaction.user.tag} đã được gửi ${e ? "thất bại:" + e?.message : "thành công"}!**`);

	const channel = await client.channels.fetch(config?.botConfig?.FeedBack || config?.botConfig?.ErrorLog).catch(() => null);
	await channel
		.send({
			embeds: [
				new EmbedBuilder()
					.setColor(lang?.color || "Random")
					.setAuthor({
						name: `Phản hồi từ ${interaction.user.tag}`,
						iconURL: interaction.user.displayAvatarURL({ size: 1024 }),
					})
					.setDescription(
						`**Loại phản hồi:** ${type}\n` +
							`**Nội dung phản hồi:** ${message}\n` +
							(image ? `**Hình ảnh kèm theo:** [${image.name}](${image.url})` : "") +
							"\n\n",
					)
					.setImage(image?.url ?? null)
					.setFooter({ text: `${defeerr.id}::${interaction.channel.id}` }),
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId("B_FBreply")
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(false)
						.setLabel("Reply")
						.setEmoji("📨"),
				),
			],
		})
		.then(() => defeerr.edit({ content: "", embeds: [embedrev(false)] }))
		.catch((e) => defeerr.edit({ content: "", embeds: [embedrev(e)] }));
	return;
};

