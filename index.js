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
	setClient,
	setDB,
	setCommands,
	setFunctions,
	setGiveaways,
	setResponder,
	setWelcome,
	setAI,
} = require("./lib/hooks");
const path = require("node:path");
const winston = require("winston");
const util = require("util");
const { Player } = require("discord-player");
const config = useConfig(require("./config"));
const { GiveawaysManager } = require("discord-giveaways");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { loadFiles, loadEvents, createfile } = require("./startup/loader.js");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { ShuzukoExtractor, useshuzukoVoiceExtractor, TextToSpeech } = require("./lib/audio");
const { DefaultExtractors } = require("@discord-player/extractor");
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

// Enhanced Player config for Linux server compatibility
const playerOptions = {
	skipFFmpeg: false,
	// Linux-specific audio options
	ytdlOptions: {
		quality: 'highestaudio',
		filter: 'audioonly',
		format: 'opus',
		highWaterMark: 1 << 25
	},
	// FFmpeg options for better Linux compatibility
	ffmpegOptions: {
		args: [
			'-reconnect', '1',
			'-reconnect_streamed', '1',
			'-reconnect_delay_max', '5',
			'-analyzeduration', '0',
			'-loglevel', '0',
			'-ar', '48000',
			'-ac', '2',
			'-f', 'opus'
		],
		highWaterMark: 1 << 25
	}
};

console.log('🎵 Creating Player with Linux-optimized config');
const player = new Player(client, playerOptions);

player.setMaxListeners(100);
// Always enable YoutubeiExtractor for better YouTube support
player.extractors.register(YoutubeiExtractor, {});
require("youtubei.js").Log.setLevel(0);
console.log('✅ Registered YoutubeiExtractor for better YouTube support');

if (config.DevConfig.ShuzukoExtractor) player.extractors.register(ShuzukoExtractor, {});

player.extractors.register(TextToSpeech, {});

// Filter DefaultExtractors to exclude SoundCloud (safer approach)
console.log('🎵 Filtering DefaultExtractors to exclude SoundCloud...');

const safeExtractors = DefaultExtractors.filter(extractor => {
	try {
		// Check extractor name/identifier to exclude SoundCloud
		const extractorName = extractor.identifier || extractor.name || '';
		const isExcluded = extractorName.toLowerCase().includes('soundcloud');
		
		if (isExcluded) {
			console.log(`❌ Excluded: ${extractorName}`);
			return false;
		}
		
		console.log(`✅ Included: ${extractorName}`);
		return true;
	} catch (error) {
		console.log(`⚠️ Error checking extractor:`, error.message);
		return false; // Exclude if error
	}
});

console.log(`🎵 Loading ${safeExtractors.length} safe extractors (excluded SoundCloud)`);
player.extractors.loadMulti(safeExtractors);

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
	
	await Promise.all([
		loadEvents(path.join(__dirname, "events/client"), client),
		loadEvents(path.join(__dirname, "events/voice"), shuzukoVoice),
		loadEvents(path.join(__dirname, "events/process"), process),
		loadEvents(path.join(__dirname, "events/console"), rl),
		loadEvents(path.join(__dirname, "events/player"), player.events),
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

