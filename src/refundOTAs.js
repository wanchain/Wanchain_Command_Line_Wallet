let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');

transaction.addCurAccount();
transaction.addOTAsSelectList();
transaction.addFee();
transaction.addSend(transaction.sendTo);
transaction.run(web3Require.initOTAsCollection);

