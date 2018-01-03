//0x2572b9581b0199ea1a1f9b46f8a9b6df76ec79ad
//0x4e8535cd98fc10c33b8770c607e650031e01316f
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
