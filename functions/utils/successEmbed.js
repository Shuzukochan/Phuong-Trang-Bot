const { EmbedBuilder } = require("discord.js");

module.exports.data = {
	name: "createSuccessEmbed",
	type: "utils",
};

module.exports.execute = (message) => {
	const embed = new EmbedBuilder()
		.setTitle(`✅ | Thành công`)
		.setDescription(message)
		.setColor("Green")
		.setTimestamp()
		.setThumbnail(require("../../utility/hooks").useClient().user.displayAvatarURL({ size: 1024 }));
	return embed.data;
};
