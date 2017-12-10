#!/usr/bin/env node
const nodeSyncOta = require('../wanchain_web3/nodeScanOta');
var web3Require = require('../wanchain_web3/web3_ipc');
const scanDb = require('../wanchain_web3/collection.js').scanOTADB;
web3Require.dbArray.push(scanDb);
web3Require.run(function () {
    nodeSyncOta.restart();
});
