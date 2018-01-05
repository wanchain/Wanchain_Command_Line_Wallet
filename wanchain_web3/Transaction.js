let collection = require('../wanchain_web3/collection.js');
const web3Require = global.web3Require = require('./web3_ipc');
const wanToken = require('../wanchain_web3/wanToken.js')
const privacyTransInfo = require('./privacyTransInfo.js');
let functionStack = require('./functionStack.js');
let keyStore = require('./keyStore.js');
const Transaction = {
    curAddress: null,
    curWaddress: null,
    toAddress: null,
    curTransaction: null,
    toWAddress: null,
    OTAAddress: null,
    OTABalances: null,
    tokenAddress: null,
    amount: null,
    gasPrice: null,
    gasLimit: null,
    transaction:{
        Txtype: '0x01',
        from: null,
        to : null,
        value : null,
        gasPrice: null,
        gas: null,
        data:'',
    },
    privacyToken:{
        defStampBalances: null,
        stampValue: null,
        address : null,
        waddress: null,
        stampWAddress : null,
        toWAddress: null,
    },
    transPassword: null,
    funcResult: null,
    //function properties
    transInfo: function (result,self) {
        if(result.FeeSel)
        {
            self.gasLimit = 300000;
            self.gasPrice = self.GWinToWin(200);
        }
        else
        {
            self.gasPrice = self.GWinToWin(result.gasPrice);
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

        console.log('gasPrice: ' + self.toGWin(self.gasPrice));
        console.log('gas: ' + self.gasLimit);
    },
    send: new functionStack(),
    sendTransaction(self)
    {
        self.funcResult = null;
        web3Require.logger.debug(self.transaction);

        web3Require.web3_ipc.personal.sendTransaction(self.transaction,self.transPassword,function (err,result) {
            if(!err){
                console.log('Transaction hash: ' + result);
                self.funcResult = result;
                self.send.stepNext();
            }
            else
            {
                web3Require.exit(err);
            }
        })

    },
    toGWin(value)
    {
        return value/1000000000;
    },
    GWinToWin(GValue)
    {
        return GValue * 1000000000;
    },
    useWalletDb()
    {
        web3Require.useWalletDb();
    },
    useScanOTADb()
    {
        web3Require.useScanOTADb();
    },
    addCurAccountFunc(func)
    {
        var schema = web3Require.schemaAll.AccountSchema('Enter the index of the Source address(1, 2, 3..):',
            'You entered the wrong number.',function (schema) {
                if(web3Require.accountArray.length>0) {
                    schema.optionalArray = web3Require.accountArray;
                }
            });
        web3Require.addSchema(schema, func);

    },
    addCurAccount(){
        let self = this;
        this.addCurAccountFunc(function (result) {
            if(result)
            {
                self.curAddress = result;
                console.log('address: ' + self.curAddress);
                self.curWaddress = keyStore.getWAddress(self.curAddress);
                console.log('waddress: ' + self.curWaddress);
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
    addTransAmount()
    {
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.sendAmountSchema(),function (result) {
            web3Require.logger.debug(result);
            self.amount = result.amount;
            web3Require.stepNext();
        });
    },
    addToPrivacyAmount(){
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.sendPrivacyAmount(function (schema) {
            schema.optionalArray = self.OTABalances;
        }),function (result) {
            web3Require.logger.debug(result);
            self.amount = result;
            web3Require.stepNext();
        });
    },
    initOTABalances()
    {
        let self = this;
        web3Require.web3_ipc.wan.getSupportWanCoinOTABalances(function (err,result) {
            if(!err)
            {
                self.OTABalances = [];
                result.forEach(function (item) {
                    self.OTABalances.push(parseFloat(web3Require.web3_ipc.fromWei(item)));
                })
            }
        });
    },
    initStampBalance()
    {
        let self = this;
        web3Require.web3_ipc.wan.getSupportStampOTABalances(function (err,result) {
            if(!err)
            {
                self.privacyToken.defStampBalances = [];
                result.forEach(function (item) {
                    self.privacyToken.defStampBalances.push(self.toGWin(item));
                })
            }
        });
    },
    addStampBalance(){
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.stampBalanceSchema(function (schema) {
            schema.optionalArray = self.privacyToken.defStampBalances;
            }

        ),function (result) {
            web3Require.logger.debug(result);
            self.privacyToken.stampValue = self.GWinToWin(result);
            web3Require.stepNext();
        });
    },
    addFee(){
        let self = this;
        web3Require.addfeeSchema(function (result) {
            web3Require.logger.debug(result);
            self.transInfo(result,self);
            web3Require.stepNext();
        });
    },
    addStampFee()
    {
        let self = this;
        let temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.stampSelSchema(function (schema) {
            schema.optionalArray = [];
            var data = collection.tokenOTADBCollections.tokenStampCollection.find({'address': self.curAddress,'status': 0});
            if(data)
            {
                data.forEach(function (item, index) {
                    var stamp = getCollectionItem(item);
                    stamp.value = self.toGWin(stamp.value);
                    schema.optionalArray.push(stamp);
                });
            }
        }),function (result) {
            if(result)
            {
                web3Require.logger.debug(result);
                self.privacyToken.stampWAddress = result;
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('Please buy stamp first!');
            }

        });
    },
    addSend()
    {
        let self = this;
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
            self.sendTransactionResult(result);
            //temp.web3_ipc.personal.unlock
        });
    },
    sendTransactionResult(result)
    {
        this.transPassword = result.password;
        this.send.run();
    },
    sendOrdinarySendStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = self.toAddress;
            self.transaction.value = web3Require.web3_ipc.toWei(self.amount);
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toAddress,self.amount,'');
            }
            web3Require.exit(null);
        },this);
    },
    sendPrivacySendStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = privacyTransInfo.toCoinContractAddr;
            self.transaction.value = web3Require.web3_ipc.toWei(self.amount);
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            self.transaction.data = privacyTransInfo.sendPrivacyData(web3Require.web3_ipc,self.toWAddress,self.amount);
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toWAddress,self.amount,'p');
            }
            web3Require.exit(null);
        },this);
    },
    sendRefundOTAStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = privacyTransInfo.toCoinContractAddr;
            self.transaction.value = '0x00';
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
        },this);
        this.send.addFunction(function(self){
            //refund amount is wei. Remember don't web3.toWei
            privacyTransInfo.refundPrivacyData(web3Require.web3_ipc,self.curAddress,self.transPassword,self.OTAAddress,
                self.amount,function(err,result){
                    if(!err)
                    {
                        self.transaction.data = result;
                        self.send.stepNext();
                    }
                    else
                    {
                        web3Require.exit(err);
                    }
                });
        },this,true);
        this.send.addFunction(function(self){
            self.funcResult = null;
            web3Require.logger.debug(self.transaction);

            web3Require.web3_ipc.personal.sendTransaction(self.transaction,self.transPassword,function (err,result) {
                if(!err){
                    console.log('Transaction hash: ' + result);
                    self.funcResult = result;
                    self.send.stepNext();
                }
                else
                {
                    if(err.message == 'OTA is reused')
                    {
                        self.funcResult = "warning: " + err.message;
                        console.log(self.funcResult);
                        self.send.stepNext();
                    }
                    else
                    {
                        web3Require.exit(err);
                    }
                }
            })
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                if(self.funcResult.slice(0,7) != 'warning')
                {
                    insertTransaction(self.funcResult,self.curAddress,self.OTAAddress,'0x00','OTA');
                    var found = collection.WalletDBCollections.OTAsCollection.findOne({'waddress': self.OTAAddress});
                    if(found){
                        found.transHash = self.funcResult;
                        collection.WalletDBCollections.OTAsCollection.update(found);
                    }
                }
                else
                {
                    var found = collection.WalletDBCollections.OTAsCollection.findOne({'waddress': self.OTAAddress});
                    if(found){
                        found.state = 1;
                        collection.WalletDBCollections.OTAsCollection.update(found);
                    }
                }
            }
            web3Require.exit(null);
        },this);
    },

    sendTokenStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = self.tokenAddress;
            self.transaction.value = '0x00';
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            self.transaction.data = wanToken.getTokenData(web3Require.web3_ipc,self.tokenAddress,self.toAddress,web3Require.web3_ipc.toWei(self.amount));
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toAddress,self.amount,'token');
            }
            web3Require.exit(null);
        },this);
    },

    sendWanCoinStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = self.tokenAddress;
            self.transaction.value = '0x00';
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            self.transaction.data = wanToken.getWanCoinData(web3Require.web3_ipc,self.tokenAddress,web3Require.web3_ipc.toWei(self.amount));
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.tokenAddress,self.amount,'token');
            }
            web3Require.exit(null);
        },this);
    },
    sendDeployContractStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.value = '0x00';
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            self.transaction.data = wanToken.deployContractData(web3Require.web3_ipc,"../sol/StandardToken.sol",'StandardToken');
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toAddress,self.amount,'contract');
            }
            web3Require.exit(null);
        },this);
    },
    initPrivacyAssetStack()
    {
        this.send.addFunction(function(self){
            self.amount = web3Require.web3_ipc.toWei(5000);
            self.transaction.from = self.curAddress;
            self.transaction.to = self.tokenAddress;
            self.transaction.value = '0x00';
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            var value = wanToken.initPrivacyAssetData(web3Require.web3_ipc,self.curAddress,self.curWaddress,self.tokenAddress,self.amount);
            self.transaction.data = value[2];
            self.privacyToken.address = value[0];
            self.privacyToken.waddress = value[1];
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toAddress,self.amount,'initPrivacy');
                collection.tokenOTADBCollections.insertTokenCollection(collection.tokenOTADBCollections.tokenOTABalance,
                    {   owner:self.curAddress,
                        waddress:self.privacyToken.waddress,
                        tokenAddress:self.tokenAddress,
                        value:web3Require.web3_ipc.fromWei(self.amount)});
            }
            web3Require.exit(null);
        },this);
    },
    tokenBuyStampStack()
    {
        this.send.addFunction(function(self){
            self.transaction.from = self.curAddress;
            self.transaction.to = wanToken.stampContractAddr;
            self.transaction.value = self.privacyToken.stampValue;
            self.transaction.gasPrice = self.gasPrice;
            self.transaction.gas = self.gasLimit;
            var value = wanToken.getStampData(web3Require.web3_ipc,self.curAddress,self.curWaddress,self.privacyToken.stampValue);
            self.transaction.data = value[1];
            self.privacyToken.stampWAddress = value[0];
        },this);
        this.send.addFunction(function(self){
            self.sendTransaction(self);
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toAddress,self.amount,'stamp');
                insertPrivacyStamps(self.curAddress,self.privacyToken.stampWAddress,self.privacyToken.stampValue);
            }
            web3Require.exit(null);
        },this);
    },
    sendTokenPrivacyContractStack()
    {
        this.send.addFunction(function(self){
            self.transaction.to = self.tokenAddress;
            self.transaction.value = '0x0';
            self.transaction.gasPrice = '0x' + (self.GWinToWin(200)).toString(16);
        },this);
        this.send.addFunction(function(self){
            wanToken.getTokenPrivacyData(web3Require.web3_ipc,self.curAddress,self.transPassword,self.privacyToken.stampWAddress,
                self.privacyToken.waddress,self.tokenAddress,self.toWAddress,web3Require.web3_ipc.toWei(self.amount),function(err,result){
                    if(!err)
                    {
                        self.transaction.from = result[0];
                        self.transaction.data = result[2];
                        self.privacyToken.toWAddress = result[1];
                        self.send.stepNext();
                    }
                    else
                    {
                        web3Require.exit(err);
                    }
                });
        },this,true);
        this.send.addFunction(function(self){
            self.funcResult = null;
            let privateKey = keyStore.getOTAPrivateKey(self.curAddress,self.transPassword,self.privacyToken.waddress);
            web3Require.logger.debug(self.transaction);
            let pass = '0x'+privateKey.toString('hex');
            web3Require.web3_ipc.wan.sendPrivacyCxtTransaction(self.transaction,pass,function (err,result) {
                if(!err){
                    console.log('Transaction hash: ' + result);
                    self.funcResult = result;
                    self.send.stepNext();
                }
                else
                {
                    web3Require.exit(err);
                }
            })
        },this,true);
        this.send.addFunction(function (self) {
            if(self.funcResult)
            {
                insertTransaction(self.funcResult,self.curAddress,self.toWAddress,self.amount,'Privacy');
                updatePrivacyStamps(self.privacyToken.stampWAddress,1);
                insertPrivacyTransaction(self.funcResult,self.curAddress,self.tokenAddress,self.privacyToken.waddress,
                    self.privacyToken.stampWAddress,self.privacyToken.toWAddress);
            }
            web3Require.exit(null);
        },this);
    },
    addSelectList(){
        let self = this;
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.TransListSchema('Input the transaction No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                var data = collection.WalletDBCollections.transCollection.find({'from': self.curAddress});
                if(data)
                {
                    data.forEach(function (item, index) {
                        schema.optionalArray.push(getCollectionItem(item));
                    });
                }
            }), function (result) {
            if(result)
            {
                Temp.curTransaction = result;
                web3Require.logger.debug(result);
                self.consoleTransactionInfo(Temp.curTransaction,function(){
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
        web3Require.addSchema(web3Require.schemaAll.OTAsListSchema('Input the OTAs No. :',
            'The Number is invalid or nonexistent.',function (schema) {
                schema.optionalArray = [];
                let wAddress = keyStore.getWAddress(self.curAddress);
                if(wAddress)
                {
                    var data = collection.WalletDBCollections.OTAsCollection.find({'toaddress': wAddress,'state': '0'});
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
                self.OTAAddress = result;
                var data = collection.WalletDBCollections.OTAsCollection.findOne({'waddress': self.OTAAddress});
                if(data)
                {
                    self.amount = data.value;
                    web3Require.logger.debug(data);
                }
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('This account have no OTA!');
            }
        });

    },
    //token
    getTokenBalance(bUpdate)
    {
        let self = this;
        var Data = collection.WalletDBCollections.tokenCollection.find({'address': this.curAddress});
        if(bUpdate)
        {
            if(Data) {
                Data.forEach(function (item, index) {
                    wanToken.getTokenBalance(web3Require.web3_ipc, item.tokenAddress, self.curAddress, function (err, result) {
                        if (!err) {
                            if (result > 0) {
                                item.value = result;
                                collection.WalletDBCollections.tokenCollection.update(item);
                            }
                            else {
                                collection.WalletDBCollections.tokenCollection.remove(item);
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
                self.tokenAddress = result;
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('You have no token balance.');
            }
        });
    },
    addTokenAddressFunc(func)
    {
        let self = this;
        var Temp = web3Require;
        web3Require.addSchema(web3Require.schemaAll.tokenAddress('Input the token address:',
            'The token address is invalid or nonexistent.'), function (result) {
            if (result) {
                self.tokenAddress = result.tokenAddress;
                func(result);
            }
        });
    },
    getTokenAddress()
    {
        this.addTokenAddressFunc(function (result) {
            web3Require.stepNext();
        })
    },
    addContractList()
    {
        let self = this;
        var Temp = web3Require;
        var schema = web3Require.schemaAll.contractSchema('Select an contract address by inputting No. (1, 2, 3..):',
            'You inputted the wrong number.',function (schema) {
                var data = Temp.contractCollection.find();
                if(data)
                {
                    data.forEach(function (item, index) {
                        var value = getCollectionItem(item);
                        schema.optionalArray.push(value);
                    });
                }
            });
//        schema.optionalArray = web3Require.accountArray;
        web3Require.addSchema(schema, function (result) {
            if(result)
            {
                self.tokenAddress = result;
                web3Require.stepNext();
            }
            else
            {
                web3Require.exit('You have no token balance.');
            }
        });
    },
    addContractBalanceList(callback)
    {
        let self = this;
        var Temp = web3Require;
        var schema = web3Require.schemaAll.contractBalanceSchema('Select an contract balance by inputting No. (1, 2, 3..):',
            'You inputted the wrong number.',function (schema) {
                schema.optionalArray = [];
                var find = collection.tokenOTADBCollections.tokenOTABalance.find({'owner':self.curAddress});
                if(find && find.length)
                {
                    for(var i=0;i<find.length;++i)
                    {
                        var item = collection.getCollectionItem(find[i]);
                        schema.optionalArray.push(item);
                    }
                }
            });
//        schema.optionalArray = web3Require.accountArray;
        web3Require.addSchema(schema, function (result) {
            if(result)
            {
                self.tokenAddress = result.tokenAddress;
                self.privacyToken.waddress = result.waddress;
                callback(self);
            }
            else
            {
                web3Require.exit('You have no token balance.');
            }
        });
    },
    addTokenAddress(bPrivacyToken)
    {
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.tokenAddress('Input the token address:',
            'The token address is invalid or nonexistent.'), function (result) {
            if(result) {
                self.tokenAddress = result.tokenAddress;
                if (!bPrivacyToken)
                {
                    wanToken.getTokenBalance(web3Require.web3_ipc,self.tokenAddress,self.curAddress,function (err,result) {
                        if (!err) {
                            if(result>0)
                            {
                                console.log('add new token balance : ' + self.tokenAddress + '; value : ' + web3Require.web3_ipc.fromWei(result));
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
                    web3Require.stepNext();
                }
            }
            else
            {
                web3Require.exit('this token balance have no coin!');
            }
        });
    },
    addTokenOTAaddress()
    {
        let self = this;
        web3Require.addSchema(web3Require.schemaAll.OTAAddress('Input the token OTA waddress:',
        'The token OTA waddress is invalid or nonexistent.'), function (result) {
            self.privacyToken.waddress = result.OTAAddress;
            wanToken.getTokenPrivacyBalance(web3Require.web3_ipc,self.tokenAddress,self.privacyToken.waddress,function (err,result) {
                if (!err) {
                    let value = parseFloat(web3Require.web3_ipc.fromWei(result));
                    if(value > 0)
                    {
                        console.log('add new token balance : ' + self.tokenAddress + '; value : ' + value);
                        collection.tokenOTADBCollections.insertTokenCollection(collection.tokenOTADBCollections.tokenOTABalance,
                            {owner:self.curAddress,waddress:self.privacyToken.waddress,tokenAddress:self.tokenAddress,value:value});
                    }
                    else
                    {
                        console.log('this token balance have no coin!');
                    }
                }
                web3Require.exit();
            });
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
    var found = collection.WalletDBCollections.transCollection.findOne({'transHash': transhash});
    if(found == null) {
        collection.WalletDBCollections.transCollection.insert({
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
function insertPrivacyOTAs(transhash,curAddress,contractAddr,tokenAddr,tokenWaddr)
{
    var found = web3Require.PrivacyOTACollection.findOne({'transHash': transhash});
    if(found == null) {
        web3Require.PrivacyOTACollection.insert({
            transhash: transhash,
            address: curAddress,
            contractAddr: contractAddr,
            tokenAddr:tokenAddr,
            tokenWaddr:tokenWaddr,
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function insertPrivacyStamps(curAddress,stampWAddress,stampValue)
{
    var found = collection.tokenOTADBCollections.tokenStampCollection.findOne({'waddress': stampWAddress});
    if(found == null) {
        collection.tokenOTADBCollections.tokenStampCollection.insert({
            waddress: stampWAddress,
            address: curAddress,
            value: stampValue,
            status:0,
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function updatePrivacyStamps(stampWAddress,status)
{
    var found = collection.tokenOTADBCollections.tokenStampCollection.findOne({'waddress': stampWAddress});
    if(found !== null) {
        found.status = status;
        collection.tokenOTADBCollections.tokenStampCollection.update(found);
    }

}
function insertPrivacyTransaction(transhash,curAddress,contractAddr,curTokenAddr,curStampAddr,toTokenWaddr)
{
    var found = collection.tokenOTADBCollections.tokenPrivacyTransCollection.findOne({'transHash': transhash});
    if(found == null) {
        collection.tokenOTADBCollections.tokenPrivacyTransCollection.insert({
            transhash: transhash,
            address: curAddress,
            contract: contractAddr,
            from:curTokenAddr,
            stamp:curStampAddr,
            to:toTokenWaddr
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function insertTokenBalance(address,tokenAddress,value)
{
    var data = {'address': address,'tokenAddress' : tokenAddress };
    var found = collection.WalletDBCollections.tokenCollection.findOne(data);
    if(found == null) {
        data.value = value;
        var result = collection.WalletDBCollections.tokenCollection.maxRecord('_id');
        if(result && result.value)
        {
            data._id = result.value + 1;
        }
        else
        {
            data._id = 1;
        }
        collection.WalletDBCollections.tokenCollection.insert(data);
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

module.exports = Transaction;


