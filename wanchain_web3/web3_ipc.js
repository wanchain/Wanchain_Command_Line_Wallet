var config = require('../config');
const Web3 = require("web3");
const fs = require('fs');
//const web3Admin = require('web3Admin.js');
var net = require('net');
const prompt = require('prompt');
var colors = require("colors/safe");
var optimist = require('optimist')
        .string(['password', 'repeatPass', 'toaddress' ,'waddress', 'tokenAddress']);
var schema = require('../Schema/SchemaAll');
let wanUtil = require('wanchain-util');
const Db = require('./collection.js').walletDB;
const scanDb = require('./collection.js').scanOTADB;

const logDebug = require('log4js');
let log4jsOptions = {
    appenders: {
        ruleConsole: {type: 'console'},
        ruleFile: {
            type: 'dateFile',
            filename: 'logs/server-',
            pattern: 'yyyy-MM-dd.log',
            maxLogSize: 10 * 1000 * 1000,
            numBackups: 3,
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {appenders: ['ruleConsole', 'ruleFile'], level: (config.loglevel || 'info')}
    }
};
if(config.logfile)
{
    log4jsOptions.appenders.ruleFile = {
        type: 'dateFile',
        filename: config.logfile,
        maxLogSize: 10 * 1000 * 1000,
        alwaysIncludePattern: true
    };
    log4jsOptions.categories.default.appenders.push('ruleFile');
}
logDebug.configure(log4jsOptions);
let web3_ipc_exit = false;
process.on('exit', function () {
    //handle your on exit code
    if(!web3_ipc_exit)
    {
        web3Require.exit('process exit');
        web3_ipc_exit = true;
    }
});
function initDbStack(dbArray,index,thenFunc,catchFunc)
{
    if(index<dbArray.length-1)
        dbArray[index].init().then(function () {
            initDbStack(dbArray,index+1,thenFunc,catchFunc);
        }).catch((err) => {
            catchFunc(err);
        });
    else
    {
        dbArray[index].init().then(function () {
            thenFunc();
        }).catch((err) => {
            catchFunc(err);
        });
    }
};
function closeDbStack(dbArray,index,thenFunc,catchFunc)
{
    if(index<dbArray.length-1)
        dbArray[index].close().then(function () {
            return closeDbStack(dbArray,index+1,thenFunc,catchFunc);
        }).catch((err) => {
            catchFunc(err);
        });
    else
    {
        dbArray[index].close().then(function () {
            thenFunc();
        }).catch((err) => {
            catchFunc(err);
        });
    }
};
const web3Require ={
    schemaAll : schema,
    web3_ipc : new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net.Socket())),
    dbArray : [],
    schemaArray: [],
    accountArray: [],
    initFunction:[],
    transCollection : null,
    OTAsCollection : null,
    tokenCollection : null,
    runUseDb: false,
//    curAccount : '',
    schemaIndex : 0,
    logger: logDebug.getLogger('wanchain'),

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
    //database
    initDatabase(thenFunc)
    {
        var temp = this;
        if(temp.dbArray.length>0)
        {
            initDbStack(temp.dbArray,0,thenFunc,function (err) {
                temp.exit(e);
            });
        }

    },

    closeDatabase(thenFunc)
    {
        if(this.dbArray.length>0)
        {
            return closeDbStack(this.dbArray,0,thenFunc,function (err) {
                temp.exit(e);
            });
        }

    },

    initTransCollection()
    {
        this.transCollection = Db.getCollection('transaction','transHash');
    },
    initOTAsCollection()
    {
        this.OTAsCollection = Db.getCollection('OTAsCollection');
    },
    initTokenCollection()
    {
        this.tokenCollection = Db.getCollection('tokenCollection');
    },
    run(func)
    {
        try {
            if(this.dbArray.length>0)
            {
                var temp = this;
                this.initDatabase(function () {
                    temp.runWithOutDB(func);
                });
            }
            else
            {
                this.runWithOutDB(func);
            }
        }
        catch (e){
            this.exit(e);
        }
    },
    runWithOutDB(func)
    {
        this.init();
        func();
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
                if(!config.noLogAccount)
                {
                    schema.optionalArray.forEach(function (item, index) {
                        console.log(index+1 + '.    ' + JSON.stringify(item));
                    });
                }
            }
            else
            {
                callback(null);
                return;
            }
        }
        prompt.get(schema,function(err,result)
        {
            for (var key in result) {
                if(prompt.override[key])
                {
                    delete prompt.override[key];
                }
            }
            if(!err)
            {
                temp.logger.debug(result);
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
        this.run(function () {
            temp.runschemaWithoutDB();
        })
    },
    runschemaWithoutDB()
    {
        try
        {
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
        web3_ipc_exit = true;
        if(err)
        {
            console.log(err);
        }
        this.logger.debug('process.exit');
        if(this.dbArray.length)
        {
            this.closeDatabase(function () {
                      process.exit();
                });
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
            temp.logger.debug(result);
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


    //sync functions
    getWAddress(address)
    {
        let keyStore = this.getKeystoreJSON(address);
        if(keyStore) {
            return keyStore.waddress;
        }
        return null;
    },

    getKeystoreJSON(address)
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
        return config.keyStorePath;
        /*
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
        */
    },

};
module.exports = web3Require;
