//0x8bb4075cc625f86ce60803e17224f16d45214b1c
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
const wanToken = require('../wanchain_web3/wanToken.js')

let ASyncLoopStack = require('../wanchain_web3/ASyncLoopStack.js');
let DBArray = [{db:collection.tokenOTADB,collection: ['tokenOTABalance']}];
web3Require.useDb(DBArray);

transaction.addCurAccountFunc(function (result) {
    if(result)
    {
        web3Require.logger.debug(result);
        transaction.curAddress = result;
        var find = collection.tokenOTADBCollections.tokenOTABalance.find({'owner':transaction.curAddress});
        if(find && find.length)
        {
            let curLoop = new ASyncLoopStack(3,2);
            curLoop.Array = find;
            curLoop.EachFunc = function (param,item,index) {
                wanToken.getTokenPrivacyBalance(web3Require.web3_ipc,item.tokenAddress,item.waddress,function (err,result) {
                    if (!err) {
                        var value = parseFloat(web3Require.web3_ipc.fromWei(result));
                        if(value != item.value)
                        {
                            if(value>0)
                            {
                                item.value = value;
                                collection.tokenOTADBCollections.tokenOTABalance.update(item);
                            }
                            else
                            {
                                collection.tokenOTADBCollections.tokenOTABalance.remove(item);
                            }
                        }
                        if(value>0)
                        {
                            console.log(collection.getCollectionItem(item));
                        }
                    }
                    curLoop.stepNext();
                });
            }
            curLoop.EndFunc = function () {
                web3Require.stepNext();
            }
            curLoop.run();
        }
        else
        {
            web3Require.stepNext();
        }
    }
    else
    {
        web3Require.exit('No account created. You could create new one or import one from a keystore file.');
    }
//    web3Require.stepNext();
});
transaction.addTokenAddress(true);
transaction.addTokenOTAaddress();
transaction.run();
