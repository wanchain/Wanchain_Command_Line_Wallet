
//var config = require('../config');

let transaction = require('../wanchain_web3/Transaction');
var web3Require = require('../wanchain_web3/web3_ipc');

transaction.addCurAccount();
transaction.addToAccount();
transaction.addFee();
transaction.addSend(transaction.sendTo);
transaction.run(web3Require.initTransCollection);

