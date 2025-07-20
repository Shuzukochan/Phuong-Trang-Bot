const { Player } = require("discord-player");
const { Client } = require("discord.js");
const lavalinkConfig = require("../lavalink-config");

class LavalinkManager {
    constructor(client) {
        this.client = client;
        this.player = null;
        this.nodes = new Map();
        this.isConnected = false;
        this.fallbackEnabled = lavalinkConfig.fallback.enabled;
    }

    /**
     * Khởi tạo Lavalink Player
     */
    async initialize() {
        try {
            console.log('🎵 Initializing Lavalink Manager...');
            
            // Tạo Player với cấu hình Lavalink
            this.player = new Player(this.client, {
                skipFFmpeg: false,
                ytdlOptions: {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    format: 'opus',
                    highWaterMark: 1 << 25
                },
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
            });

            // Thử kết nối Lavalink nodes
            const lavalinkSuccess = await this.setupLavalinkNodes();
            
            // Load extractors
            await this.loadExtractors();
            
            // Thiết lập events
            this.setupEvents();
            
            if (lavalinkSuccess) {
                console.log('✅ Lavalink Manager initialized successfully with Lavalink nodes');
            } else {
                console.log('🔄 Lavalink nodes failed, using Discord Player with Lavalink config');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing Lavalink Manager:', error);
            
            if (this.fallbackEnabled && lavalinkConfig.fallback.useDiscordPlayer) {
                console.log('🔄 Falling back to Discord Player...');
                return this.initializeFallback();
            }
            
            return false;
        }
    }

    /**
     * Thiết lập Lavalink nodes
     */
    async setupLavalinkNodes() {
        const nodes = lavalinkConfig.lavalink.nodes;
        
        try {
            // Kiểm tra xem player có hỗ trợ Lavalink nodes không
            if (!this.player.nodes || typeof this.player.nodes.add !== 'function') {
                console.log('⚠️ Discord Player v7 không hỗ trợ Lavalink nodes trực tiếp');
                console.log('🔄 Sử dụng Discord Player với cấu hình Lavalink...');
                return false;
            }
            
            for (const nodeConfig of nodes) {
                try {
                    console.log(`🔗 Connecting to Lavalink node: ${nodeConfig.name}`);
                    
                    // Thử kết nối đến Lavalink node
                    await this.player.nodes.add({
                        name: nodeConfig.name,
                        url: nodeConfig.url,
                        auth: nodeConfig.auth,
                        secure: nodeConfig.secure,
                        retryAmount: nodeConfig.retryAmount,
                        retryDelay: nodeConfig.retryDelay,
                    });
                    
                    this.nodes.set(nodeConfig.name, nodeConfig);
                    console.log(`✅ Connected to Lavalink node: ${nodeConfig.name}`);
                } catch (error) {
                    console.error(`❌ Failed to connect to Lavalink node ${nodeConfig.name}:`, error);
                }
            }
            
            this.isConnected = this.nodes.size > 0;
            return this.isConnected;
        } catch (error) {
            console.error('❌ Error setting up Lavalink nodes:', error);
            return false;
        }
    }

    /**
     * Load extractors
     */
    async loadExtractors() {
        try {
            console.log('🎵 Loading extractors...');
            
            // Đăng ký extractors
            const { YoutubeiExtractor } = require("discord-player-youtubei");
            const { DefaultExtractors } = require("@discord-player/extractor");
            const { ShuzukoExtractor, TextToSpeech } = require("./audio");

            // Register YoutubeiExtractor
            this.player.extractors.register(YoutubeiExtractor, {});
            console.log('✅ Registered YoutubeiExtractor');
            
            // Register TextToSpeech
            this.player.extractors.register(TextToSpeech, {});
            console.log('✅ Registered TextToSpeech');
            
            // Register ShuzukoExtractor if enabled
            if (require('../config').DevConfig.ShuzukoExtractor) {
                this.player.extractors.register(ShuzukoExtractor, {});
                console.log('✅ Registered ShuzukoExtractor');
            }
            
            // Load default extractors
            this.player.extractors.loadMulti(DefaultExtractors);
            console.log('✅ Loaded DefaultExtractors');
            
            console.log('🎵 All extractors loaded successfully');
        } catch (error) {
            console.error('❌ Error loading extractors:', error);
        }
    }

    /**
     * Thiết lập events cho Lavalink
     */
    setupEvents() {
        if (!this.player) return;

        // Node events - sử dụng API mới của discord-player v7
        if (this.player.nodes && this.player.nodes.events) {
            this.player.nodes.events.on('connect', (node) => {
                console.log(`🔗 Lavalink node connected: ${node.identifier}`);
            });

            this.player.nodes.events.on('disconnect', (node, reason) => {
                console.log(`🔌 Lavalink node disconnected: ${node.identifier}, Reason: ${reason}`);
            });

            this.player.nodes.events.on('error', (node, error) => {
                console.error(`❌ Lavalink node error: ${node.identifier}`, error);
            });
        }

        // Player events
        if (this.player.events) {
            this.player.events.on('playerStart', (queue, track) => {
                console.log(`🎵 Started playing: ${track.title}`);
            });

            this.player.events.on('playerFinish', (queue, track) => {
                console.log(`✅ Finished playing: ${track.title}`);
            });

            this.player.events.on('playerError', (queue, error) => {
                console.error(`❌ Player error:`, error);
            });

            this.player.events.on('emptyChannel', (queue) => {
                console.log(`👥 Voice channel is empty, leaving in ${lavalinkConfig.lavalink.queueOptions.leaveOnEmptyCooldown}ms`);
            });

            this.player.events.on('emptyQueue', (queue) => {
                console.log(`📭 Queue is empty, leaving in ${lavalinkConfig.lavalink.queueOptions.leaveOnEndCooldown}ms`);
            });
        }
    }

    /**
     * Fallback về Discord Player
     */
    async initializeFallback() {
        try {
            console.log('🔄 Initializing Discord Player fallback...');
            
            // Sử dụng cấu hình Discord Player hiện tại
            this.player = new Player(this.client, {
                skipFFmpeg: false,
                ytdlOptions: {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    format: 'opus',
                    highWaterMark: 1 << 25
                },
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
            });

            // Đăng ký extractors
            const { YoutubeiExtractor } = require("discord-player-youtubei");
            const { DefaultExtractors } = require("@discord-player/extractor");
            const { ShuzukoExtractor, TextToSpeech } = require("./audio");

            this.player.extractors.register(YoutubeiExtractor, {});
            this.player.extractors.register(TextToSpeech, {});
            
            // Load default extractors
            this.player.extractors.loadMulti(DefaultExtractors);
            
            console.log('✅ Discord Player fallback initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Discord Player fallback:', error);
            return false;
        }
    }

    /**
     * Lấy player instance
     */
    getPlayer() {
        return this.player;
    }

    /**
     * Kiểm tra kết nối Lavalink
     */
    isLavalinkConnected() {
        return this.isConnected;
    }

    /**
     * Lấy thông tin nodes
     */
    getNodes() {
        return Array.from(this.nodes.values());
    }

    /**
     * Tìm kiếm bài hát
     */
    async search(query, options = {}) {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        const searchOptions = {
            searchEngine: options.searchEngine || lavalinkConfig.lavalink.defaultSearchEngine,
            fallbackSearchEngine: options.fallbackSearchEngine || 'youtube',
            ...options
        };

        return await this.player.search(query, searchOptions);
    }

    /**
     * Tạo queue cho guild
     */
    async createQueue(guild, voiceChannel) {
        if (!this.player) {
            throw new Error('Player not initialized');
        }

        return await this.player.nodes.create(guild, {
            connectionTimeout: 60000,
            leaveOnEmpty: lavalinkConfig.lavalink.queueOptions.leaveOnEmpty,
            leaveOnEmptyCooldown: lavalinkConfig.lavalink.queueOptions.leaveOnEmptyCooldown,
            leaveOnEnd: lavalinkConfig.lavalink.queueOptions.leaveOnEnd,
            leaveOnEndCooldown: lavalinkConfig.lavalink.queueOptions.leaveOnEndCooldown,
            leaveOnStop: true,
            leaveOnStopCooldown: 5000,
            maxHistorySize: 10,
            volume: lavalinkConfig.lavalink.audioOptions.volume,
            bufferingTimeout: 3000,
            skipFFmpeg: false,
        });
    }
}

module.exports = LavalinkManager; 