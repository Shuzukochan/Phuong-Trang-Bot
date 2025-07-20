const { EmbedBuilder } = require("discord.js");
const { useLavalinkManager } = require("../../lib/hooks");

module.exports.data = {
	name: "lavalink-status",
	description: "Kiểm tra trạng thái Lavalink server",
	type: 1, // slash command
	integration_types: [0],
	contexts: [0],
};

/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import('../../lang/vi.js') } command.lang - language
 */

module.exports.execute = async ({ interaction, lang }) => {
	const lavalinkManager = useLavalinkManager();
	
	if (!lavalinkManager) {
		return await interaction.reply({
			content: "❌ Lavalink Manager chưa được khởi tạo!",
			ephemeral: true
		});
	}

	const isConnected = lavalinkManager.isLavalinkConnected();
	const nodes = lavalinkManager.getNodes();
	const player = lavalinkManager.getPlayer();

	const embed = new EmbedBuilder()
		.setTitle("🎵 Lavalink Status")
		.setColor(isConnected ? "#00ff00" : "#ff0000")
		.setTimestamp();

	// Thông tin kết nối
	embed.addFields({
		name: "🔗 Connection Status",
		value: isConnected ? "✅ Connected" : "❌ Disconnected",
		inline: true
	});

	// Thông tin nodes
	if (nodes.length > 0) {
		const nodeInfo = nodes.map(node => 
			`**${node.name}**\nURL: ${node.url}\nSecure: ${node.secure ? "Yes" : "No"}`
		).join("\n\n");
		
		embed.addFields({
			name: "🌐 Nodes",
			value: nodeInfo,
			inline: false
		});
	} else {
		embed.addFields({
			name: "🌐 Nodes",
			value: "No nodes configured",
			inline: false
		});
	}

	// Thông tin player
	if (player) {
		const queues = player.nodes.size;
		embed.addFields({
			name: "🎵 Active Queues",
			value: queues.toString(),
			inline: true
		});
	}

	// Thông tin fallback
	embed.addFields({
		name: "🔄 Fallback Mode",
		value: !isConnected && player ? "✅ Using Discord Player" : "❌ Not in fallback mode",
		inline: true
	});

	await interaction.reply({ embeds: [embed] });
}; 