//0x3a0b8045f17b80f3f4e447579f86ac2bfd9773a9
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
const wanToken = require('../wanchain_web3/wanToken.js');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']},
    {db:collection.tokenOTADB,collection: ['tokenOTABalance']}];
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addTokenAddress(true);
transaction.addFee();
transaction.addSend();
transaction.initPrivacyAssetStack();
transaction.run();
