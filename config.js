require('dotenv').config();

module.exports = {
    /**
     * Bot token và IDs
     */
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    ownerID: process.env.OWNER_ID?.split(',') || [],

    /**
     * Màu embed mặc định (hex)
     */
    embedColor: "#1db954",

    /**
     * Support Server
     */
    SupportServer: "https://discord.gg/2tuWpyT",

    /**
     * Activity Configuration (for ready.js)
     */
    activityName: "🎵 Shuzuko",
    activityType: "LISTENING",

    /**
     * Language Configuration
     */
    language: "en",

    /**
     * Firebase Configuration (thay thế MongoDB)
     */
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
    },

    /**
     * Lavalink nodes
     */
    nodes: [
        {
            name: "Phuong-Trang-Main",
            password: process.env.LAVALINK_PASSWORD,
            host: process.env.LAVALINK_HOST,
            port: parseInt(process.env.LAVALINK_PORT),
            secure: true
        }
    ],

    /**
     * Đường dẫn commands và events
     */
    commandsDir: './commands',
    eventsDir: './events',

    /**
     * Embed timeout (seconds)
     */
    embedTimeout: 5
};