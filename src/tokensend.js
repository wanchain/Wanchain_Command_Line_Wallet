//new contract address on testnet: 0x9caf6d28ddc788540070c042ca453aa84eba1b76
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection','tokenCollection']}];
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addTokenSelection();
transaction.addToAccount();
transaction.addFee();
transaction.addSend();
transaction.sendTokenStack();
transaction.run();
