var config = require('../config');
const Web3 = require("web3");
//const web3Admin = require('web3Admin.js');
var net = require('net');
const prompt = require('prompt');
var colors = require("colors/safe");
var optimist = require('optimist')
        .string(['password', 'repeatPass','address', 'toaddress' ,'waddress','OTAaddress', 'tokenAddress','transHash','contractAddress',
            'OTAAddress','stampOTA']);
var schema = require('../Schema/SchemaAll');
let wanUtil = require('wanchain-util');
let collection = require('./collection.js');
const Db = collection.walletDB;
const scanDb = collection.scanOTADB;

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
//        web3_ipc_exit = true;
    }
});
function initDbStack(dbArray,index,thenFunc,catchFunc)
{
    let Item = dbArray[index];
    if(index<dbArray.length-1)
        Item.db.init().then(function () {
            if(Item.db.InitCollection && Item.collection)
            {
                Item.db.InitCollection(Item.collection);
            }
            initDbStack(dbArray,index+1,thenFunc,catchFunc);
        }).catch((err) => {
            catchFunc(err);
        });
    else
    {
        Item.db.init().then(function () {
            if(Item.db.InitCollection && Item.collection)
            {
                Item.db.InitCollection(Item.collection);
            }
            thenFunc();
        }).catch((err) => {
            catchFunc(err);
        });
    }
};
function closeDbStack(dbArray,index,thenFunc,catchFunc)
{
    if(index<dbArray.length-1)
        dbArray[index].db.close().then(function () {
            return closeDbStack(dbArray,index+1,thenFunc,catchFunc);
        }).catch((err) => {
            catchFunc(err);
        });
    else
    {
        dbArray[index].db.close().then(function () {
            thenFunc();
        }).catch((err) => {
            catchFunc(err);
        });
    }
};
let web3Require ={
    schemaAll : schema,
    web3_ipc : new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net.Socket())),
    dbArray : [],
    schemaArray: [],
    accountArray: [],
    initFunction:[],
//    curAccount : '',
    schemaIndex : 0,
    logger: logDebug.getLogger('wanchain'),

    //prompt functions
    useDb(dbAry)
    {
        this.dbArray = dbAry;
    },
    init()
    {
        this.web3_ipc.wan = new wanUtil.web3Wan(this.web3_ipc);
        this.logger.debug('rpcIpcPath:' + config.rpcIpcPath);
        this.logger.debug('keyStorePath:' + config.keyStorePath);
        this.initFunction.forEach(function (func) {
            func();
        });
        prompt.override = optimist.argv;
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
                temp.exit(err);
            });
        }

    },

    closeDatabase(thenFunc)
    {
        var temp = this;
        if(this.dbArray.length>0)
        {
            return closeDbStack(this.dbArray,0,thenFunc,function (err) {
                temp.exit(err);
            });
        }

    },
    initContractCollection()
    {
        this.contractCollection = Db.getCollection('contractCollection','consAddress');
    },
    fetchLocalContract()
    {
        let self = this;
        var data = collection.WalletDBCollections.find({'Type': 'contract'});
        if(data && data.length)
        {
            data.forEach(function (item,index){
                self.web3_ipc.eth.getTransactionReceipt(item.transHash,function (err,result) {
                    if(!err)
                    {
                        if(result.blockNumber && result.status == '0x1' &&
                            result.contractAddress && result.contractAddress.length>0){
                            insertConstract(result.contractAddress);
                        }
                    }
                    if(index == data.length-1)
                    {
                        self.exit('done');
                    }
                });
            });
        }
        else
        {
            self.exit('done');
        }
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
    promptGet(schema, callback,notListOption)
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
                if(!notListOption && config.listOption)
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
                if(schema.type == 'optional')
                {
                    var value = schema.checkResult(result);
                    if(!value)
                    {
                        let prop1;
                        for (var key in schema.properties) {
                            prop1 = schema.properties[key];
                            break;
                        }
                        console.log(prop1.message);
                        temp.promptGet(schema,callback,true);
                        return;
                    }
                    temp.logger.debug(result);
                    callback(value);
                }
                else if(schema.optionalArray && schema.optionalArray.length>0) {
                    for (var key in result) {
                        var val = result[key];
                        if (val > schema.optionalArray.length) {
                            console.log("Input index cannot greater than " + schema.optionalArray.length + ". Please retry.");
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
        if(err)
        {
            if(err.message && (!config.loglevel || config.loglevel !== 'debug'))
                console.log(err.message);
            else
                console.log(err);
        }
        if(!web3_ipc_exit)
        {
            web3_ipc_exit = true;

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
        }
    },

    //web3 functions
    getAccounts(callback)
    {
        var temp = this;
        this.web3_ipc.eth.getAccounts(function (err,results) {
            if(!err)
            {
                temp.accountArray = [];
                for(var i = 0;i<results.length;i++)
                {
                    temp.accountArray.push(wanUtil.toChecksumAddress(results[i]));

                }
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
        this.addSchema(this.schemaAll.feeSchema('Input the transaction fee:',
            'Invalid input.'), function (result) {
            callback(result);
        });
        this.addSchema(this.schemaAll.feeInputSchema(),function (result) {
            callback(result);
        })
    },


    //sync functions


};
function insertConstract(consAddress)
{
    var found = web3Require.contractCollection.findOne({'conAddress': consAddress});
    if(found == null) {
        web3Require.contractCollection.insert({
            conAddress: consAddress
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
module.exports = web3Require;
