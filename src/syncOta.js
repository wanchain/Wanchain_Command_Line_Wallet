#!/usr/bin/env node


const nodeSyncOta = require('../wanchain_web3/nodeScanOta');
var web3Require = require('../wanchain_web3/web3_ipc');
web3Require.run(function () {
    nodeSyncOta.restart();
})
