const { useDB, useFunctions } = require("../../lib/hooks");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { PermissionsBitField, MessageFlags } = require("discord.js");

module.exports.data = {
	name: "confession",
	description: "Quản lý confession",
	type: 1, // slash command
	options: [
		{
			name: "write",
			description: "Viết confession",
			type: 1,
			options: [
				{
					name: "content",
					description: "Nội dung của confession",
					type: 3,
					required: true,
				},
				{
					name: "type",
					description: "Loại confession",
					type: 3,
					choices: [
						{
							name: "Anonymous - Ẩn danh",
							value: "anonymous",
						},
						{
							name: "Public - Công khai",
							value: "public",
						},
					],
					required: false,
				},
			],
		},
		{
			name: "info",
			description: "Xem thông tin của confession",
			type: 1,
			options: [
				{
					name: "id",
					description: "ID của confession",
					type: 4,
					required: true,
				},
			],
		},
		{
			name: "setup",
			description: "Thiết lập hoặc chỉnh sửa hệ thống confession",
			type: 1,
			options: [
				{
					name: "channel",
					description: "Kênh chứa confession",
					type: 7,
					required: true,
				},
				{
					name: "review-channel",
					description: "Kênh kiểm duyệt confession",
					type: 7,
					required: false,
				},
			],
		},
		{
			name: "enable",
			description: "Bật hoặc tắt hệ thống confession",
			type: 1,
			options: [
				{
					name: "state",
					description: "Confession có bật hay không",
					type: 5,
					required: true,
				},
			],
		},
		{
			name: "enable-review",
			description: "Lựa chọn có bật chế độ kiểm duyệt hay không",
			type: 1,
			options: [
				{
					name: "option",
					description: "Tùy chọn bật hoặc tắt",
					type: 5,
					required: true,
				},
				{
					name: "channel",
					description: "Channel để kiểm duyệt confession (nếu bật)",
					type: 7,
					required: false,
				},
			],
		},
	],
	integration_types: [0],
	contexts: [0],
};
/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import('../../lang/vi.js') } command.lang - language
 */

module.exports.execute = async ({ interaction, lang }) => {
	if (!interaction.guild) {
		return interaction.reply({
			content: "Lệnh này chỉ có thể sử dụng trong máy chủ (server)!",
			flags: MessageFlags.Ephemeral,
		});
	}
	const successEmbed = useFunctions().get("createSuccessEmbed");
	const errorEmbed = useFunctions().get("createErrorEmbed");
	const database = useDB();
	const command = interaction.options.getSubcommand();
	const user = await interaction.guild.members.fetch(interaction.user);
	switch (command) {
		case "setup":
			await interaction.deferReply({ withResponse: true, flags: MessageFlags.Ephemeral });
			if (user.permissions.has(PermissionsBitField.Flags.ManageGuild))
				return interaction.editReply({ embeds: [errorEmbed.execute(lang.until.notHavePremission)] });
			const channel = interaction.options.getChannel("channel");
			const reviewChannel = interaction?.options?.getChannel("review-channel") || null;
			if (!database)
				return interaction.editReply({
					content: lang?.until?.noDB || "Database hiện không được bật, xin vui lòng liên hệ dev bot",
				});
			await database.ShuzukoConfess.updateOne(
				{ guildId: interaction.guildId },
				{
					$set: {
						enabled: true,
						channelId: channel.id,
						reviewSystem: `${reviewChannel !== null ? true : false}`,
						reviewChannelId: `${reviewChannel !== null ? reviewChannel.id : null}`,
					},
				},
				{ upsert: true },
			);
			const sembed = successEmbed.execute(`Đã thiết lập confession trong channel <#${channel.id}>`);
			await interaction.editReply({ embeds: [sembed] });
		case "write": {
			await interaction.deferReply({ ephemeral: true });

			const content = interaction.options.getString("content");
			const type = interaction.options.getString("type") || "anonymous";

			if (!database) {
				return interaction.editReply({
					content: lang?.until?.noDB || "Database hiện không được bật, xin vui lòng liên hệ dev bot.",
				});
			}

			const confession = await database.ShuzukoConfess.findOne({ guildId: interaction.guildId });
			const embed2 = errorEmbed.execute("Confession đang không bật hoặc chưa được setup trong server của bạn!");

			if (!confession || !confession.enabled || !confession.channelId) {
				return interaction.editReply({
					embeds: [embed2],
				});
			}

			// Review system enabled
			if (confession.reviewSystem) {
				const rchannel = await interaction.guild.channels.fetch(confession.reviewChannelId).catch(() => null);
				if (!rchannel) {
					return interaction.editReply({ content: "Không thể tìm thấy kênh kiểm duyệt!", ephemeral: true });
				}

				const embed = new EmbedBuilder()
					.setTitle(`Confession #${confession.currentId + 1} cần kiểm duyệt`)
					.setDescription(content)
					.setThumbnail(interaction.user.displayAvatarURL({ size: 1024 }))
					.setColor("Random")
					.setFooter({
						text: `Gửi bởi ${interaction.user.username}, chế độ ${type === "public" ? "công khai" : "ẩn danh"}`,
						iconURL: interaction.client.user.displayAvatarURL(),
					})
					.setTimestamp();

				const accept = new ButtonBuilder()
					.setCustomId("B_Cfs_Accept")
					.setEmoji("✅")
					.setLabel("Chấp nhận")
					.setStyle(ButtonStyle.Success);

				const reject = new ButtonBuilder()
					.setCustomId("B_Cfs_Reject")
					.setEmoji("❌")
					.setLabel("Từ chối")
					.setStyle(ButtonStyle.Danger);

				const row = new ActionRowBuilder().addComponents(accept, reject);

				const rmessage = await rchannel.send({ embeds: [embed], components: [row] });

				confession.currentId += 1;

				confession.confessions.push({
					id: confession.currentId,
					content,
					author: {
						id: interaction.user.id,
						username: interaction.user.username,
						avatarURL: interaction.user.displayAvatarURL(),
					},
					type: type,
					status: "pending",
					messageId: null,
					threadId: null,
					reviewMessageId: rmessage.id,
				});

				await confession.save();

				await interaction.editReply({
					content: "📨 Confession của bạn đã được gửi và đang chờ kiểm duyệt!",
				});
			} else {
				// Gửi trực tiếp
				const channel = await interaction.guild.channels.fetch(confession.channelId).catch(() => null);
				if (!channel) {
					return interaction.editReply({ content: "Không thể tìm thấy kênh gửi confession!", ephemeral: true });
				}

				confession.currentId += 1;

				const embed = new EmbedBuilder()
					.setTitle(`Confession #${confession.currentId}`)
					.setDescription(content)
					.setColor("Random")
					.setThumbnail(type === "public" ? interaction.user.displayAvatarURL() : null)
					.setFooter({
						text: `Confession được viết ${type === "public" ? `bởi ${interaction.user.username}` : "ẩn danh"}`,
					})
					.setTimestamp();

				const message = await channel.send({ embeds: [embed] });

				const thread = await message.startThread({
					name: `Thảo luận Confession #${confession.currentId}`,
					autoArchiveDuration: 10080,
				});

				confession.confessions.push({
					id: confession.currentId,
					content,
					author: {
						id: interaction.user.id,
						username: interaction.user.username,
						avatarURL: interaction.user.displayAvatarURL(),
					},
					type: type,
					status: "approved",
					messageId: message.id,
					threadId: thread.id,
				});

				await confession.save();

				const ssembed = successEmbed.execute(
					`✅ Confession của bạn đã được gửi tới: [xem tại đây](https://discord.com/channels/${interaction.guildId}/${channel.id}/${message.id})`,
				);

				await interaction.editReply({ embeds: [ssembed], ephemeral: true });
			}
			break;
		}

		case "enable":
			await interaction.deferReply({ withResponse: true, flags: MessageFlags.Ephemeral });
			const state = interaction.options.getBoolean("state") || true;
			if (user.permissions.has(PermissionsBitField.Flags.ManageGuild))
				return interaction.editReply({ embeds: [errorEmbed.execute(lang.until.notHavePremission)] });
			if (!database)
				return interaction.editReply({
					content: lang?.until?.noDB || "Database hiện không được bật, xin vui lòng liên hệ dev bot",
				});
			await database.ShuzukoConfess.updateOne(
				{ guildId: interaction.guildId },
				{
					$set: {
						enabled: state,
					},
				},
				{ upsert: true },
			);
			await interaction.editReply({
				content: `✅ Confession đã được ${state ? "bật" : "tắt"} trong server.`,
				flags: MessageFlags.Ephemeral,
			});
		default:
			await interaction.reply({ content: "Lệnh không hợp lệ hoặc chưa được cài đặt!", flags: MessageFlags.Ephemeral });
	}
};


