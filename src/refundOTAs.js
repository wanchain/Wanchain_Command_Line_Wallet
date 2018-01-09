let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection','OTAsCollection']}];
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let ASyncLoopStack = require('../wanchain_web3/ASyncLoopStack.js');
let keyStore = require('../wanchain_web3/keyStore.js');
web3Require.useDb(DBArray);
transaction.addCurAccountFunc(function (result) {
    if(result)
    {
        transaction.curAddress = result;
        console.log('address: ' + transaction.curAddress);
        transaction.curWaddress = keyStore.getWAddress(transaction.curAddress);
        console.log('waddress: ' + transaction.curWaddress);
        web3Require.web3_ipc.eth.getBalance(transaction.curAddress,function (err,result) {
            if (!err) {
                console.log('balance: ' + web3Require.web3_ipc.fromWei(result.toString()));
                web3Require.web3_ipc.eth.getBlockNumber((err,number)=>{
                    if(!err)
                    {
                        var data = collection.WalletDBCollections.OTAsCollection.where(function (obj) {
                            return obj.toaddress ==transaction.curWaddress && obj.transHash && obj.transHash.length &&  parseInt(obj.state) <10;
                        });
                        if (data && data.length) {
                            let curLoop = new ASyncLoopStack(3, 2);
                            curLoop.Array = data;
                            curLoop.EachFunc = function (param, item, index) {
                                if (item.transHash && item.transHash.length) {
                                    web3Require.web3_ipc.eth.getTransactionReceipt(item.transHash, function (err, result) {
                                        if (!err) {
                                            if (result && result.blockNumber > 0) {
                                                if (result.status == "0x1") {
                                                    item.state = (number - result.blockNumber).toString();
                                                }
                                                else {
                                                    item.transhash = '';
                                                    item.state = '0';
                                                }
                                            }
                                            else
                                            {
                                                item.state = '0';
                                            }
                                            collection.WalletDBCollections.OTAsCollection.update(item);
                                        }
                                        curLoop.stepNext();
                                    });
                                }
                                else
                                {
                                    curLoop.stepNext();
                                }
                            };
                            curLoop.EndFunc = function () {
                                web3Require.stepNext();
                            }
                            curLoop.run();
                        }
                        else {
                            web3Require.stepNext();
                        }
                    }
                });

            }
            else {
                web3Require.stepNext();
            }
        });
    }
    else
    {
        web3Require.exit('No account created. You could create new one or import one from a keystore file.');
    }
});
transaction.addOTAsSelectList();
transaction.addFee();
transaction.sendRefundOTAStack();
transaction.addSend();
transaction.run();

