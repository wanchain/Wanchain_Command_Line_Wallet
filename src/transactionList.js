let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');

transaction.addCurAccount();
transaction.addSelectList();
transaction.run(web3Require.initTransCollection);

