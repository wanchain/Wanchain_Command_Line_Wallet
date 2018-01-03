#!/usr/bin/env node
const tokenOTAScan = require('../wanchain_web3/tokenOTAScan.js');
var web3Require = require('../wanchain_web3/web3_ipc');
//const tokenScanOTADB = require('../wanchain_web3/collection.js').scanOTADB;
//web3Require.dbArray.push(tokenScanOTADB);
web3Require.run(function () {
    tokenOTAScan.start();
});
