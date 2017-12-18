let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
transaction.useWalletDb();
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
transaction.run(function(){
    web3Require.initTokenCollection();
});
