let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']}];
web3Require.useDb(DBArray);
transaction.addCurAccountFunc(function (result) {
    web3Require.logger.debug(result);
    var curAddress = result;
    web3Require.web3_ipc.eth.getBalance(curAddress,function (err,result) {
        if(!err)
        {
            console.log('balance : ' + web3Require.web3_ipc.fromWei(result.toString()));
        }
        //web3Require.runschemaStep();
        web3Require.exit(err);
    });
});
transaction.run();

