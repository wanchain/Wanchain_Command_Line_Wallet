//0x2572b9581b0199ea1a1f9b46f8a9b6df76ec79ad
//0x4e8535cd98fc10c33b8770c607e650031e01316f
//0xa14fb401479a25340b5eb6cfe08ec5a6ff1b68b9

//0x39904591ef08245afc343246cc4a017d81fe11b3
//wanCoin 0xcd606c578726929a684c0c330e6b85dd28701593
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']}];
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addFee();
transaction.addSend();
transaction.sendDeployContractStack();
transaction.run();
