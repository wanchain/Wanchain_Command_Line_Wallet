let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['tokenCollection']}];
const wanToken = require('../wanchain_web3/wanToken.js');
let wanUtil = require('wanchain-util');
function  getAddressAndKeyFrom(WAddress)
{
    let token_to_ota_a = wanUtil.recoverPubkeyFromWaddress(WAddress).A;
    return "0x"+wanUtil.sha3(token_to_ota_a.slice(1)).slice(-20).toString('hex');
}
web3Require.useDb(DBArray);
transaction.addToWAddress();
web3Require.addSchema(web3Require.schemaAll.tokenAddress('Input the token address:',
    'The token address is invalid or nonexistent.'), function (result) {
    if(result) {
        transaction.toAddress = getAddressAndKeyFrom(transaction.toWAddress);
        console.log()
        transaction.tokenAddress = result.tokenAddress;
        wanToken.getTokenBalance(web3Require.web3_ipc,transaction.tokenAddress,transaction.toAddress,function (err,result) {
            if (!err) {
                if(result>0)
                {
                    console.log('add new token balance : ' + self.tokenAddress + '; value : ' + web3Require.web3_ipc.fromWei(result));
                }
                else
                {
                    console.log('this token balance have no coin!');
                }
            }
            web3Require.runschemaStep();
        });
    }
    else
    {
        web3Require.stepNext();
    }
});
transaction.run();
