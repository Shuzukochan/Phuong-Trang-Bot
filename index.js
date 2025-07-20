require("dotenv").config();
const { startServer } = require("./web");
const { checkUpdate } = require("./startup/checkForUpdate");
const cron = require("node-cron");
const {
	useAI,
	useClient,
	useCooldowns,
	useCommands,
	useFunctions,
	useGiveaways,
	useConfig,
	useResponder,
	useWelcome,
	useLogger,
	useLavalinkManager,
	setClient,
	setDB,
	setCommands,
	setFunctions,
	setGiveaways,
	setResponder,
	setWelcome,
	setAI,
	setLavalinkManager,
} = require("./lib/hooks");
const path = require("node:path");
const winston = require("winston");
const util = require("util");
const config = useConfig(require("./config"));
const { GiveawaysManager } = require("discord-giveaways");
const { loadFiles, loadEvents, createfile } = require("./startup/loader.js");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { useshuzukoVoiceExtractor } = require("./lib/audio");
const LavalinkManager = require("./lib/lavalink");
const readline = require("readline");

const client = new Client({
	rest: [{ timeout: 60_000 }],
	intents: [
		GatewayIntentBits.Guilds, // for guild related things
		GatewayIntentBits.GuildVoiceStates, // for voice related things
		GatewayIntentBits.GuildMessageReactions, // for message reactions things
		GatewayIntentBits.GuildMembers, // for guild members related things
		// GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
		// GatewayIntentBits.GuildIntegrations, // for discord Integrations
		// GatewayIntentBits.GuildWebhooks, // for discord webhooks
		GatewayIntentBits.GuildInvites, // for guild invite managing
		// GatewayIntentBits.GuildPresences, // for user presence things
		GatewayIntentBits.GuildMessages, // for guild messages things
		// GatewayIntentBits.GuildMessageTyping, // for message typing things
		GatewayIntentBits.DirectMessages, // for dm messages
		GatewayIntentBits.DirectMessageReactions, // for dm message reaction
		// GatewayIntentBits.DirectMessageTyping, // for dm message typinh
		GatewayIntentBits.MessageContent, // enable if you need message content things
	],
	partials: [Partials.User, Partials.GuildMember, Partials.Message, Partials.Channel],
	allowedMentions: {
		parse: ["users"],
		repliedUser: false,
	},
});

createfile("./jsons");
// Configure logger
const logger = useLogger(
	winston.createLogger({
		level: config.DevConfig?.logger || "", // leave blank to enable all
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.printf(
				({ level, message, timestamp }) =>
					`[${timestamp}] [${level.toUpperCase()}]:` + util.inspect(message, { showHidden: false, depth: 2, colors: true }),
			),
		),
		transports: [
			new winston.transports.Console({
				format: winston.format.printf(
					({ level, message }) =>
						`[${level.toUpperCase()}]:` + util.inspect(message, { showHidden: false, depth: 2, colors: true }),
				),
			}),
			new winston.transports.File({ filename: "./jsons/bot.log", level: "error" }),
		],
	}),
);

// Initialize Lavalink Manager
console.log('🎵 Initializing Lavalink Manager...');
const lavalinkManager = new LavalinkManager(client);
const player = lavalinkManager.getPlayer(); // Will be set after initialization

// Debug
if (config.DevConfig.DJS_DEBUG) client.on("debug", (m) => logger.debug(m));
if (config.DevConfig.DPe_DEBUG) player.events.on("debug", (m) => logger.debug(m));
if (config.DevConfig.DP_DEBUG) {
	logger.debug(player.scanDeps());
	player.on("debug", (m) => logger.debug(m));
}
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

useGiveaways(
	config.DevConfig.Giveaway ?
		new GiveawaysManager(client, {
			storage: "./jsons/giveaways.json",
			default: {
				botsCanWin: false,
				embedColor: "Random",
				embedColorEnd: "#000000",
				reaction: "🎉",
			},
		})
	:	() => false,
);
if (process.env.NODE_ENV == "development") {
	logger.info("You are in development mode, skipping update check.");
} else {
	checkUpdate();
	cron.schedule("0 0,12 * * *", () => {
		checkUpdate();
	});
}
const shuzukoVoice = useshuzukoVoiceExtractor({
	ignoreBots: true,
	minimalVoiceMessageDuration: 1,
	lang: "vi-VN",
});

const initialize = async () => {
	setClient(client);
	setWelcome(new Collection());
	setResponder(new Collection());
	
	// Initialize collections
	const commands = new Collection();
	const functions = new Collection();
	setCommands(commands);
	setFunctions(functions);
	
	// Initialize Lavalink Manager
	await lavalinkManager.initialize();
	setLavalinkManager(lavalinkManager);
	
	// Get the actual player instance after initialization
	const actualPlayer = lavalinkManager.getPlayer();
	
	await Promise.all([
		loadEvents(path.join(__dirname, "events/client"), client),
		loadEvents(path.join(__dirname, "events/voice"), shuzukoVoice),
		loadEvents(path.join(__dirname, "events/process"), process),
		loadEvents(path.join(__dirname, "events/console"), rl),
		loadEvents(path.join(__dirname, "events/player"), actualPlayer.events),
		loadFiles(path.join(__dirname, "commands"), commands),
		loadFiles(path.join(__dirname, "functions"), functions),
		startServer().catch((error) => logger.error("Error start Server:", error)),
	]);
	client.login(process.env.TOKEN).catch((error) => {
		logger.error("Error logging in:", error);
		logger.error("The Bot Token You Entered Into Your Project Is Incorrect Or Your Bot's INTENTS Are OFF!");
	});
};

initialize().catch((error) => {
	logger.error("Error during initialization:", error);
});

