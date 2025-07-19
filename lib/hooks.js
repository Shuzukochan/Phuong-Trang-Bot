const config = require('../config');
const winston = require('winston');

// Global state management
const globalState = {
  client: null,
  database: null,
  commands: new Map(),
  functions: new Map(),
  giveaways: null,
  responder: null,
  welcome: null,
  ai: null,
  logger: null,
  config: null,
  cooldowns: new Map()
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' })
  ]
});

// Hook functions
const useClient = () => globalState.client;
const useDB = () => globalState.database;
const useCommands = () => globalState.commands;
const useFunctions = () => globalState.functions;
const useGiveaways = () => globalState.giveaways;
const useResponder = () => globalState.responder;
const useWelcome = () => globalState.welcome;
const useAI = () => globalState.ai;
const useLogger = () => logger;
const useConfig = (configOverride) => configOverride || config;
const useCooldowns = () => globalState.cooldowns;

// Setters
const setClient = (client) => { globalState.client = client; };
const setDB = (database) => { globalState.database = database; };
const setCommands = (commands) => { globalState.commands = commands; };
const setFunctions = (functions) => { globalState.functions = functions; };
const setGiveaways = (giveaways) => { globalState.giveaways = giveaways; };
const setResponder = (responder) => { globalState.responder = responder; };
const setWelcome = (welcome) => { globalState.welcome = welcome; };
const setAI = (ai) => { globalState.ai = ai; };

module.exports = {
  // Hooks
  useClient,
  useDB,
  useCommands,
  useFunctions,
  useGiveaways,
  useResponder,
  useWelcome,
  useAI,
  useLogger,
  useConfig,
  useCooldowns,
  
  // Setters
  setClient,
  setDB,
  setCommands,
  setFunctions,
  setGiveaways,
  setResponder,
  setWelcome,
  setAI,
  
  // State
  globalState
}; 