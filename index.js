require('dotenv').config();
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { initializePlayer } = require('./music/player');
const { initializeFirebase } = require('./firebase');
const colors = require('./ui/colors/colors.js');

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;
initializePlayer(client);

client.on("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    client.riffy.init(client.user.id);
});
client.config = config;

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0]; 
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});


client.commands = [];

function loadCommands(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Nếu là thư mục, load commands trong thư mục đó
      loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      try {
        const props = require(path.resolve(filePath));
        if (props.name && props.description) {
          client.commands.push({
            name: props.name,
            description: props.description,
            options: props.options || [],
          });
          console.log(`${colors.cyan}[ COMMAND ]${colors.reset} ${colors.green}Loaded: ${props.name}${colors.reset}`);
        }
      } catch (err) {
        console.log(`${colors.cyan}[ COMMAND ]${colors.reset} ${colors.red}Error loading ${file}: ${err.message}${colors.reset}`);
      }
    }
  }
}

loadCommands(config.commandsDir);


client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}🔐 TOKEN VERIFICATION${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ TOKEN ]${colors.reset} ${colors.red}Authentication Failed ❌${colors.reset}`);
  console.log(`${colors.gray}Error: Turn On Intents or Reset New Token${colors.reset}`);
});
initializeFirebase().then(() => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}� FIREBASE STATUS${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ FIREBASE ]${colors.reset} ${colors.green}Firestore Online ✅${colors.reset}`);
}).catch((err) => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}� FIREBASE STATUS${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ FIREBASE ]${colors.reset} ${colors.red}Connection Failed ❌${colors.reset}`);
  console.log(`${colors.gray}Error: ${err.message}${colors.reset}`);
});

const express = require("express");
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'web', 'index.html'); // Sửa đường dẫn
    res.sendFile(imagePath);
});

app.listen(port, () => {
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}🌐 SERVER STATUS${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online ✅${colors.reset}`);
    console.log(`${colors.cyan}[ PORT ]${colors.reset} ${colors.yellow}http://localhost:${port}${colors.reset}`);
});
