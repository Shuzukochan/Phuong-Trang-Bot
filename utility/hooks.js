/**
 * Simple hooks system to replace @zibot/zihooks functionality
 * Provides functions, database, config and logger management
 */

// Global storage for hooks data
const hooks = {
    functions: new Map(),
    database: null,
    config: null,
    logger: null,
    client: null,
    cooldowns: new Map(),
    commands: new Map(),
    giveaways: null,
    responder: null,
    welcome: null,
    ai: null
};

/**
 * Functions hook - stores and retrieves functions/commands
 * @param {Map} functionsMap - Optional functions map to set
 * @returns {Map} - Functions map
 */
function useFunctions(functionsMap) {
    if (functionsMap) {
        hooks.functions = functionsMap;
    }
    return hooks.functions;
}

/**
 * Database hook - stores and retrieves database connection/models
 * @param {any} database - Optional database to set
 * @returns {any} - Database instance
 */
function useDB(database) {
    if (database !== undefined) {
        hooks.database = database;
    }
    return hooks.database;
}

/**
 * Config hook - stores and retrieves configuration
 * @param {any} config - Optional config to set
 * @returns {any} - Config instance
 */
function useConfig(config) {
    if (config !== undefined) {
        hooks.config = config;
    }
    return hooks.config;
}

/**
 * Logger hook - stores and retrieves logger instance
 * @param {any} logger - Optional logger to set
 * @returns {any} - Logger instance
 */
function useLogger(logger) {
    if (logger !== undefined) {
        hooks.logger = logger;
    }
    return hooks.logger || console; // fallback to console if no logger set
}

/**
 * Client hook - for compatibility with existing code
 * @param {any} client - Optional client to set
 * @returns {any} - Client instance
 */
function useClient(client) {
    if (client !== undefined) {
        hooks.client = client;
    }
    return hooks.client;
}

/**
 * Cooldowns hook - for command cooldowns management
 * @param {Map} cooldowns - Optional cooldowns map to set
 * @returns {Map} - Cooldowns map
 */
function useCooldowns(cooldowns) {
    if (cooldowns) {
        hooks.cooldowns = cooldowns;
    }
    return hooks.cooldowns;
}

/**
 * Commands hook - for commands management
 * @param {Map} commands - Optional commands map to set
 * @returns {Map} - Commands map
 */
function useCommands(commands) {
    if (commands) {
        hooks.commands = commands;
    }
    return hooks.commands;
}

/**
 * Giveaways hook - for giveaways management
 * @param {any} giveaways - Optional giveaways manager to set
 * @returns {any} - Giveaways manager
 */
function useGiveaways(giveaways) {
    if (giveaways !== undefined) {
        hooks.giveaways = giveaways;
    }
    return hooks.giveaways;
}

/**
 * Responder hook - for auto-responder management
 * @param {any} responder - Optional responder to set
 * @returns {any} - Responder instance
 */
function useResponder(responder) {
    if (responder !== undefined) {
        hooks.responder = responder;
    }
    return hooks.responder;
}

/**
 * Welcome hook - for welcome system management
 * @param {any} welcome - Optional welcome system to set
 * @returns {any} - Welcome system instance
 */
function useWelcome(welcome) {
    if (welcome !== undefined) {
        hooks.welcome = welcome;
    }
    return hooks.welcome;
}

/**
 * AI hook - for AI system management
 * @param {any} ai - Optional AI system to set
 * @returns {any} - AI system instance
 */
function useAI(ai) {
    if (ai !== undefined) {
        hooks.ai = ai;
    }
    return hooks.ai;
}

/**
 * Mod interaction hook - for moderation interactions
 * @param {any} modinteraction - Optional mod interaction to set
 * @returns {any} - Mod interaction instance
 */
function modinteraction(modint) {
    if (modint !== undefined) {
        hooks.modinteraction = modint;
    }
    return hooks.modinteraction;
}

module.exports = {
    useFunctions,
    useDB,
    useConfig,
    useLogger,
    useClient,
    useCooldowns,
    useCommands,
    useGiveaways,
    useResponder,
    useWelcome,
    useAI,
    modinteraction
};
