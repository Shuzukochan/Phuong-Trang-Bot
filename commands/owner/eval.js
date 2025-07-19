const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const DUMMY_TOKEN = "MY_TOKEN_IS_SECRET";
const config = require("../../lib/hooks").useConfig();

/**
 * @type {import("@structures/Command")}
 */
module.exports.data = {
	name: "eval",
	description: "Thực thi mã JavaScript",
	type: 1, // slash command
	options: [
		{
			name: "code",
			description: "Mã JavaScript để thực thi",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	integration_types: [0],
	contexts: [0],
	owner: true,
};

/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import('../../lang/vi.js') } command.lang - language
 */

module.exports.execute = async ({ interaction, lang }) => {
	if (!config.OwnerID.length || !config.OwnerID.includes(interaction.user.id))
		return interaction.reply({ content: lang.until.noPermission, ephemeral: true });

	const code = interaction.options.getString("code");

	if (!code)
		return interaction.reply({
			content: "Vui lòng cung cấp mã để thực thi.",
			ephemeral: true,
		});

	let response;
	try {
		const result = await eval(code);
		response = buildSuccessResponse(result, interaction.client, lang);
	} catch (error) {
		response = buildErrorResponse(error, lang);
	}

	await interaction.reply(response);
};

// Tạo phản hồi thành công
const buildSuccessResponse = (output, client, lang) => {
	// Bảo vệ token
	output = require("util").inspect(output, { depth: 0 }).replace(client.token, DUMMY_TOKEN);

	const embed = new EmbedBuilder()
		.setAuthor({ name: "📤 Output" })
		.setDescription("```js\n" + (output.length > 4096 ? `${output.substring(0, 4000)}...` : output) + "\n```")
		.setColor(lang?.color || "Random")
		.setTimestamp();

	return { embeds: [embed] };
};

// Tạo phản hồi lỗi
const buildErrorResponse = (err, lang) => {
	const embed = new EmbedBuilder()
		.setAuthor({ name: "📤 Error" })
		.setDescription("```js\n" + (err.message.length > 4096 ? `${err.message.substring(0, 4000)}...` : err.message) + "\n```")
		.setColor(lang?.color || "Random")
		.setTimestamp();

	return { embeds: [embed] };
};

