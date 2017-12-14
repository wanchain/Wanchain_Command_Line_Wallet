let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
transaction.useWalletDb();
transaction.addCurAccountFunc(function (result) {
    web3Require.logger.debug(result);
    var curAddress;
    if(Array.isArray(result))
    {
        transaction.curAddress = result[0];
    }
    else
    {
        transaction.curAddress = result.curaddress;
    }
    var Data =  transaction.getTokenBalance();
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
