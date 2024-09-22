const { Schema, model } = require('mongoose');

const ShuzukoUser = Schema({
  userID: { type: String },
  name: { type: String },
  xp: { type: Number },
  level: { type: Number, default: 1 },
  coin: { type: Number, default: 1 },
  lang: { type: String },
  volume: { type: Number, default: 100 },
});

const UserInventory = Schema({
  userID: { type: String },
  Inventory: { type: Array },
});

module.exports = {
  ShuzukoUser: model('ShuzukoUser', ShuzukoUser),
  UserInventory: model('UserInventory', UserInventory),
};
