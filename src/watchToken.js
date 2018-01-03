let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['tokenCollection']}];
web3Require.useDb(DBArray);
transaction.addCurAccountFunc(function (result) {
    web3Require.logger.debug(result);
    transaction.curAddress = result;
    var Data =  transaction.getTokenBalance(true);
    if(Data)
    {
        Data.forEach(function (item, index) {
            var value = {'tokenAddress' : item.tokenAddress,'value' : web3Require.web3_ipc.fromWei(item.value)};
            console.log(value);
        });
    }
    web3Require.stepNext();
});
transaction.addTokenAddress();
transaction.run();
