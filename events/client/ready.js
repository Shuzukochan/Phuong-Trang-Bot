const { Events, Client, ActivityType } = require("discord.js");
const config = require("../../config");
const deploy = require("../../startup/deploy");
const { useDB, useLogger } = require("../../utility/hooks");
const { initializeFirebase } = require("../../utility/firebase");
const { createFirebaseModels } = require("../../startup/firebaseDB");

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

		// Khởi tạo Firebase và các services
		try {
			const [deployResult] = await Promise.all([
				config?.deploy ? deploy(client).catch(() => null) : null,
			]);

			// Khởi tạo Firebase
			const firebaseApp = initializeFirebase();
			
			// Sử dụng Firebase models
			useDB(createFirebaseModels());
			await require("../../startup/loadResponder")();
			await require("../../startup/loadWelcome")();
			await require("../../startup/initAI")();

			useLogger().info("Connected to Firebase!");
			client.errorLog("Connected to Firebase!");
		} catch (error) {
			useLogger().error("Failed to connect to Firebase:", error);
			// Nếu Firebase không kết nối được, dừng bot
			process.exit(1);
		}

		// Set Activity status
		client.user.setStatus(config?.botConfig?.Status || "online");
		client.user.setActivity({
			name: config?.botConfig?.ActivityName || "ziji",
			type: ActivityType[config?.botConfig?.ActivityType] || ActivityType.Playing,
			timestamps: {
				start: Date.now(),
			},
		});

		useLogger().info(`Ready! Logged in as ${client.user.tag}`);
		client.errorLog(`Ready! Logged in as ${client.user.tag}`);
	},
};
