const { Events, Client, ActivityType } = require("discord.js");
const config = require("../../config");
const deploy = require("../../startup/deploy");
// Using Firebase Firestore as database
const { useDB, useLogger, setDB } = require("../../lib/hooks");
const { Database, createModel, connectDB } = require("../../lib/firebase");

module.exports = {
	name: Events.ClientReady,
	type: "events",
	once: true,
	/**
	 * @param { Client } client
	 */
	execute: async (client) => {
		/**
		 * @param { String } messenger
		 */
		client.errorLog = async (messenger) => {
			if (!config?.botConfig?.ErrorLog) return;
			try {
				const channel = await client.channels.fetch(config?.botConfig?.ErrorLog).catch(() => null);
				if (channel) {
					const text = `[<t:${Math.floor(Date.now() / 1000)}:R>] ${messenger}`;
					for (let i = 0; i < text.length; i += 1000) {
						await channel.send(text.slice(i, i + 1000)).catch(() => {});
					}
				}
			} catch (error) {
				useLogger().error("Lỗi khi gửi tin nhắn lỗi:", error);
			}
		};

		// Use Promise.all to handle Firebase connection and deployment concurrently
		const [deployResult] = await Promise.all([
			config?.deploy ? deploy(client).catch(() => null) : null,
		]);

		// Try to connect to Firebase
		try {
			const database = await connectDB();
			setDB(database);
			await require("../../startup/loadResponder")();
			await require("../../startup/loadWelcome")();
			await require("../../startup/initAI")();

			useLogger().info("Connected to Firebase Firestore!");
			client.errorLog("Connected to Firebase Firestore!");
		} catch (error) {
			useLogger().error("Failed to connect to Firebase!", error.message);
			// Use fallback database models
			setDB(Database);
			await require("../../startup/loadResponder")();
			await require("../../startup/loadWelcome")();
			await require("../../startup/initAI")();
			useLogger().info("Connected to Fallback Database!");
			client.errorLog("Connected to Fallback Database!");
		}

		// Set Activity status
		client.user.setStatus(config?.botConfig?.Status || "online");
		client.user.setActivity({
							name: config?.botConfig?.ActivityName || "Phuong Trang",
			type: ActivityType[config?.botConfig?.ActivityType] || ActivityType.Playing,
			timestamps: {
				start: Date.now(),
			},
		});

		useLogger().info(`Ready! Logged in as ${client.user.tag}`);
		client.errorLog(`Ready! Logged in as ${client.user.tag}`);
	},
};
