
var config = require('../config');
const secp256k1 = require('secp256k1');
const web3Require = global.web3Require = require('./web3_ipc');
let wanUtil = require('wanchain-util');
const Db = require('./collection.js').walletDB;
const scanDb = require('./collection.js').scanOTADB;
const Transaction = {
    curAddress: null,
    toAddress: null,
    curTransaction: null,
    toWAddress: null,
    OTAAddress: null,
    amount: null,
    gasPrice: null,
    gasLimit: null,
    useWalletDb()
    {
        web3Require.dbArray.push(Db);
    },
    useScanOTADb()
    {
        web3Require.dbArray.push(scanDb);
    },
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
                Transaction.curAddress = result[0];
                console.log('address: ' + Transaction.curAddress);
                console.log('waddress: ' + web3Require.getWAddress(Transaction.curAddress));
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
            web3Require.logger.debug(result);
            Transaction.toAddress = result.toaddress;
            Transaction.amount = result.amount;
            web3Require.stepNext();
        });
    },
    //privacy
    addToWAddress(){
        web3Require.addSchema(web3Require.schemaAll.sendPrivacySchema(),function (result) {
            web3Require.logger.debug(result);
            Transaction.toWAddress = result.waddress;
            web3Require.stepNext();
        });
    },
    addToPrivacyAmount(){
        web3Require.addSchema(web3Require.schemaAll.sendPrivacyAmount(),function (result) {
            web3Require.logger.debug(result);
            Transaction.amount = result[0];
            web3Require.stepNext();
        });
    },
    addFee(){
        web3Require.addfeeSchema(function (result) {
            web3Require.logger.debug(result);
            if(result.FeeSel)
            {

            }
            else
            {
                Transaction.gasPrice = result.gasPrice;
                Transaction.gasLimit = result.gasLimit;
            }
            console.log('from: ' + Transaction.curAddress);
            if(Transaction.toAddress)
            {
                console.log('to: ' + Transaction.toAddress);
            }
            else if(Transaction.toWAddress)
            {
                console.log('to: ' + Transaction.toWAddress);
            }
            console.log('value: ' + Transaction.amount);
            console.log('gasPrice: ' + Transaction.gasPrice);
            console.log('gas: ' + Transaction.gasLimit);
            web3Require.stepNext();
        });
    },
    addSend(callback)
    {
        web3Require.addSchema(web3Require.schemaAll.YesNoSchema('submit','Do you confirm to send transaction? [Y]es or [N]o : '),function (result) {
            web3Require.logger.debug(result);
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
            from: Transaction.curAddress,
            to: Transaction.toAddress,
            value: Transaction.amount,
            gasPrice: Transaction.gasPrice,
            gas: Transaction.gasLimit
        },result.password,function (err,result) {
            if(!err){
                console.log('Transaction hash: ' + result);
                insertTransaction(result,Transaction.curAddress,Transaction.toAddress,Transaction.amount,'');
            }
            web3Require.exit(err);
        })
    },
    sendToPrivacy(result)
    {
        let temp = this;
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let otaAddr = wanUtil.generateOTAWaddress(Transaction.toWAddress);
        let CoinContract = web3Require.web3_ipc.eth.contract(wanUtil.coinSCAbi);
        let CoinContractInstance = CoinContract.at(CoinContractAddr);
        var txBuyData = CoinContractInstance.buyCoinNote.getData(otaAddr, web3Require.web3_ipc.toWei(Transaction.amount));
        web3Require.web3_ipc.personal.sendTransaction({
            from: Transaction.curAddress,
            to: CoinContractAddr,
            value: Transaction.amount,
            gasPrice: Transaction.gasPrice,
            gas: Transaction.gasLimit,
            data: txBuyData
        }, result.password, function (err, result) {
            if (!err) {
                console.log('Transaction hash: ' + result);
                insertTransaction(result,Transaction.curAddress,Transaction.toWAddress,Transaction.amount,'p');
            }
            web3Require.exit(err);
        })
    },
    sendRefundOTA(result)
    {
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let CoinContract = web3Require.web3_ipc.eth.contract(wanUtil.coinSCAbi);
        Transaction.password = result.password;
        web3Require.web3_ipc.wan.getOTAMixSet([Transaction.OTAAddress, config.OTAMixNumber],function (err,otaSet) {
            if(!err)
            {
                let keystore = web3Require.getKeystoreJSON();
                let keyBObj = {version:keystore.version, crypto:keystore.crypto2};
                let keyAObj = {version:keystore.version, crypto:keystore.crypto};
                let privKeyA;
                let privKeyB;
                try {
                    privKeyA = keythereum.recover(Transaction.password, keyAObj);
                    privKeyB = keythereum.recover(Transaction.password, keyBObj);
                }catch(error){
                    console.log('wan_refundCoin', 'wrong password');
                    web3Require.exit();
                }

                //let otaSetr = await ethereumNode.send('eth_getOTAMixSet', [otaDestAddress, number]);
                //let otaSet = otaSetr.result;
                web3Require.logger.debug("otaSetr:",otaSetr);
                let otaSetBuf = [];
                for(let i=0; i<otaSet.length; i++){
                    let rpkc = new Buffer(otaSet[i].slice(2,68),'hex');
                    let rpcu = secp256k1.publicKeyConvert(rpkc, false);
                    otaSetBuf.push(rpcu);
                }
                web3Require.logger.debug('fetch  ota set: ', otaSet);
                let otaSk = wanUtil.computeWaddrPrivateKey(Transaction.OTAAddress, privKeyA,privKeyB);
                let otaPub = wanUtil.recoverPubkeyFromWaddress(Transaction.OTAAddress);
                let otaPubK = otaPub.A;

                let M = new Buffer(Transaction.curAddress,'hex');
                let ringArgs = wanUtil.getRingSign(M, otaSk,otaPubK,otaSetBuf);
                let KIWQ = generatePubkeyIWQforRing(ringArgs.PubKeys,ringArgs.I, ringArgs.w, ringArgs.q);
                web3Require.logger.debug("KIWQ:", KIWQ);

                let CoinContractInstance = CoinContract.at(CoinContractAddr);

                let all = CoinContractInstance.refundCoin.getData(KIWQ,Transaction.amount);
                web3Require.web3_ipc.eth.getTransactionCount(Transaction.curAddress,'latest',function (err,result) {
                    if(!err)
                    {
                        let serial = '0x'+result;
                        web3Require.logger.debug("serial:", serial);
                        web3Require.web3_ipc.personal.sendTransaction({
                            Txtype: '0x00',
                            nonce: serial,
                            gasPrice: Transaction.gasPrice,
                            gasLimit: Transaction.gasLimit,
                            to: CoinContractAddr,//contract address
                            value: '0x00',
                            data: all
                        }, Transaction.password, function (err, result) {
                            if (!err) {
                                console.log('Transaction hash: ' + result);
                                insertTransaction(result,Transaction.OTAAddress,Transaction.curAddress,'0x00','OTA');
                            }
                            web3Require.exit(err);
                        });
                    }
                    else{
                        web3Require.exit(err);
                    }
                })


            }
            else {
                web3Require.exit(err);
            }

        });

    },
    addSelectList(){
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.TransListSchema('Input the transaction No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                var data = Temp.transCollection.find({'from': Transaction.curAddress});
                if(data)
                {
                    data.forEach(function (item, index) {
                        schema.optionalArray.push(getCollectionItem(item));
                    });
                }
            }), function (result) {
            if(result)
            {
                Temp.curTransaction = result[0];
                web3Require.logger.debug(result);
                Transaction.consoleTransactionInfo(Temp.curTransaction.transHash,function(){
                    Temp.runschemaStep()
                });
            }
            else
            {
                web3Require.exit('This account have no transaction!');
            }
        });
    },
    addOTAsSelectList(){
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.OTAsListSchema('Input the OTAs No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                let wAddress = web3Require.getWAddress(Transaction.curAddress);
                if(wAddress)
                {
                    var data = Temp.OTAsCollection.find({'address': wAddress});
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
                Transaction.OTAAddress = result[0];
                web3Require.logger.debug(result);
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('This account have no OTA!');
            }
        });
    },
    consoleTransactionInfo(transHash,callback)
    {
        web3Require.web3_ipc.eth.getTransactionReceipt(transHash,function (err,result) {
           if(!err)
           {
               console.log(result);
           }
           else
           {
               console.log(err);
           }
            callback();
        });
    },

    run(initFunc)
    {
        if(initFunc)
        {
            web3Require.initFunction.push(initFunc);
        }
        web3Require.getAccounts(function(){
            web3Require.runschema();
        });
    },

};
function getCollectionItem(item) {
    var newItem = {};
    for (var key in item) {
        if(key !== 'meta' && key !== '$loki')
        {
            newItem[key] = item[key];
        }
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
            Type:p
        });
    } else {
        web3Require.logger.debug(transhash + 'is already existed!');
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
function generatePubkeyIWQforRing(Pubs, I, w, q){
    let length = Pubs.length;
    let sPubs  = [];
    for(let i=0; i<length; i++){
        sPubs.push(Pubs[i].toString('hex'));
    }
    let ssPubs = sPubs.join('&');
    let ssI = I.toString('hex');
    let sw  = [];
    for(let i=0; i<length; i++){
        sw.push('0x'+w[i].toString('hex').replace(/(^0*)/g,""));
    }
    let ssw = sw.join('&');
    let sq  = [];
    for(let i=0; i<length; i++){
        sq.push('0x'+q[i].toString('hex').replace(/(^0*)/g,""));
    }
    let ssq = sq.join('&');

    let KWQ = [ssPubs,ssI,ssw,ssq].join('+');
    return KWQ;
};
module.exports = Transaction;


