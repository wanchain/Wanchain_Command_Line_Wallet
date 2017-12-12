let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
transaction.useWalletDb();
transaction.addCurAccountFunc(function (result) {
    web3Require.web3_ipc.eth.getBalance(result[0],function (result) {
        console.log(result);
        //web3Require.runschemaStep();
        web3Require.exit();
    });
});
transaction.run(function(){
    web3Require.initTransCollection();
});

