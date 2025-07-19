const config = require("../../lib/hooks").useConfig();

module.exports.data = {
	name: "shutdown",
	description: "Dừng bot",
	type: 1, // slash command
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
	await interaction.reply({ content: "Bot đang dừng...", ephemeral: true });
	process.exit(); // Dừng bot
};

