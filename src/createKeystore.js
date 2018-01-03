let keyStore = require('../wanchain_web3/keyStore.js');

const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
// Start the prompt
web3Require.addSchema(web3Require.schemaAll.keyPasswordSchema, function (result) {
    if(result.password.length<2)
    {
        console.log("Password is too short!");
        web3Require.runschemaStep();
    }
    else if(result.password != result.repeatPass)
    {
        console.log("Password is wrong!");
        web3Require.runschemaStep();
    }
    else
    {
        web3Require.web3_ipc.personal.newAccount(String(result.password),function (err,result) {
            if(!err)
            {
                console.log('address: ' + result);
                console.log('waddress: ' + keyStore.getWAddress(result));
            }
            web3Require.exit(err);
        })
    }
});
web3Require.runschema();

