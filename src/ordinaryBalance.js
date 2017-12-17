let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
transaction.useWalletDb();
transaction.addCurAccountFunc(function (result) {
    web3Require.logger.debug(result);
    var curAddress;
    if(Array.isArray(result))
    {
        curAddress = result[0];
    }
    else
    {
        curAddress = result.curaddress;
    }
    web3Require.web3_ipc.eth.getBalance(curAddress,function (err,result) {
        if(!err)
        {
            console.log('balance : ' + web3Require.web3_ipc.fromWei(result.toString()));
        }
        //web3Require.runschemaStep();
        web3Require.exit(err);
    });
});
transaction.run(function(){
    web3Require.initTransCollection();
});

