const { GuildQueueEvent } = require('discord-player');
const config = require('../config');
module.exports = {
  name: GuildQueueEvent.connection,
  type: 'Player',
  /**
   *
   * @param { import('discord-player').GuildQueue } queue
   */

  execute: async queue => {
    if (!queue?.metadata?.voiceAssistance && !config?.voiceAssistance) return;
    const speechOptions = {
      ignoreBots: true,
      minimalVoiceMessageDuration: 1,
      lang: queue?.metadata?.lang?.local_names || 'vi-VN',
    };
    const { player, connection } = queue;
  },
};
