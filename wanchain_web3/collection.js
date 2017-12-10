let newDb = require('../wanchain_web3/newDb.js');
exports.walletDB = new newDb('wanchain.db');
exports.scanOTADB = new newDb('scanOTA.db');