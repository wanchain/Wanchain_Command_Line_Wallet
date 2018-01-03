
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']},
    {db:collection.tokenOTADB,collection: ['tokenOTABalance','tokenStampCollection','tokenPrivacyTransCollection']}];
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addContractBalanceList(function (self) {
    web3Require.stepNext();
});
transaction.addToWAddress();
transaction.addTransAmount();
transaction.addStampFee();
transaction.addSend();
transaction.sendTokenPrivacyContractStack_test();
transaction.run();