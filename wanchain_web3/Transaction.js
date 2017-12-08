
var config = require('../config');

var web3Require = require('./web3_ipc');
let wanUtil = require('wanchain-util');
let curAddress;
let toAddress;
let curTransaction;
let toWAddress;
let amount;
let gasPrice;
let gasLimit;
const Transaction = {
    addCurAccount(){
        var schema = web3Require.schemaAll.AccountSchema('Select an account by inputting No. (1, 2, 3..):',
            'You inputted the wrong number.',function (schema) {
                if(web3Require.accountArray.length>0) {
                    schema.optionalArray = web3Require.accountArray;
                }
            });
//        schema.optionalArray = web3Require.accountArray;
        web3Require.addSchema(schema, function (result) {
            if(result)
            {
                curAddress = result[0];
                console.log(result);
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('No account created. You could create new one or import one from a keystore file.');
            }
        });
    },
    addToAccount(){
        web3Require.addSchema(web3Require.schemaAll.sendSchema(),function (result) {
            console.log(result);
            toAddress = result.toaddress;
            amount = result.amount;
            web3Require.stepNext();
        });
    },
    //privacy
    addToWAddress(){
        web3Require.addSchema(web3Require.schemaAll.sendPrivacySchema(),function (result) {
            console.log(result);
            toWAddress = result.waddress;
            web3Require.stepNext();
        });
    },
    addToPrivacyAmount(){
        web3Require.addSchema(web3Require.schemaAll.sendPrivacyAmount(),function (result) {
            console.log(result);
            amount = result[0];
            web3Require.stepNext();
        });
    },
    addFee(){
        web3Require.addfeeSchema(function (result) {
            console.log(result);
            if(result.FeeSel)
            {

            }
            else
            {
                gasPrice = result.gasPrice;
                gasLimit = result.gasLimit;
            }
            console.log('from: ' + curAddress);
            if(toAddress)
            {
                console.log('to: ' + toAddress);
            }
            else if(toWAddress)
            {
                console.log('to: ' + toWAddress);
            }
            console.log('value: ' + amount);
            console.log('gasPrice: ' + gasPrice);
            console.log('gas: ' + gasLimit);
            web3Require.stepNext();
        });
    },
    addSend(callback)
    {
        web3Require.addSchema(web3Require.schemaAll.YesNoSchema('submit','Do you confirm to send transaction? [Y]es or [N]o : '),function (result) {
            console.log(result);
            if(result.submit == 'Y' || result.submit == 'y')
            {
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('You have refused to send this transaction');
            }
        });
        web3Require.addSchema(web3Require.schemaAll.PasswordSchema,function (result) {
            callback(result);
            //temp.web3_ipc.personal.unlock
        });
    },
    sendTo(result)
    {
        let temp = this;
        web3Require.web3_ipc.personal.sendTransaction({
            from: curAddress,
            to: toAddress,
            value: amount,
            gasPrice: gasPrice,
            gas: gasLimit
        },result.password,function (err,result) {
            if(!err){
                console.log(result);
                insertTransaction(result,curAddress,toAddress,amount,'');
            }
            web3Require.exit(err);
        })
    },
    sendToPrivacy(result)
    {
        let temp = this;
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let otaAddr = wanUtil.generateOTAWaddress(toWAddress);
        let CoinContract = web3Require.web3_ipc.eth.contract(wanUtil.coinSCAbi);
        let CoinContractInstance = CoinContract.at(CoinContractAddr);
        var txBuyData = CoinContractInstance.buyCoinNote.getData(otaAddr, web3Require.web3_ipc.toWei(1));
        web3Require.web3_ipc.personal.sendTransaction({
            from: curAddress,
            to: CoinContractAddr,
            value: amount,
            gasPrice: gasPrice,
            gas: gasLimit,
            data: txBuyData
        }, result.password, function (err, result) {
            if (!err) {
                console.log(result);
                insertTransaction(result,curAddress,toWAddress,amount,'p');
            }
            web3Require.exit(err);
        })
    },
    addSelectList(){
        web3Require.addSchema(web3Require.schemaAll.TransListSchema('Input the No. to print the transaction details:',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                var data = web3Require.transCollection.find({'from': curAddress});
                if(data)
                {
                    data.forEach(function (item, index) {
                        schema.optionalArray.push(getCollectionItem(item));
                    });
                }
            }), function (result) {
            if(result)
            {
                curTransaction = result[0];
                console.log(result);
                web3Require.runschemaStep();
            }
            else
            {
                web3Require.exit('This account have no transaction!');
            }
        });
    },
    addOTAsSelectList(){
        web3Require.addSchema(web3Require.schemaAll.OTAsListSchema('Select transaction fee for per transaction by inputting No.:',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                let keyStore = web3Require.getFromKeystoreFile(curAddress);
                if(keyStore)
                {
                    var data = web3Require.OTAsCollection.find({'address': keyStore.waddress});
                    if(data)
                    {
                        data.forEach(function (item, index) {
                            schema.optionalArray.push(getCollectionItem(item));
                        });
                    }

                }
            }), function (result) {
            if(result)
            {
                curTransaction = result[0];
                console.log(result);
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('This account have no OTA!');
            }
        });
    },

    run()
    {
        web3Require.initFunction.push(function () {
            web3Require.initTransCollection();
        })
        web3Require.getAccounts(function(){
            web3Require.runschema();
        });
    },
    runOTAs()
    {
        web3Require.initFunction.push(function () {
            web3Require.initOTAsCollection();
        })
        web3Require.getAccounts(function(){
            web3Require.runschema();
        });
    }

};
function getCollectionItem(item) {
    var newItem = {};
    for (var key in item) {
        if(key == 'meta')
        {
            break;
        }
        newItem[key] = item[key];
    }
    return newItem;
};
function insertTransaction(transhash,from,to,value,p)
{
    var found = web3Require.transCollection.findOne({'transHash': transhash});
    if(found == null) {
        web3Require.transCollection.insert({
            transHash: transhash,
            from: from,
            to:to,
            value:value,
            time:getNowFormatDate(),
            p:p
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function insertOTAs(OTAHash,address,value,timeStamp,otaFrom,status)
{
    var found = web3Require.OTAsCollection.findOne({'OTAHash': OTAHash});
    if(found == null) {
        web3Require.OTAsCollection.insert({
            OTAHash: OTAHash,
            address: address,
            value:value,
            timeStamp:timeStamp,
            otaFrom:otaFrom,
            status:status
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
};
module.exports = Transaction;


