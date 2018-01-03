
//var config = require('../config');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']}];
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addToAccount();
transaction.addFee();
transaction.addSend();
transaction.sendOrdinarySendStack();
transaction.run();

