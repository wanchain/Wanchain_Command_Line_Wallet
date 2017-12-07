
//var config = require('../config');

let transaction = require('../wanchain_web3/Transaction');

transaction.addCurAccount();
transaction.addToAccount();
transaction.addFee();
transaction.addSend(transaction.sendTo);
transaction.run();

