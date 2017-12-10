let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
transaction.useWalletDb();
transaction.addCurAccount();
transaction.addOTAsSelectList();
transaction.addFee();
transaction.addSend(transaction.sendTo);
transaction.run(function () {
    web3Require.initOTAsCollection();
});

