const config = require("../config.js");
const { InteractionType } = require('discord.js');
const fs = require("fs");
const path = require("path");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    // Load language file
    const languageFile = path.join(__dirname, `../languages/${config.language}.js`);
    const lang = require(languageFile);

    if (interaction?.type === InteractionType.ApplicationCommand) {
      const commandName = interaction.commandName;
      
      // Tìm command trong các thư mục
      function findCommand(dir, cmdName) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            const result = findCommand(filePath, cmdName);
            if (result) return result;
          } else if (file.endsWith('.js')) {
            try {
              const props = require(path.resolve(filePath));
              if (props.name === cmdName) {
                return props;
              }
            } catch (err) {
              console.error(`Error loading command ${file}:`, err.message);
            }
          }
        }
        return null;
      }

      const command = findCommand(config.commandsDir, commandName);
      
      if (command) {
        try {
          if (interaction?.member?.permissions?.has(command?.permissions || "0x0000000000000800")) {
            return command.run(client, interaction, lang);
          } else {
            return interaction?.reply({ content: lang.errors?.noPermission || "❌ You don't have permission to use this command.", ephemeral: true });
          }
        } catch (e) {
          console.error("Command execution error:", e);
          const errorMsg = lang.errors?.generalError?.replace("{error}", e.message) || `❌ An error occurred: ${e.message}`;
          return interaction?.reply({ content: errorMsg, ephemeral: true });
        }
      } else {
        return interaction?.reply({ content: lang.errors?.commandNotFound || "❌ Command not found.", ephemeral: true });
      }
    }
  } catch (e) {
    console.error("Interaction error:", e);
  }
};
