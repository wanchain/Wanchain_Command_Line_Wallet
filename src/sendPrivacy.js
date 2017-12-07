
let transaction = require('../wanchain_web3/Transaction');

transaction.addCurAccount();
transaction.addToWAddress();
transaction.addToPrivacyAmount();
transaction.addFee();
transaction.addSend(transaction.sendToPrivacy);
transaction.run();