
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
    addCurAccountFunc(func)
    {
        var schema = web3Require.schemaAll.AccountSchema('Select an account by inputting No. (1, 2, 3..):',
            'You inputted the wrong number.',function (schema) {
                if(web3Require.accountArray.length>0) {
                    schema.optionalArray = web3Require.accountArray;
                }
            });
//        schema.optionalArray = web3Require.accountArray;
        web3Require.addSchema(schema, func);
    },
    addCurAccount(){
        let self = this;
        this.addCurAccountFunc(function (result) {
            if(result)
            {
                Transaction.curAddress = result[0];
                console.log('address: ' + self.curAddress);
                console.log('waddress: ' + web3Require.getWAddress(self.curAddress));
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('No account created. You could create new one or import one from a keystore file.');
            }
        });
    },
    addToAccount(){
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.sendSchema(),function (result) {
            web3Require.logger.debug(result);
            self.toAddress = result.toaddress;
            self.amount = result.amount;
            web3Require.stepNext();
        });
    },
    //privacy
    addToWAddress(){
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.sendPrivacySchema(),function (result) {
            web3Require.logger.debug(result);
            self.toWAddress = result.waddress;
            web3Require.stepNext();
        });
    },
    addToPrivacyAmount(){
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.sendPrivacyAmount(),function (result) {
            web3Require.logger.debug(result);
            self.amount = result[0];
            web3Require.stepNext();
        });
    },
    addFee(){
        let self = this;
        web3Require.addfeeSchema(function (result) {
            web3Require.logger.debug(result);
            if(result.FeeSel)
            {
                 self.gasLimit = 300000;
                self.gasPrice = 20000000000;
            }
            else
            {
                self.gasPrice = result.gasPrice*1000000000;
                self.gasLimit = result.gasLimit;
            }
            console.log('from: ' + self.curAddress);
            if(self.toAddress)
            {
                console.log('to: ' + self.toAddress);
            }
            else if(self.toWAddress)
            {
                console.log('to: ' + self.toWAddress);
            }
            console.log('value: ' + web3Require.web3_ipc.toWei(self.amount));
            console.log('gasPrice: ' + self.gasPrice);
            console.log('gas: ' + self.gasLimit);
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
        let self = this;
        web3Require.web3_ipc.personal.sendTransaction({
            from: self.curAddress,
            to: self.toAddress,
            value: web3Require.web3_ipc.toWei(self.amount),
            gasPrice: self.gasPrice,
            gas: self.gasLimit
        },result.password,function (err,result) {
            if(!err){
                console.log('Transaction hash: ' + result);
                insertTransaction(result,self.curAddress,self.toAddress,self.amount,'');
            }
            web3Require.exit(err);
        })
    },
    sendToPrivacy(result)
    {
        let self = this;
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let otaAddr = wanUtil.generateOTAWaddress(self.toWAddress);
        let CoinContract = web3Require.web3_ipc.eth.contract(wanUtil.coinSCAbi);
        let CoinContractInstance = CoinContract.at(CoinContractAddr);
        var txBuyData = CoinContractInstance.buyCoinNote.getData(otaAddr, web3Require.web3_ipc.toWei(self.amount));
        web3Require.web3_ipc.personal.sendTransaction({
            from: self.curAddress,
            to: CoinContractAddr,
            value: web3Require.web3_ipc.toWei(self.amount),
            gasPrice: self.gasPrice,
            gas: self.gasLimit,
            data: txBuyData
        }, result.password, function (err, result) {
            if (!err) {
                console.log('Transaction hash: ' + result);
                insertTransaction(result,self.curAddress,self.toWAddress,self.amount,'p');
            }
            web3Require.exit(err);
        })
    },
    sendRefundOTA(result)
    {
        let self = this;
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let CoinContract = web3Require.web3_ipc.eth.contract(wanUtil.coinSCAbi);
        self.password = result.password;
        web3Require.web3_ipc.wan.getOTAMixSet([self.OTAAddress, config.OTAMixNumber],function (err,otaSet) {
            if(!err)
            {
                let keystore = web3Require.getKeystoreJSON();
                let keyBObj = {version:keystore.version, crypto:keystore.crypto2};
                let keyAObj = {version:keystore.version, crypto:keystore.crypto};
                let privKeyA;
                let privKeyB;
                try {
                    privKeyA = keythereum.recover(self.password, keyAObj);
                    privKeyB = keythereum.recover(self.password, keyBObj);
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
                let otaSk = wanUtil.computeWaddrPrivateKey(self.OTAAddress, privKeyA,privKeyB);
                let otaPub = wanUtil.recoverPubkeyFromWaddress(self.OTAAddress);
                let otaPubK = otaPub.A;

                let M = new Buffer(self.curAddress,'hex');
                let ringArgs = wanUtil.getRingSign(M, otaSk,otaPubK,otaSetBuf);
                let KIWQ = generatePubkeyIWQforRing(ringArgs.PubKeys,ringArgs.I, ringArgs.w, ringArgs.q);
                web3Require.logger.debug("KIWQ:", KIWQ);

                let CoinContractInstance = CoinContract.at(CoinContractAddr);

                let all = CoinContractInstance.refundCoin.getData(KIWQ,self.amount);
                web3Require.web3_ipc.eth.getTransactionCount(self.curAddress,'latest',function (err,result) {
                    if(!err)
                    {
                        let serial = '0x'+result;
                        web3Require.logger.debug("serial:", serial);
                        web3Require.web3_ipc.personal.sendTransaction({
                            Txtype: '0x00',
                            nonce: serial,
                            gasPrice: self.gasPrice,
                            gasLimit: self.gasLimit,
                            to: CoinContractAddr,//contract address
                            value: '0x00',
                            data: all
                        }, self.password, function (err, result) {
                            if (!err) {
                                console.log('Transaction hash: ' + result);
                                insertTransaction(result,self.OTAAddress,self.curAddress,'0x00','OTA');
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
        let self = this;
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.TransListSchema('Input the transaction No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                var data = Temp.transCollection.find({'from': self.curAddress});
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
                self.consoleTransactionInfo(Temp.curTransaction.transHash,function(){
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
        let self = this;
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.OTAsListSchema('Input the OTAs No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                let wAddress = web3Require.getWAddress(self.curAddress);
                if(wAddress)
                {
                    var data = Temp.OTAsCollection.find({'address': wAddress});
                    if(data)
                    {
                        data.forEach(function (item, index) {
                            var value = getCollectionItem(item);
                            value.value = web3Require.web3_ipc.toWei(value.value);
                            schema.optionalArray.push(value);
                        });
                    }

                }
            }), function (result) {
            if(result)
            {
                self.OTAAddress = result[0];
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


