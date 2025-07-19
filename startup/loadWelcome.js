const { useDB, useWelcome, useLogger, setWelcome } = require("../lib/hooks");

module.exports = async () => {
	try {
		let indexs = 0;
		const Welcome = await useDB().ShuzukoWelcome.find();
		Welcome.forEach((r) => {
			const Res = useWelcome();
			if (!Res.has(r.guildId)) {
				Res.set(r.guildId, []);
			}
			Res.get(r.guildId).push({
				channel: r.channel,
				content: r.content,
				Bchannel: r.Bchannel,
				Bcontent: r.Bcontent,
			});
			indexs++;
		});
		useLogger().info(`Successfully reloaded ${indexs} welcome.`);
	} catch (error) {
		useLogger().error("Lỗi khi tải welcome:", error);
	}
};

