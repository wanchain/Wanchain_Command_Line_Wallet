#!/usr/bin/env node


const nodeSyncOta = require('../wanchain_web3/nodeScanOta');
global.db.init().then(
    nodeSyncOta.restart
);
