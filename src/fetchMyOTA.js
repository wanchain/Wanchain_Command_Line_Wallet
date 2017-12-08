const fetchMyOta = require('../wanchain_web3/nodeScan.js');
var web3Require = require('../wanchain_web3/web3_ipc');
let transaction = require('../wanchain_web3/Transaction');
transaction.addCurAccount();
web3Require.addSchema(web3Require.schemaAll.PasswordSchema, function (result) {
    if(result.password.length<2)
    {
        console.log("Password is too short!");
        web3Require.runschemaStep();
    }

    else {
        let keystore = web3Require.getKeystoreJSON(transaction.curAddress);
        if (keystore)
        {
            fetchMyOta.start(keystore, result.password);
        }
        web3Require.exit();
    }
});
transaction.run();
