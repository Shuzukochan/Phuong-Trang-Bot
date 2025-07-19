const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, BaseInteraction, AttachmentBuilder } = require("discord.js");
const { useMainPlayer, useQueue, GuildQueueEvent, Track } = require("discord-player");
const { useDB, useConfig, useLogger } = require("../../lib/hooks");
const { ButtonStyle, StringSelectMenuOptionBuilder, StringSelectMenuBuilder } = require("discord.js");
const { Worker } = require("worker_threads");
const langdef = require("./../../lang/vi");
const player = useMainPlayer();
const ZiIcons = require("./../../utility/icon");
const config = useConfig();
const logger = useLogger();
//====================================================================//

module.exports.data = {
	name: "Search",
	type: "player",
};

//====================================================================//

function validURL(str) {
	try {
		new URL(str);
		return true;
	} catch (err) {
		return false;
	}
}

async function buildImageInWorker(searchPlayer, query) {
	logger.debug("Starting buildImageInWorker");
	return new Promise((resolve, reject) => {
		logger.debug("Creating new worker thread");
		const worker = new Worker("./utility/musicImage.js", {
			workerData: { searchPlayer, query },
		});

		worker.on("message", (arrayBuffer) => {
			logger.debug("Received message from worker");
			try {
				const buffer = Buffer.from(arrayBuffer);
				if (!Buffer.isBuffer(buffer)) {
					throw new Error("Received data is not a buffer");
				}
				const attachment = new AttachmentBuilder(buffer, { name: "search.png" });
				resolve(attachment);
			} catch (error) {
				reject(error);
			} finally {
				worker.postMessage("terminate");
			}
			logger.debug("Message processed successfully");
		});

		worker.on("error", (error) => {
			logger.error(`Worker encountered an error: ${JSON.stringify(error)}`);
			reject(error);
		});

		worker.on("exit", (code) => {
			logger.debug(`Worker exited with code ${code}`);
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}

//====================================================================//

/**
 * @param { BaseInteraction } interaction
 * @param { string } query
 * @param { langdef } lang
 */
module.exports.execute = async (interaction, query, lang, options = {}) => {
	logger.debug(`Executing command with query: ${JSON.stringify(query)}`);
	const { client, guild, user } = interaction;
	const voiceChannel = interaction.member.voice?.channel;

	if (!isUserInVoiceChannel(voiceChannel, interaction, lang)) return;
	if (!isBotInSameVoiceChannel(guild, voiceChannel, interaction, lang)) return;
	if (!hasVoiceChannelPermissions(voiceChannel, client, interaction, lang)) return;

	await interaction.deferReply({ withResponse: true }).catch(() => {
		logger.warn("Failed to defer reply");
	});
	const queue = useQueue(guild.id);
	logger.debug(`Queue retrieved: ${queue?.tracks?.length || 0} tracks`);

	if (validURL(query) || options?.joinvoice) {
		logger.debug("Handling play request");
		return handlePlayRequest(interaction, query, lang, options, queue);
	}

	logger.debug("Handling search request");
	return handleSearchRequest(interaction, query, lang);
};

//====================================================================//

function isUserInVoiceChannel(voiceChannel, interaction, lang) {
	if (!voiceChannel) {
		logger.debug("User is not in a voice channel");
		interaction.reply({
			content: lang?.music?.NOvoiceChannel ?? "Bạn chưa tham gia vào kênh thoại",
			ephemeral: true,
		});
		return false;
	}
	return true;
}

function isBotInSameVoiceChannel(guild, voiceChannel, interaction, lang) {
	const voiceMe = guild.members.me.voice?.channel;
	if (voiceMe && voiceMe.id !== voiceChannel.id) {
		logger.debug("Bot is not in the same voice channel");

		interaction.reply({
			content: lang?.music?.NOvoiceMe ?? "Bot đã tham gia một kênh thoại khác",
			ephemeral: true,
		});
		return false;
	}
	return true;
}

function hasVoiceChannelPermissions(voiceChannel, client, interaction, lang) {
	const permissions = voiceChannel.permissionsFor(client.user);
	if (!permissions.has("Connect") || !permissions.has("Speak")) {
		logger.debug("Bot lacks necessary permissions in the voice channel");
		interaction.reply({
			content: lang?.music?.NoPermission ?? "Bot không có quyền tham gia hoặc nói trong kênh thoại này",
			ephemeral: true,
		});
		return false;
	}
	return true;
}

//#region Play Request
async function handlePlayRequest(interaction, query, lang, options, queue) {
	try {
		if (!queue?.metadata) await interaction.editReply({ content: "<a:loading:1151184304676819085> Loading..." });
		const playerConfig = await getPlayerConfig(options, interaction);
		logger.debug(`Player configuration retrieved:  ${JSON.stringify(playerConfig)}`);

		if (!!options?.joinvoice) {
			return joinVoiceChannel(interaction, queue, playerConfig, options, lang);
		}

		// Search with YouTube priority to avoid SoundCloud issues on Linux
		const configSettings = useConfig().PlayerConfig;
		const searchOptions = { 
			requestedBy: interaction.user,
			searchEngine: configSettings.QueryType || "youtube"
		};
		
		// Force disable SoundCloud if configured
		if (configSettings.disableSoundCloud) {
			searchOptions.searchEngine = "youtube";
		}
		
		const res = await player.search(query, searchOptions);
		logger.debug("Search results obtained:", res);
		
		if (!res.tracks?.length) {
			logger.warn("No tracks found, trying fallback search");
			throw new Error("No tracks found");
		}

		logger.info(`Attempting to play track: ${res.tracks[0].title} by ${res.tracks[0].author}`);
		logger.debug("Player config:", playerConfig);

		// Check if we're on Linux and should use DirectPlay immediately
		const isLinux = process.platform === 'linux';
		if (isLinux) {
			logger.info("Linux detected - attempting DirectPlay method first");
			try {
				const { DirectYouTubePlayer } = require('./DirectPlay');
				
				const result = await DirectYouTubePlayer.playDirect(
					interaction.member.voice.channel,
					query,
					{
						requestedBy: interaction.user,
						metadata: await getQueueMetadata(queue, interaction, options, lang)
					}
				);
				
				if (result.success) {
					await cleanUpInteraction(interaction, queue);
					logger.info("DirectPlay successful on Linux");
					return;
				}
			} catch (directPlayError) {
				logger.warn("DirectPlay failed, falling back to normal method:", directPlayError.message);
			}
		}

		// Normal play method with aggressive error handling
		try {
			await player.play(interaction.member.voice.channel, res, {
				nodeOptions: { 
					...playerConfig, 
					metadata: await getQueueMetadata(queue, interaction, options, lang) 
				},
				requestedBy: interaction.user,
			});
		} catch (playError) {
			logger.error("Normal play method failed:", playError.message);
			// Force trigger fallback strategies
			throw new Error("Could not extract stream");
		}

		await cleanUpInteraction(interaction, queue);
		logger.debug("Track played successfully");
	} catch (e) {
		logger.error(`Error in handlePlayRequest: ${e.message}`);
		
		// Handle specific stream extraction errors with multiple fallback strategies
		if (e.message?.includes("Could not extract stream") || e.message?.includes("NoResultError")) {
			logger.warn("Stream extraction failed, trying multiple fallback strategies");
			
			// Strategy 1: Try with "official" keyword
			try {
				logger.info("Fallback 1: Adding 'official' keyword");
				const fallbackRes1 = await player.search(`${query} official`, { 
					requestedBy: interaction.user,
					searchEngine: "youtube"
				});
				
				if (fallbackRes1.tracks?.length) {
					await player.play(interaction.member.voice.channel, fallbackRes1, {
						nodeOptions: { ...playerConfig, metadata: await getQueueMetadata(queue, interaction, options, lang) },
						requestedBy: interaction.user,
					});
					await cleanUpInteraction(interaction, queue);
					logger.info("Fallback 1 successful");
					return;
				}
			} catch (fallbackError1) {
				logger.warn("Fallback 1 failed:", fallbackError1.message);
			}
			
			// Strategy 2: Try simplified search query
			try {
				logger.info("Fallback 2: Simplified search query");
				const words = query.split(' ').slice(0, 3).join(' '); // Take first 3 words
				const fallbackRes2 = await player.search(words, { 
					requestedBy: interaction.user,
					searchEngine: "youtube"
				});
				
				if (fallbackRes2.tracks?.length) {
					await player.play(interaction.member.voice.channel, fallbackRes2, {
						nodeOptions: { ...playerConfig, metadata: await getQueueMetadata(queue, interaction, options, lang) },
						requestedBy: interaction.user,
					});
					await cleanUpInteraction(interaction, queue);
					logger.info("Fallback 2 successful");
					return;
				}
			} catch (fallbackError2) {
				logger.warn("Fallback 2 failed:", fallbackError2.message);
			}
			
			// Strategy 3: Try DirectPlay for Linux compatibility
			try {
				logger.info("Fallback 3: DirectPlay method");
				const { DirectYouTubePlayer } = require('./DirectPlay');
				
				const result = await DirectYouTubePlayer.playDirect(
					interaction.member.voice.channel,
					query,
					{
						requestedBy: interaction.user,
						metadata: await getQueueMetadata(queue, interaction, options, lang)
					}
				);
				
				if (result.success) {
					await cleanUpInteraction(interaction, queue);
					logger.info("Fallback 3 successful - DirectPlay worked");
					return;
				}
			} catch (fallbackError3) {
				logger.warn("Fallback 3 (DirectPlay) failed:", fallbackError3.message);
			}
			
			// Strategy 4: Generic popular music as last resort
			try {
				logger.info("Fallback 4: Generic popular music (last resort)");
				const fallbackRes4 = await player.search("lofi hip hop", { 
					requestedBy: interaction.user,
					searchEngine: "youtube"
				});
				
				if (fallbackRes4.tracks?.length) {
					await player.play(interaction.member.voice.channel, fallbackRes4, {
						nodeOptions: { ...playerConfig, metadata: await getQueueMetadata(queue, interaction, options, lang) },
						requestedBy: interaction.user,
					});
					await cleanUpInteraction(interaction, queue);
					logger.info("Fallback 4 successful - playing generic music");
					return;
				}
			} catch (fallbackError4) {
				logger.error("All fallback strategies failed including DirectPlay:", fallbackError4.message);
			}
		}
		
		await handleError(interaction, lang);
	}
}

const DefaultPlayerConfig = {
	selfDeaf: true,
	volume: 50,
	leaveOnEmpty: true,
	leaveOnEmptyCooldown: 50_000,
	leaveOnEnd: true,
	leaveOnEndCooldown: 500_000,
	pauseOnEmpty: true,
};

async function getPlayerConfig(options, interaction) {
	logger.debug("Starting getPlayerConfig");
	const playerConfig = { ...DefaultPlayerConfig, ...config?.PlayerConfig };

	if (options.assistant && config?.DevConfig?.VoiceExtractor) {
		logger.debug("Disabling selfDeaf due to assistant option");
		playerConfig.selfDeaf = false;
	}

	if (playerConfig.volume === "auto") {
		logger.debug("Volume is set to auto, fetching from database");
		const DataBase = useDB();
		playerConfig.volume =
			DataBase ?
				((await DataBase.ShuzukoUser.findOne({ userID: interaction.user.id }))?.volume ?? DefaultPlayerConfig.volume)
			:	DefaultPlayerConfig.volume;
		logger.debug(`Volume set from database or default: ${playerConfig.volume}`);
	}

	logger.debug(`Exiting getPlayerConfig with playerConfig: ${JSON.stringify(playerConfig)}`);
	return playerConfig;
}

async function joinVoiceChannel(interaction, queue, playerConfig, options, lang) {
	logger.debug("Starting joinVoiceChannel function");
	const queues = player.nodes.create(interaction.guild, {
		...playerConfig,
		metadata: await getQueueMetadata(queue, interaction, options, lang),
	});
	logger.debug("Queue created with metadata:", JSON.stringify(queues.metadata));

	try {
		if (!queues.connection) {
			logger.debug("No existing connection, attempting to connect to voice channel");
			await queues.connect(interaction.member.voice.channelId, { deaf: true });
			logger.debug("Connected to voice channel successfully");
		} else {
			logger.debug("Already connected to a voice channel");
		}
	} catch (error) {
		logger.debug(`Failed to connect to voice channel:  ${JSON.stringify(error)}`);
		return await interaction
			.editReply({
				content: lang?.music?.NoPermission ?? "Bot không có quyền tham gia hoặc nói trong kênh thoại này",
				ephemeral: true,
			})
			.catch(() => {
				logger.debug("Failed to edit reply after connection error");
			});
	}

	logger.debug("Acquiring task entry from task queue");
	const entry = queues.tasksQueue.acquire();
	logger.debug("Task entry acquired, waiting for task resolution");
	await entry.getTask();
	logger.debug("Task resolved, emitting PlayerStart event");

	try {
		player.events.emit(
			GuildQueueEvent.PlayerStart,
			queues,
			new Track(player, {
				title: "Join Voice",
				url: config?.botConfig?.InviteBot,
				thumbnail: config?.botConfig?.Banner,
				duration: "0:00",
				author: "EDM",
				queryType: "ZiPlayer",
			}),
		);
		logger.debug("PlayerStart event emitted successfully");
		// if (!queues.isPlaying()) await queues.node.play();
	} finally {
		logger.debug("Releasing task entry");
		queues.tasksQueue.release();
	}
	logger.debug("Exiting joinVoiceChannel function");
	return;
}

async function getQueueMetadata(queue, interaction, options, lang) {
	return (
		queue?.metadata ?? {
			listeners: [interaction.user],
			channel: interaction.channel,
			requestedBy: interaction.user,
			LockStatus: false,
			voiceAssistance: options.assistant && config?.DevConfig?.VoiceExtractor,
			ZiLyrics: { Active: false },
			lang: lang || langdef,
			focus: options?.focus,
			mess: interaction?.customId !== "S_player_Search" ? await interaction.fetchReply() : interaction.message,
		}
	);
}

async function cleanUpInteraction(interaction, queue) {
	logger.debug("Starting cleanUpInteraction");
	if (queue?.metadata) {
		logger.debug("Queue metadata exists");
		if (interaction?.customId === "S_player_Search") {
			await interaction.message.delete().catch(() => {
				logger.debug("Failed to delete interaction message");
			});
		}
		await interaction.deleteReply().catch(() => {
			logger.debug("Failed to delete interaction reply");
		});
	} else {
		logger.debug("No queue metadata");
		if (interaction?.customId === "S_player_Search") {
			await interaction.deleteReply().catch(() => {
				logger.debug("Failed to delete interaction reply");
			});
		}
	}
	logger.debug("Exiting cleanUpInteraction");
	return;
}

async function handleError(interaction, lang) {
	logger.debug("Starting handleError");
	const response = { content: lang?.music?.NOres ?? "❌ | Không tìm thấy bài hát", ephemeral: true };
	if (interaction.replied || interaction.deferred) {
		logger.debug("Interaction already replied or deferred");
		try {
			await interaction.editReply(response);
			logger.debug("Edited interaction reply successfully");
		} catch {
			logger.warn("Failed to edit interaction reply, fetching reply");
			const meess = await interaction.fetchReply();
			await meess.edit(response).catch(() => {
				logger.error("Failed to edit fetched reply");
			});
		}
	} else {
		logger.debug("Replying to interaction");
		await interaction.reply(response).catch(() => {
			logger.error("Failed to reply to interaction");
		});
	}
	logger.debug("Exiting handleError");
	return;
}

//#endregion Play Request
//#region Search Track
async function handleSearchRequest(interaction, query, lang) {
	const results = await player.search(query, { searchEngine: config.PlayerConfig.QueryType });
	logger.debug(`Search results:  ${results?.tracks?.length}`);
	const tracks = filterTracks(results?.tracks);
	logger.debug(`Filtered tracks:  ${tracks?.length}`);

	if (!tracks?.length) {
		logger.debug("No tracks found");
		return interaction
			.editReply({
				embeds: [new EmbedBuilder().setTitle("Không tìm thấy kết quả nào cho:").setDescription(`${query}`).setColor("Red")],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("B_cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary),
					),
				],
			})
			.catch(() => {});
	}

	logger.debug("Sending search results");
	return sendSearchResults(interaction, query, tracks, lang);
}

function filterTracks(tracks) {
	const uniqueTracks = [];
	const seenUrls = new Set();
	for (const track of tracks) {
		if (track?.url?.length < 100 && !seenUrls.has(track?.url)) {
			uniqueTracks.push(track);
			seenUrls.add(track?.url);
			if (uniqueTracks.length >= 20) break;
		}
	}
	return uniqueTracks;
}

async function sendSearchResults(interaction, query, tracks, lang) {
	logger.debug("Preparing to send search results");
	const creator_Track = tracks.map((track, i) => {
		return new StringSelectMenuOptionBuilder()
			.setLabel(`${i + 1}: ${track.title}`.slice(0, 99))
			.setDescription(`Duration: ${track.duration} source: ${track.queryType}`)
			.setValue(`${track.url}`)
			.setEmoji(`${ZiIcons.Playbutton}`);
	});

	const cancelOption = new StringSelectMenuOptionBuilder()
		.setLabel("Hủy")
		.setDescription("Hủy bỏ")
		.setValue("B_cancel")
		.setEmoji(ZiIcons.noo);

	const row = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId("S_player_Search")
			.setPlaceholder("▶ | Chọn một bài hát để phát")
			.addOptions([cancelOption, ...creator_Track])
			.setMaxValues(1)
			.setMinValues(1),
	);

	if (config?.ImageSearch) {
		logger.debug("Image search is enabled");
		const searchPlayer = tracks.map((track, i) => ({
			index: i + 1,
			avatar: track?.thumbnail,
			displayName: track.title.slice(0, tracks.length > 1 ? 30 : 80),
			time: track.duration,
		}));

		try {
			const attachment = await buildImageInWorker(searchPlayer, query);
			logger.debug("Image built successfully");
			return interaction.editReply({ embeds: [], components: [row], files: [attachment] }).catch(() => {});
		} catch (error) {
			console.error("Error building image:", error);
		}
	}
	const embed = new EmbedBuilder()
		.setTitle("Tìm kiếm kết quả:")
		.setDescription(`${query}`)
		.setColor(lang?.color || "Random")
		.addFields(
			tracks.map((track, i) => ({
				name: `${i + 1}: ${track.author} - ${track.title.slice(0, 50 - track.author.length)} \`[${track.duration}]\``.slice(
					0,
					99,
				),
				value: ` `,
				inline: false,
			})),
		);
	logger.debug("Search results sent");
	return interaction.editReply({ embeds: [embed], components: [row] }).catch(() => {
		logger.debug("Failed to edit reply with search results");
	});
}
//#endregion Search Track


