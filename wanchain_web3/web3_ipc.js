var config = require('../config');
const Web3 = require("web3");
const fs = require('fs');
//const web3Admin = require('web3Admin.js');
var net = require('net');
const prompt = require('prompt');
var colors = require("colors/safe");
var optimist = require('optimist');
var schema = require('../Schema/SchemaAll');
let wanUtil = require('wanchain-util');
const Db = require('./db.js');
const web3Require ={
    schemaAll : schema,
    web3_ipc : new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net.Socket())),
    schemaArray: [],
    accountArray: [],
    initFunction:[],
    runUseDb: false,
//    curAccount : '',
    schemaIndex : 0,
    transCollection : null,
    OTAsCollection : null,

    //prompt functions
    init()
    {
        this.initFunction.forEach(function (func) {
            func();
        });
        prompt.override = optimist.argv;
        this.web3_ipc.wan = new wanUtil.web3Wan(this.web3_ipc);
        prompt.start();
        prompt.message = colors.blue("wanWallet");
        prompt.delimiter = colors.green(">>");
        this.schemaIndex = 0;
    },
    initTransCollection()
    {
        this.transCollection = Db.getCollection('transaction','transHash');
    },
    initOTAsCollection()
    {
        this.OTAsCollection = Db.getCollection('OTAs','OTAHash');
    },
    run(func)
    {
        try {
            var temp = this;
            Db.init().then(function () {
                    temp.runUseDb = true;
                    temp.init();
                    func();
                }).catch((err) => {
                    temp.exit(err);
            });
        }
        catch (e){
            this.exit(e);
        }
    },
    promptGet(schema, callback)
    {
        var temp = this;
        if(schema.preLoad)
        {
            schema.preLoad(schema);
        }
        if(schema.optionalArray)
        {
            if(schema.optionalArray.length>0)
            {
                schema.optionalArray.forEach(function (item, index) {
                    console.log(index+1 + '.    ' + JSON.stringify(item));
                });
            }
            else
            {
                callback(null);
                return;
            }
        }
        prompt.get(schema,function(err,result)
        {
            prompt.override = null;
            if(!err)
            {
                if(schema.optionalArray && schema.optionalArray.length>0) {
                    for (var key in result) {
                        var val = result[key];
                        if (val > schema.optionalArray.length) {
                            console.log("Input index cannot greater than " + schema.optionalArray.length + "! Please repeat!");
                            temp.runschemaStep();
                        }
                        else if (callback) {
                            callback([schema.optionalArray[val - 1], result]);
                        }
                        break;
                    }
                }
                else if (callback) {
                    callback(result);
                }
            }
            else
            {
                temp.exit(err);
            }
        });
    },
    addSchema(schema, callback)
    {
        this.schemaArray.push({schema:schema,callback:callback});
    },
    runschema()
    {
        var temp = this;
        Db.init().then(function () {
            temp.runUseDb = true;
            temp.runschemaWithoutDB();
        }).catch((err) => {
            temp.exit(err);
        });
    },
    runschemaWithoutDB()
    {
        try
        {
            this.init();
            this.runschemaStep();
        }
        catch (e)
        {
            this.exit(e);
        }
    },
    runschemaStep()
    {
        if(this.schemaIndex<this.schemaArray.length)
        {
            if(this.schemaArray[this.schemaIndex].schema.type)
            {
//                if(this.schemaArray[this.schemaIndex].schema.type === 'Account')
//                    this.promptAccount(this.schemaArray[this.schemaIndex].schema,this.schemaArray[this.schemaIndex].callback);
                if(this.schemaArray[this.schemaIndex].schema.type === 'fee')
                    this.promptFee(this.schemaArray[this.schemaIndex].schema,this.schemaArray[this.schemaIndex].callback);
                else
                    this.promptGet(this.schemaArray[this.schemaIndex].schema,this.schemaArray[this.schemaIndex].callback);
            }
            else
            {
                this.promptGet(this.schemaArray[this.schemaIndex].schema,this.schemaArray[this.schemaIndex].callback);
            }
        }
        else
        {
            this.exit('end of schema');
        }
    },
    stepNext()
    {
        ++this.schemaIndex;
        this.runschemaStep();
    },
    stepTo(index)
    {
        this.schemaIndex = index;
        this.runschemaStep();
    },
    exit(err)
    {
        if(err)
        {
            console.log(err);
        }
        console.log('process.exit');
        if(this.runUseDb)
        {
            Db.close().then(function (value) {
                      process.exit();
                },
                function (err) {
                    if(err)
                    {
                        console.log(err);
                    }
                    process.exit();
                }
            );
        }
        else
        {
            process.exit();
        }
    },

    //web3 functions
    getAccounts(callback)
    {
        var temp = this;
        this.web3_ipc.eth.getAccounts(function (err,results) {
            if(!err)
            {
                temp.accountArray = results;
                callback();
            }
            else
            {
                temp.exit(err);
            }

        });
    },
    promptAccount(schema, callback)
    {
        var temp = this;
        if(this.accountArray.length>0)
        {
            schema.optionalArray = this.accountArray;
            this.promptGet(schema, callback);
        }
        else
        {
            this.exit("You haven't account! Please create account first!");
        }
    },
    promptFee(schema, callback)
    {
        var temp = this;
        this.promptGet(schema, function (result) {
            console.log(result);
            if(result[1].FeeSel<schema.optionalArray.length)
            {
                temp.schemaIndex += 1;
                if(callback){
                    callback(result[1]);
                }
            }
            else
            {
                temp.stepNext();
            }
        });
    },

    addfeeSchema(callback)
    {
        var temp = this;
        this.addSchema(this.schemaAll.feeSchema('Select transaction fee by inputting No.:',
            'You inputted the wrong number.'), function (result) {
            callback(result);
        });
        this.addSchema(this.schemaAll.feeInputSchema(),function (result) {
            callback(result);
        })
    },
    getWAddress(address)
    {
        let keyStore = web3Require.getFromKeystoreFile(address);
        if(keyStore) {
            return keyStore.waddress;
        }
        return null;
    },

    getFromKeystoreFile(address)
    {
        let fileName = this.getKeystoreFile(address);
        if(fileName)
        {
            let keystoreStr = fs.readFileSync(fileName, "utf8");
            return JSON.parse(keystoreStr);
        }
        return null;
    },
    getKeystoreFile(address)
    {
        if(address.substr(0,2) == '0x' || address.substr(0,2) == '0X')
            address = address.substr(2);
        let keyStorePath = this.getKeystorePath();
        let files = fs.readdirSync(keyStorePath);
        for(var i in files) {
            var item = files[i];
            if(item.indexOf(address)>=0)
            {
                return keyStorePath + item;
            }
        }
    },
    getKeystorePath()
    {
        let curPath = config.rpcIpcPath;
        let nPos = curPath.lastIndexOf('/');
        if(nPos<0)
        {
            nPos = curPath.lastIndexOf('\\');
        }
        if(nPos>= 0)
        {
            curPath = curPath.substr(0,nPos+1);
        }
        curPath += 'keystore/';
        return curPath;
    },

};
module.exports = web3Require;
