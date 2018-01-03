
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']},
    {db:collection.tokenOTADB,collection: ['tokenStampCollection']}];
web3Require.useDb(DBArray);

transaction.addCurAccount();
transaction.addStampBalance();
transaction.addFee();
transaction.addSend();
transaction.tokenBuyStampStack();
transaction.run(function() {
    transaction.initStampBalance();
});