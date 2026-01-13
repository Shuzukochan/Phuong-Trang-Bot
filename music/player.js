const { Riffy } = require("riffy");
const config = require("../config.js");
const colors = require('../ui/colors/colors.js');
const {
    handleTrackStart,
    handleTrackEnd,
    handleQueueEnd,
    handlePlayerDisconnect
} = require('./handlers/trackHandler');

function initializePlayer(client) {
    const nodes = config.nodes.map(node => ({
        name: node.name,
        host: node.host,
        port: node.port,
        password: node.password,
        secure: node.secure,
        reconnectTimeout: 5000,
        reconnectTries: Infinity
    }));

    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guildId = payload.d.guild_id;
            if (!guildId) return;

            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        },
        restVersion: "v4",
        defaultSearchPlatform: "ytsearch",
    });

    // Node events
    client.riffy.on("nodeConnect", node => {
        console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.green}Node ${node.name} Connected ✅${colors.reset}`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.red}Node ${node.name} Error ❌ | ${error.message}${colors.reset}`);
    });

    // Player events - delegate to handlers
    client.riffy.on("trackStart", async (player, track) => {
        await handleTrackStart(client, player, track);
    });

    client.riffy.on("trackEnd", async (player) => {
        await handleTrackEnd(client, player);
    });

    client.riffy.on("playerDisconnect", async (player) => {
        await handlePlayerDisconnect(client, player);
    });

    client.riffy.on("queueEnd", async (player) => {
        await handleQueueEnd(client, player);
    });
}

module.exports = { initializePlayer };
