
var config = require('../config');
const secp256k1 = require('secp256k1');
const web3Require = global.web3Require = require('./web3_ipc');
let wanUtil = require('wanchain-util');
var keythereum = require("keythereum");
const Db = require('./collection.js').walletDB;
const scanDb = require('./collection.js').scanOTADB;
const wanToken = require('../wanchain_web3/wanToken.js')
const Transaction = {
    curAddress: null,
    toAddress: null,
    curTransaction: null,
    toWAddress: null,
    OTAAddress: null,
    tokenAddress: null,
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
        if(config.listAccount)
        {
            var schema = web3Require.schemaAll.AccountSchema('Enter the index of the Source address(1, 2, 3..):',
                'You entered the wrong number.',function (schema) {
                    if(web3Require.accountArray.length>0) {
                        schema.optionalArray = web3Require.accountArray;
                    }
                });
//        schema.optionalArray = web3Require.accountArray;
            web3Require.addSchema(schema, func);
        }
        else
        {
            var schema = web3Require.schemaAll.AccountNameSchema('Input account address:',
                'You inputted the wrong address.');
//        schema.optionalArray = web3Require.accountArray;
            web3Require.addSchema(schema, func);
        }

    },
    addCurAccount(){
        let self = this;
        this.addCurAccountFunc(function (result) {
            if(result)
            {
                if(Array.isArray(result))
                {
                    self.curAddress = result[0];
                }
                else
                {
                    self.curAddress = result.curaddress;
                }
                console.log('address: ' + self.curAddress);
                console.log('waddress: ' + web3Require.getWAddress(self.curAddress));
                web3Require.web3_ipc.eth.getBalance(self.curAddress,function (err,result) {
                    if (!err) {
                        console.log('balance: ' + web3Require.web3_ipc.fromWei(result.toString()));
                    }
                    web3Require.stepNext();
                });
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
            if(self.OTAAddress)
            {
                console.log('from: ' + self.OTAAddress);
                console.log('to: ' + self.curAddress);
                console.log('value: 0x00 ');
            }
            else if(self.tokenAddress)
            {
                console.log('token: ' + self.tokenAddress);
                console.log('from: ' + self.curAddress);
                if(self.toAddress)
                {
                    console.log('to: ' + self.toAddress);
                }
                console.log('value: ' + self.amount);
            }
            else
            {
                console.log('from: ' + self.curAddress);
                if(self.toAddress)
                {
                    console.log('to: ' + self.toAddress);
                }
                else if(self.toWAddress)
                {
                    console.log('to: ' + self.toWAddress);
                }
                console.log('value: ' + self.amount);
            }

            console.log('gasPrice: ' + self.gasPrice/1000000000);
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
        web3Require.logger.debug(self.curAddress);
        web3Require.logger.debug(self.toAddress);
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
        web3Require.web3_ipc.wan.getOTAMixSet(self.OTAAddress, config.OTAMixNumber ,function (err,otaSet) {
            if(!err)
            {
                let keystore = web3Require.getKeystoreJSON(self.curAddress);
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
                web3Require.logger.debug("otaSetr:",otaSet);
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

                let M = new Buffer(self.curAddress.slice(2),'hex');
                let ringArgs = wanUtil.getRingSign(M, otaSk,otaPubK,otaSetBuf);
                wanUtil.verifyRinSign(ringArgs);
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
                            from: self.curAddress,
                            Txtype: '0x00',
                            nonce: serial,
                            gasPrice: self.gasPrice,
                            gas: self.gasLimit,
                            to: CoinContractAddr,//contract address
                            value: '0x00',
                            data: all
                        }, self.password, function (err, result) {
                            if (!err) {
                                console.log('Transaction hash: ' + result);
                                insertTransaction(result,self.curAddress,self.OTAAddress,'0x00','OTA');
                                var found = web3Require.OTAsCollection.findOne({'_id': self.OTAAddress});
                                if(found){
                                    found.state = 1;
                                    web3Require.OTAsCollection.update(found);
                                }
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
    sendToToken(result)
    {
        let self = this;
        web3Require.logger.debug(self.curAddress);
        web3Require.logger.debug(self.toAddress);
        web3Require.logger.debug(self.tokenAddress);
        web3Require.web3_ipc.personal.sendTransaction({
            from: self.curAddress,
            to: self.toAddress,
            value: 0x00,
            gasPrice: self.gasPrice,
            gas: self.gasLimit,
            data : wanToken.getTokenData(web3Require.web3_ipc,self.tokenAddress,self.toAddress,self.amount)
        },result.password,function (err,result) {
            if(!err){
                console.log('Transaction hash: ' + result);
                insertTransaction(result,self.curAddress,self.toAddress,self.amount,'token');
            }
            web3Require.exit(err);
        })
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
                    Temp.exit();
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
        if(config.listAccount)
        {
            web3Require.addSchema(web3Require.schemaAll.OTAsListSchema('Input the OTAs No. :',
                'The Number is invalid or nonexistent.',function (schema) {
                    schema.optionalArray = [];
                    let wAddress = web3Require.getWAddress(self.curAddress);
                    if(wAddress)
                    {
                        var data = Temp.OTAsCollection.find({'address': wAddress,'state': '0'});
                        if(data)
                        {
                            data.forEach(function (item, index) {
                                var value = getCollectionItem(item);
                                value.value = web3Require.web3_ipc.fromWei(value.value);
                                schema.optionalArray.push(value);
                            });
                        }

                    }
                }), function (result) {
                if(result)
                {
                    self.OTAAddress = result[0]._id;
                    self.amount = web3Require.web3_ipc.toWei(result[0].value);
                    web3Require.logger.debug(result);
                    web3Require.stepNext();
                }
                else
                {
                    web3Require.exit('This account have no OTA!');
                }
            });
        }
        else
        {
            web3Require.addSchema(web3Require.schemaAll.OTASNameSchema('Input the OTA:',
                'The OTA is invalid or nonexistent.'), function (result) {
                if(result)
                {
                    self.OTAAddress = result.OTAsadress;
                    web3Require.web3_ipc.wan.getOTABalance(self.OTAAddress,function (err,result) {
                        if (!err) {
                            self.amount = result;
                        }
                    });
                    web3Require.logger.debug(result);
                    web3Require.stepNext();
                }
                else
                {
                    web3Require.exit('This account have no OTA!');
                }
            });
        }

    },
    //token
    getTokenBalance(bUpdate)
    {
        let self = this;
        var Data = web3Require.tokenCollection.find({'address': this.curAddress});
        if(bUpdate)
        {
            if(Data) {
                Data.forEach(function (item, index) {
                    wanToken.getTokenBalance(web3Require.web3_ipc, item.tokenAddress, self.curAddress, function (err, result) {
                        if (!err) {
                            if (result > 0) {
                                item.value = result;
                                web3Require.tokenCollection.update(item);
                            }
                            else {
                                web3Require.tokenCollection.remove(item);
                            }
                        }
                    });
                });
            }
        }
        return Data;
    },
    addTokenSelection()
    {
        let self = this;
        var Temp = web3Require;
        var schema = web3Require.schemaAll.tokenSchema('Select an token balance by inputting No. (1, 2, 3..):',
            'You inputted the wrong number.',function (schema) {
                var data = self.getTokenBalance();
                if(data)
                {
                    data.forEach(function (item, index) {
                        var value = getCollectionItem(item);
                        value.value = web3Require.web3_ipc.fromWei(value.value);
                        schema.optionalArray.push(value);
                    });
                }
            });
//        schema.optionalArray = web3Require.accountArray;
        web3Require.addSchema(schema, function (result) {
            if(result)
            {
                if(Array.isArray(result))
                {
                    self.tokenAddress = result[0];
                }
                else
                {
                    self.tokenAddress = result.tokenAddress;
                }
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('You have no token balance.');
            }
        });
    },
    addTokenAddress()
    {
        let self = this;
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.tokenAddress('Input the token address:',
            'The token address is invalid or nonexistent.'), function (result) {
            if(result)
            {
                self.tokenAddress = result.tokenAddress;
                wanToken.getTokenBalance(web3Require.web3_ipc,self.tokenAddress,self.curAddress,function (err,result) {
                    if (!err) {
                        if(result>0)
                        {
                            console.log('add new token balance : ' + self.tokenAddress + '; value : ' + result);
                            insertTokenBalance(self.curAddress,self.tokenAddress,result);
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
                web3Require.exit('this token balance have no coin!');
            }
        });
    },
    consoleTransactionInfo(transHash,callback)
    {
        web3Require.web3_ipc.eth.getTransactionReceipt(transHash,function (err,result) {
            if(!err)
            {
                if(result)
                {
                    console.log(result);
                    callback();
                }
                else
                {
                    if(web3Require.web3_ipc.wan.pendingTransactions)
                    {
                        web3Require.web3_ipc.wan.pendingTransactions(transHash,function (err,result) {
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

                    }
                    else
                    {
                        console.log(result);
                        callback();
                    }
                }
            }
            else
            {
                console.log(err);
                callback();
            }

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
function insertTokenBalance(address,tokenAddress,value)
{
    var data = {'address': address,'tokenAddress' : tokenAddress };
    var found = web3Require.tokenCollection.findOne(data);
    if(found == null) {
        data.value = value;
        var result = web3Require.tokenCollection.maxRecord('_id');
        if(result && result.value)
        {
            data._id = result.value + 1;
        }
        else
        {
            data._id = 0;
        }
        web3Require.tokenCollection.insert(data);
    } else {
        found.value = value;
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


