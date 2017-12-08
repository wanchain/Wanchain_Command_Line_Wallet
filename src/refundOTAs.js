let transaction = require('../wanchain_web3/Transaction');

transaction.addCurAccount();
transaction.addOTAsSelectList();
transaction.run(web3Require.initOTAsCollection);

